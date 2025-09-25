import os
import json
import math
import hashlib
from pathlib import Path
from collections import defaultdict
from datetime import datetime, timezone

import numpy as np
import pandas as pd
import torch
import redis
from sqlalchemy import create_engine

from src.config import (
    DATABASE_URL, REDIS_URL, INFER_CHUNK_ITEMS,
    WEIGHT_CONTENT, WEIGHT_VIEW, WEIGHT_LIKE, WEIGHT_COMMENT,
    WEIGHT_POPULARITY, WEIGHT_RECENCY, RECENCY_HALF_LIFE_DAYS,
    EXCLUDE_SEEN, STORE_MIN_SCORE, STORE_TOPK,
    TIE_BREAK_EPS, SCORE_TEMPERATURE
)
from src.model.model import FeatureDeepRec

BASE = Path(__file__).resolve().parents[2]
DATA = BASE / "data"
MAPD = DATA / "mappings"
MODEL_DIR = BASE / "models"
CKPT_PATH = MODEL_DIR / "best_feature_deeprec.pth"

def load_json(p: Path, default=None):
    try:
        return json.loads(p.read_text(encoding="utf-8"))
    except Exception:
        return {} if default is None else default

def dev_select():
    if torch.cuda.is_available():
        print(f"✔ GPU: {torch.cuda.get_device_name(0)}")
        torch.backends.cudnn.benchmark = True
        return torch.device("cuda")
    print("⚠ CPU inference")
    return torch.device("cpu")

def load_model_and_feats(dev):
    U = np.load(DATA / "user_skills.npy")       # [U, Fu]
    I = np.load(DATA / "project_tools.npy")     # [I, Fi]
    num_users, Fu = U.shape
    num_items, Fi = I.shape

    ckpt = torch.load(str(CKPT_PATH), map_location="cpu")
    # Determine embed_dim if available in checkpoint metadata (optional)
    embed_dim = 64
    if isinstance(ckpt, dict):
        embed_dim = ckpt.get("embed_dim", embed_dim)
    model = FeatureDeepRec(num_users, num_items, Fu, Fi, embed_dim=embed_dim).to(dev)

    # Support multiple checkpoint formats: raw state_dict, {'state_dict': ...}, {'model_state_dict': ...}
    if isinstance(ckpt, dict):
        if "state_dict" in ckpt:
            state_dict = ckpt["state_dict"]
        elif "model_state_dict" in ckpt:
            state_dict = ckpt["model_state_dict"]
        else:
            # Heuristic: if looks like a plain state_dict (has at least one known key)
            if any(k.startswith("user_id_emb") or k.startswith("item_id_emb") for k in ckpt.keys()):
                state_dict = ckpt
            else:
                raise RuntimeError("Unsupported checkpoint format: expected 'state_dict' or 'model_state_dict' or raw state_dict.")
    else:
        # Fallback: assume it's already a state_dict-like mapping
        state_dict = ckpt

    model.load_state_dict(state_dict)
    model.eval()

    U_t = torch.from_numpy(U).float().to(dev)
    I_t = torch.from_numpy(I).float().to(dev)
    with torch.no_grad():
        Ue = model.encode_user_feats(U_t)  # normed
        Ie = model.encode_item_feats(I_t)  # normed
    U_sum = U_t.sum(dim=1).detach().cpu().numpy()  # 스킬 유무 판정용
    return model, Ue, Ie, U_sum

def load_behavior_sets():
    ai = create_engine(DATABASE_URL, pool_pre_ping=True, future=True)
    df = pd.read_sql("SELECT user_id, project_id, event_type FROM raw_interactions", ai)

    u2i = load_json(MAPD / "users.json", {})
    p2i = load_json(MAPD / "projects.json", {})
    viewed, liked, commented = defaultdict(set), defaultdict(set), defaultdict(set)

    for _, row in df.iterrows():
        u = u2i.get(str(int(row["user_id"])))
        p = p2i.get(str(int(row["project_id"])))
        if u is None or p is None:
            continue
        et = str(row["event_type"]).lower()
        if et == "view":      viewed[u].add(p)
        elif et == "like":    liked[u].add(p)
        elif et == "comment": commented[u].add(p)

    return viewed, liked, commented

