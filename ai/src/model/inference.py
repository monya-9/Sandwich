from pathlib import Path
import numpy as np
import torch
from ai.src.model.model import NeuMF
from ai.src.utils.redis import redis_client

# ─── 프로젝트 루트 & 파일 경로 ───────────────────────────
BASE_DIR    = Path(__file__).resolve().parents[2]
MODEL_PATH  = BASE_DIR / "models" / "neumf.pth"
DATA_CSV    = BASE_DIR / "data" / "interactions.csv"

def main():
    # 1) 파일 존재 체크
    if not MODEL_PATH.exists():
        raise FileNotFoundError(f"{MODEL_PATH} 이(가) 없습니다. train.py 를 실행해 모델을 생성하세요.")
    if not DATA_CSV.exists():
        raise FileNotFoundError(f"{DATA_CSV} 이(가) 없습니다. extract_interactions.py 로 data 생성 후 실행하세요.")

    # 2) 데이터 로드
    arr = np.loadtxt(DATA_CSV, delimiter=",", skiprows=1, usecols=(0,1))
    num_users = int(arr[:,0].max() + 1)
    num_items = int(arr[:,1].max() + 1)

    # 3) 모델 로드
    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    model = NeuMF(num_users, num_items).to(device)
    model.load_state_dict(torch.load(MODEL_PATH, map_location=device))
    model.eval()

    # 4) Top-K 추천 계산 & Redis 저장
    K = 10
    for u in range(num_users):
        users  = torch.full((num_items,), u, dtype=torch.long, device=device)
        items  = torch.arange(num_items, dtype=torch.long, device=device)
        with torch.no_grad():
            scores = model(users, items).cpu().numpy()
        topk = scores.argsort()[-K:][::-1].tolist()

        key = f"recs:{u}"
        redis_client.delete(key)
        if topk:
            redis_client.rpush(key, *topk)

    print(f"추천 캐시 업데이트(users={num_users}, items={num_items}, K={K})")

    # 5) Redis
    print("\nRedis 저장 데이터 샘플 확인")
    sample_users = list(range(min(5, num_users)))
    for u in sample_users:
        stored = redis_client.lrange(f"recs:{u}", 0, K-1)
        recs = [int(x) for x in stored]
        print(f"User {u}: {recs}")

if __name__ == "__main__":
    main()
