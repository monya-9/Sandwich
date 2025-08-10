from pathlib import Path
import numpy as np, torch
from src.model.model import FeatureDeepRec
from src.utils.redis import redis_client
from src.utils.io import load_json
from config import INFER_CHUNK_ITEMS

BASE = Path(__file__).resolve().parents[2]
DATA = BASE / "data"
UFNP = DATA / "user_skills.npy"
IFNP = DATA / "project_tools.npy"
MODEL= BASE / "models" / "best_feature_deeprec.pth"
MAPD = DATA / "mappings"

def to_dev(x, dev):
    t = torch.as_tensor(x, device=dev) if not torch.is_tensor(x) else x.to(dev)
    return t

def main():
    if not MODEL.exists(): raise FileNotFoundError(MODEL)
    U = np.load(UFNP); I = np.load(IFNP)
    num_users, num_items = U.shape[0], I.shape[0]

    # index → 원래 id
    p_rev = load_json(MAPD / "projects_rev.json", {})
    if len(p_rev) != num_items:
        print("⚠ project mapping size mismatch. continue anyway.")

    dev = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    model = FeatureDeepRec(num_users, num_items, U.shape[1], I.shape[1]).to(dev)
    model.load_state_dict(torch.load(MODEL, map_location=dev))
    model.eval()

    It = to_dev(I, dev)
    pipe = redis_client.pipeline()

    for u in range(num_users):
        Uf = to_dev(U[u], dev).unsqueeze(0)
        scores_all = []

        for s in range(0, num_items, INFER_CHUNK_ITEMS):
            e = min(s + INFER_CHUNK_ITEMS, num_items)
            items = torch.arange(s, e, device=dev, dtype=torch.long)
            uf_rep = Uf.repeat(e - s, 1)
            users  = torch.full((e - s,), u, dtype=torch.long, device=dev)
            with torch.no_grad():
                sc = model(users, items, uf_rep, It[s:e])
            scores_all.append(sc.detach().cpu())

        scores = torch.cat(scores_all, dim=0).numpy()
        key = f"recs:{u}"
        tmp = f"{key}:tmp"
        pipe.delete(tmp)
        # member는 원래 project_id (문자열)
        mapping = {str(p_rev.get(str(i), i)): float(scores[i]) for i in range(num_items)}
        pipe.zadd(tmp, mapping)
        pipe.rename(tmp, key)

    pipe.execute()
    print(f"Redis ZSET updated: users={num_users}, items={num_items}")

if __name__=="__main__":
    main()