def load_fallback_arrays():
    ai = create_engine(DATABASE_URL, pool_pre_ping=True, future=True)
    p2i = load_json(MAPD / "projects.json", {})
    num_items = len(p2i)

    # popularity
    pop = pd.read_sql("SELECT project_id, pop_score FROM raw_item_popularity", ai)
    pop_map = {str(int(r["project_id"])): float(r["pop_score"]) for _, r in pop.iterrows()} if not pop.empty else {}
    pop_arr = np.zeros(num_items, dtype=np.float32)
    for pid_str, idx in p2i.items():
        pop_arr[idx] = pop_map.get(pid_str, 0.0)
    if pop_arr.max() > 0:
        pop_arr = pop_arr / pop_arr.max()

    # recency
    meta = pd.read_sql("SELECT project_id, created_at FROM raw_project_meta", ai)
    now = datetime.now(timezone.utc).timestamp()
    half = max(1.0, RECENCY_HALF_LIFE_DAYS) * 86400.0
    lam = math.log(2) / half
    rec_arr = np.zeros(num_items, dtype=np.float32)
    for _, r in meta.iterrows():
        pid = str(int(r["project_id"]))
        idx = p2i.get(pid)
        if idx is None:
            # 매핑에 없는 프로젝트는 건너뜀(0 유지)
            continue
        ts_val = r["created_at"]
        # created_at 처리: NaT/None → 0, naive → UTC 가정
        if pd.isna(ts_val):
            rec_arr[idx] = 0.0
            continue
        if hasattr(ts_val, "to_pydatetime"):
            dt = ts_val.to_pydatetime()
        else:
            dt = ts_val
        if getattr(dt, "tzinfo", None) is None:
            dt = dt.replace(tzinfo=timezone.utc)
        ts = dt.timestamp()
        rec_arr[idx] = math.exp(-lam * max(0.0, now - ts)) if ts else 0.0

    return pop_arr, rec_arr

def stable_jitter_array(length: int, salt: str = "recs") -> np.ndarray:
    """
    프로젝트 인덱스 i에 대해 결정론적이고 아주 작은 jitter 생성.
    """
    eps = TIE_BREAK_EPS
    out = np.zeros(length, dtype=np.float32)
    if eps <= 0:
        return out
    for i in range(length):
        h = hashlib.blake2b(f"{salt}:{i}".encode("utf-8"), digest_size=8).digest()
        val = int.from_bytes(h, "big") % 1_000_000  # 0..999999
        out[i] = eps * (val / 1_000_000.0)
    return out

def build_mapping(scores: np.ndarray, i2p: dict) -> dict:
    idx = np.arange(len(scores))
    vals = scores

    if STORE_MIN_SCORE > 0.0:
        m = vals > STORE_MIN_SCORE
        idx, vals = idx[m], vals[m]

    if STORE_TOPK and STORE_TOPK > 0 and len(vals) > STORE_TOPK:
        sel = np.argpartition(vals, -STORE_TOPK)[-STORE_TOPK:]
        sel = sel[np.argsort(-vals[sel])]
        idx, vals = idx[sel], vals[sel]

    return { str(i2p.get(str(i), i)): float(vals[j]) for j, i in enumerate(idx) }

def save_to_redis(u_idx: int, mapping: dict, r: redis.Redis):
    key = f"recs:{u_idx}"
    tmp = f"{key}:tmp"
    pipe = r.pipeline(transaction=True)
    pipe.delete(tmp)
    if mapping:
        pipe.zadd(tmp, mapping)
        pipe.rename(tmp, key)
    else:
        pipe.delete(key)
    try:
        pipe.execute()
    except redis.ResponseError:
        if mapping:
            r.zadd(tmp, {"_": 0.0})
            r.rename(tmp, key)

