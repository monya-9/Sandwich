from pathlib import Path
import numpy as np
import torch
from ai.src.model.model import FeatureDeepRec
from ai.src.utils.redis import redis_client

BASE_DIR   = Path(__file__).resolve().parents[2]
MODEL_PATH = BASE_DIR / "models" / "best_feature_deeprec.pth"
DATA_CSV   = BASE_DIR / "data" / "interactions.csv"
USER_FEAT  = BASE_DIR / "data" / "user_skills.npy"
ITEM_FEAT  = BASE_DIR / "data" / "project_tools.npy"

def main():
    # (파일 존재 체크 생략)

    # 1) 데이터 로드
    arr = np.loadtxt(DATA_CSV, delimiter=",", skiprows=1, usecols=(0,1))
    user_feats = np.load(USER_FEAT)
    item_feats = np.load(ITEM_FEAT)

    num_users = int(arr[:,0].max() + 1)
    num_items = int(arr[:,1].max() + 1)

    # 2) 모델 로드
    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    model = FeatureDeepRec(
        num_users, num_items,
        user_feat_dim=user_feats.shape[1],
        item_feat_dim=item_feats.shape[1]
    ).to(device)
    model.load_state_dict(torch.load(MODEL_PATH, map_location=device))
    model.eval()

    # 3) 모든 유저에 대해 ZSET 업데이트
    pipe = redis_client.pipeline()
    for u in range(num_users):
        users = torch.full((num_items,), u, dtype=torch.long, device=device)
        items = torch.arange(num_items, dtype=torch.long, device=device)
        uf = torch.tensor(user_feats[u], device=device).unsqueeze(0).repeat(num_items,1)
        itf = torch.tensor(item_feats, device=device)
        with torch.no_grad():
            scores = model(users, items, uf, itf).cpu().numpy()

        key = f"recs:{u}"
        pipe.delete(key)  # 이전 추천 삭제
        # ZADD expects {member:score,...}
        mapping = {str(i): float(scores[i]) for i in range(num_items)}
        pipe.zadd(key, mapping)
    pipe.execute()

    print(f"✅ Redis ZSET으로 추천 캐시 업데이트 완료 for {num_users} users.")
