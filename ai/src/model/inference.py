import os
import json
import math
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
    EXCLUDE_SEEN
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
    embed_dim = ckpt.get("embed_dim", 64)
    model = FeatureDeepRec(num_users, num_items, Fu, Fi, embed_dim=embed_dim).to(dev)
    model.load_state_dict(ckpt["state_dict"] if "state_dict" in ckpt else ckpt)
    model.eval()

    U_t = torch.from_numpy(U).float().to(dev)
    I_t = torch.from_numpy(I).float().to(dev)
    with torch.no_grad():
        Ue = model.encode_user_feats(U_t)  # normed
        Ie = model.encode_item_feats(I_t)  # normed
    # 원본 유저 스킬의 “존재 여부” 판정용 합
    U_sum = U.sum(axis=1) if isinstance(U, np.ndarray) else U_t.sum(dim=1).cpu().numpy()
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
    """
    인기/신규 fallback 점수 배열을 p_idx 순서로 반환.
    pop_norm, recency_norm ∈ [0,1]
    """
    ai = create_engine(DATABASE_URL, pool_pre_ping=True, future=True)
    p2i = load_json(MAPD / "projects.json", {})
    num_items = len(p2i)

    # popularity
    pop = pd.read_sql("SELECT project_id, pop_score FROM raw_item_popularity", ai)
    pop_map = {str(int(r["project_id"])): float(r["pop_score"]) for _, r in pop.iterrows()} if not pop.empty else {}
    pop_arr = np.zeros(num_items, dtype=np.float32)
    for pid_str, idx in p2i.items():
        pop_arr[idx] = pop_map.get(pid_str, 0.0)
    # 정규화
    if pop_arr.max() > 0:
        pop_arr = pop_arr / pop_arr.max()

    # recency (created_at)
    meta = pd.read_sql("SELECT project_id, created_at FROM raw_project_meta", ai)
    now = datetime.now(timezone.utc).timestamp()
    half_life = max(1.0, RECENCY_HALF_LIFE_DAYS) * 86400.0  # 초
    lam = math.log(2) / half_life
    rec_map = {}
    for _, r in meta.iterrows():
        pid = str(int(r["project_id"]))
        ts = r["created_at"].timestamp() if pd.notna(r["created_at"]) else None
        if ts is None:
            rec_map[pid] = 0.0
        else:
            age = max(0.0, now - ts)
            rec_map[pid] = math.exp(-lam * age)
    rec_arr = np.zeros(num_items, dtype=np.float32)
    for pid_str, idx in p2i.items():
        rec_arr[idx] = rec_map.get(pid_str, 0.0)
    # 이미 [0,1] 범위

    return pop_arr, rec_arr

def save_to_redis(u_idx: int, scores: np.ndarray, i2p: dict, r: redis.Redis):
    scores = np.clip(scores, 0.0, 1.0)
    mapping = { str(i2p.get(str(i), i)): float(scores[i]) for i in range(len(scores)) }
    key = f"recs:{u_idx}"
    tmp = f"{key}:tmp"
    pipe = r.pipeline(transaction=True)
    pipe.delete(tmp)
    if mapping:
        pipe.zadd(tmp, mapping)
    pipe.rename(tmp, key)
    try:
        pipe.execute()
    except redis.ResponseError:
        r.zadd(tmp, {"_": 0.0})
        r.rename(tmp, key)

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

    with torch.no_grad():
        for u in range(num_users):
            has_skill = (U_sum[u] > 0)
            has_behavior = (u in viewed) or (u in liked) or (u in commented)

            # 1) 기본 점수(콘텐츠 유사도)
            if has_skill:
                sims = torch.empty(num_items, device=dev)
                start = 0
                while start < num_items:
                    end = min(start + chunk, num_items)
                    sims[start:end] = torch.matmul(Ue[u:u+1], Ie_t[:, start:end]).squeeze(0)
                    start = end
                base = WEIGHT_CONTENT * sims
            else:
                # 스킬 없음 → 콘텐츠 기여 0
                base = torch.zeros(num_items, device=dev)

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
                    base[idx] = -1e9  # 제거

            # 3) 콜드스타트 처리
            need_fallback = False
            if not has_skill and not has_behavior:
                # 스킬/행동 모두 없음 → 완전 콜드스타트
                need_fallback = True
            elif EXCLUDE_SEEN and not has_skill:
                # 스킬 없음 + 본 것 제외하면 점수가 전부 매우 낮을 수 있음
                need_fallback = True

            scores_np: np.ndarray
            if need_fallback:
                # 인기/신규 가중합
                fb = WEIGHT_POPULARITY * pop_arr + WEIGHT_RECENCY * rec_arr
                scores_np = np.clip(fb, 0.0, 1.0).astype(np.float32)
            else:
                scores_np = torch.clamp(base, 0.0, 1.0).to("cpu").numpy()

            # 4) 저장
            save_to_redis(u, scores_np, i2p, r)

    print("✅ inference (with cold-start fallback) done.")

if __name__ == "__main__":
    main()