def apply_temperature(scores_np: np.ndarray) -> np.ndarray:
    """
    점수 분포가 납작할 때 차이를 키우기 위한 온도 스케일링.
    T<1 → 샤프닝, T>1 → 플래트닝, T=1 → 그대로
    """
    T = max(1e-6, SCORE_TEMPERATURE)
    if abs(T - 1.0) < 1e-6:
        return scores_np
    # [0,1] 범위 유지 가정, 미세 샤프닝
    # y = x^(1/T)
    y = np.power(np.clip(scores_np, 0.0, 1.0), 1.0 / T)
    return np.clip(y, 0.0, 1.0)

def main():
    dev = dev_select()
    _, Ue, Ie, U_sum = load_model_and_feats(dev)
    viewed, liked, commented = load_behavior_sets()
    pop_arr, rec_arr = load_fallback_arrays()

    num_users = Ue.size(0)
    num_items = Ie.size(0)
    i2p = load_json(MAPD / "projects_rev.json", {})

    r = redis.Redis.from_url(REDIS_URL, decode_responses=True)
    Ie_t = Ie.t().contiguous()
    chunk = max(1, int(os.getenv("INFER_CHUNK_ITEMS", INFER_CHUNK_ITEMS)))

    # fallback 및 jitter 미리 준비
    fb_base_np = WEIGHT_POPULARITY * pop_arr + WEIGHT_RECENCY * rec_arr
    fb_base_np = np.clip(fb_base_np, 0.0, 1.0)
    fb_base = torch.from_numpy(fb_base_np).to(dev)
    jitter_np = stable_jitter_array(num_items, salt="recs")  # 결정적 지터

    with torch.no_grad():
        for u in range(num_users):
            has_skill = (U_sum[u] > 0)

            # 1) 콘텐츠 성분
            if has_skill:
                sims = torch.empty(num_items, device=dev)
                s = 0
                while s < num_items:
                    e = min(s + chunk, num_items)
                    sims[s:e] = torch.matmul(Ue[u:u+1], Ie_t[:, s:e]).squeeze(0)
                    s = e
                base = WEIGHT_CONTENT * sims
            else:
                # 스킬이 없으면 콘텐츠 비중을 인기/신규로 대체
                base = WEIGHT_CONTENT * fb_base

            # 2) 행동 가중
            if not EXCLUDE_SEEN:
                if u in viewed and viewed[u]:
                    idx = torch.tensor(list(viewed[u]), device=dev, dtype=torch.long)
                    base.index_add_(0, idx, torch.full((len(idx),), WEIGHT_VIEW, device=dev))
                if u in liked and liked[u]:
                    idx = torch.tensor(list(liked[u]), device=dev, dtype=torch.long)
                    base.index_add_(0, idx, torch.full((len(idx),), WEIGHT_LIKE, device=dev))
                if u in commented and commented[u]:
                    idx = torch.tensor(list(commented[u]), device=dev, dtype=torch.long)
                    base.index_add_(0, idx, torch.full((len(idx),), WEIGHT_COMMENT, device=dev))
            else:
                seen = set()
                if u in viewed:    seen |= viewed[u]
                if u in liked:     seen |= liked[u]
                if u in commented: seen |= commented[u]
                if seen:
                    idx = torch.tensor(list(seen), device=dev, dtype=torch.long)
                    base[idx] = -1e9

            # 3) 점수 마무리: [0,1] 클램프 → 온도 스케일링 → 지터 추가 → 다시 클램프
            scores_np = torch.clamp(base, 0.0, 1.0).to("cpu").numpy()
            scores_np = apply_temperature(scores_np)
            if TIE_BREAK_EPS > 0:
                scores_np = np.clip(scores_np + jitter_np, 0.0, 1.0)

            # 4) 저장(슬림화)
            mapping = build_mapping(scores_np, i2p)
            save_to_redis(u, mapping, r)

    print("✅ inference with tie-break & temperature done.")

if __name__ == "__main__":
    main()
