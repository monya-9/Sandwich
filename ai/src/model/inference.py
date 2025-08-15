import os
import json
from pathlib import Path
from collections import defaultdict

import numpy as np
import pandas as pd
import torch
import redis
from sqlalchemy import create_engine, text

from src.config import (
    DATABASE_URL, REDIS_URL, INFER_CHUNK_ITEMS,
    WEIGHT_CONTENT, WEIGHT_VIEW, WEIGHT_LIKE, WEIGHT_COMMENT,
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

def device_select():
    if torch.cuda.is_available():
        print(f"✔ GPU: {torch.cuda.get_device_name(0)}")
        torch.backends.cudnn.benchmark = True
        return torch.device("cuda")
    print("⚠ CPU inference")
    return torch.device("cpu")

def load_embeddings_from_model(dev):
    U = np.load(DATA / "user_skills.npy")       # [num_users, user_feat_dim]
    I = np.load(DATA / "project_tools.npy")     # [num_items, item_feat_dim]
    num_users, user_feat_dim = U.shape
    num_items, item_feat_dim = I.shape

    ckpt = torch.load(str(CKPT_PATH), map_location="cpu")
    embed_dim = ckpt.get("embed_dim", 64)
    model = FeatureDeepRec(
        num_users=num_users, num_items=num_items,
        user_feat_dim=user_feat_dim, item_feat_dim=item_feat_dim,
        embed_dim=embed_dim
    ).to(dev)
    model.load_state_dict(ckpt["state_dict"] if "state_dict" in ckpt else ckpt)
    model.eval()

    with torch.no_grad():
        u_feat = torch.from_numpy(U).float().to(dev)
        i_feat = torch.from_numpy(I).float().to(dev)
        Ue = model.encode_user_feats(u_feat)   # [U, D], L2 normed
        Ie = model.encode_item_feats(i_feat)   # [I, D], L2 normed
    return Ue, Ie

def load_interaction_sets():
    ai = create_engine(DATABASE_URL, pool_pre_ping=True, future=True)
    df = pd.read_sql("SELECT user_id, project_id, event_type FROM raw_interactions", ai)

    u2i = load_json(MAPD / "users.json", {})
    p2i = load_json(MAPD / "projects.json", {})
    # user_idx 로 키, value는 set(p_idx)
    viewed   = defaultdict(set)
    liked    = defaultdict(set)
    commented= defaultdict(set)

    for _, row in df.iterrows():
        u = u2i.get(str(int(row["user_id"])))
        p = p2i.get(str(int(row["project_id"])))
        if u is None or p is None:
            continue
        et = str(row["event_type"]).lower()
        if et == "view":
            viewed[u].add(p)
        elif et == "like":
            liked[u].add(p)
        elif et == "comment":
            commented[u].add(p)

    return viewed, liked, commented

def main():
    dev = device_select()

    # 1) 콘텐츠 유사도(코사인) 계산을 위한 임베딩 로드
    Ue, Ie = load_embeddings_from_model(dev)
    num_users = Ue.size(0)
    num_items = Ie.size(0)

    # 2) 상호작용 집합 로드(조회/좋아요/댓글)
    viewed, liked, commented = load_interaction_sets()

    # 3) 역매핑: p_idx → 원본 project_id (Redis에는 원본 ID를 저장)
    i2p = load_json(MAPD / "projects_rev.json", {})
    def pid_of(idx: int) -> str:
        return str(i2p.get(str(idx), idx))

    # 4) Redis 연결
    r = redis.Redis.from_url(REDIS_URL, decode_responses=True)

    # 5) 사용자별 점수 계산 및 Redis ZSET 저장
    with torch.no_grad():
        Ie_t = Ie.t().contiguous()  # [D, I]
        chunk = max(1, int(os.getenv("INFER_CHUNK_ITEMS", INFER_CHUNK_ITEMS)))

        for u in range(num_users):
            # 5-1) 콘텐츠 유사도: Ue[u] · Ie^T  (정규화되어 있어 코사인)
            # 아이템이 많을 경우 청크로 계산
            sims = torch.empty(num_items, device=dev)
            start = 0
            while start < num_items:
                end = min(start + chunk, num_items)
                # [1, D] x [D, end-start] → [end-start]
                sims[start:end] = torch.matmul(Ue[u:u+1], Ie_t[:, start:end]).squeeze(0)
                start = end

            # 5-2) 가중치 블렌딩
            score = WEIGHT_CONTENT * sims  # 콘텐츠 60%

            if not EXCLUDE_SEEN:
                # 조회/좋아요/댓글 부가 가중치(존재하면 더해줌)
                if u in viewed and viewed[u]:
                    idx = torch.tensor(list(viewed[u]), device=dev, dtype=torch.long)
                    score.index_add_(0, idx, torch.full_like(idx, fill_value=WEIGHT_VIEW, dtype=score.dtype))
                if u in liked and liked[u]:
                    idx = torch.tensor(list(liked[u]), device=dev, dtype=torch.long)
                    score.index_add_(0, idx, torch.full_like(idx, fill_value=WEIGHT_LIKE, dtype=score.dtype))
                if u in commented and commented[u]:
                    idx = torch.tensor(list(commented[u]), device=dev, dtype=torch.long)
                    score.index_add_(0, idx, torch.full_like(idx, fill_value=WEIGHT_COMMENT, dtype=score.dtype))
            else:
                # 이미 본/좋아요/댓글 아이템 제외
                seen = set()
                if u in viewed:    seen |= viewed[u]
                if u in liked:     seen |= liked[u]
                if u in commented: seen |= commented[u]
                if seen:
                    idx = torch.tensor(list(seen), device=dev, dtype=torch.long)
                    score[idx] = -1e9  # 사실상 제거

            # 5-3) 스코어 정리 및 CPU/파이썬 dict로 변환
            score = torch.clamp(score, 0.0, 1.0).to("cpu").numpy()
            mapping = { pid_of(i): float(score[i]) for i in range(num_items) }

            # 5-4) 원자적 스왑: tmp 키에 넣고 rename
            key = f"recs:{u}"
            tmp = f"{key}:tmp"
            pipe = r.pipeline(transaction=True)
            pipe.delete(tmp)
            if mapping:
                pipe.zadd(tmp, mapping)
            pipe.rename(tmp, key)  # tmp가 없으면 에러 → 위에서 항상 생성되도록 zadd/empty 처리
            try:
                pipe.execute()
            except redis.ResponseError:
                # tmp가 비었을 때 rename 실패 방지: 빈 키를 먼저 만들어줌
                r.zadd(tmp, {"_": 0.0})
                r.rename(tmp, key)

    print("종료")

if __name__ == "__main__":
    main()
