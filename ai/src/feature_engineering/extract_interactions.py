from pathlib import Path
import pandas as pd
from sqlalchemy import create_engine
import numpy as np

from config import DATABASE_URL
from src.utils.io import ensure_dir, save_json

BASE = Path(__file__).resolve().parents[2]
DATA = BASE / "data"
MAPD = DATA / "mappings"
CSV  = DATA / "interactions.csv"

def main():
    ai = create_engine(DATABASE_URL, pool_pre_ping=True, future=True)
    it = pd.read_sql("SELECT user_id, project_id, weight, ts FROM raw_interactions", ai)

    # 유저/프로젝트 id → 연속 인덱스
    users = sorted(it["user_id"].dropna().unique().tolist())
    projs = sorted(it["project_id"].dropna().unique().tolist())
    u2i = {int(u):i for i,u in enumerate(users)}
    p2i = {int(p):i for i,p in enumerate(projs)}
    i2u = {i:int(u) for u,i in u2i.items()}
    i2p = {i:int(p) for p,i in p2i.items()}

    # 매핑 저장
    ensure_dir(MAPD / "users.json")
    save_json(u2i, MAPD / "users.json")
    save_json(p2i, MAPD / "projects.json")
    save_json(i2u, MAPD / "users_rev.json")
    save_json(i2p, MAPD / "projects_rev.json")

    # weight → [0,1] 정규화
    w = it["weight"].values.astype(np.float32)
    wmax = w.max() if len(w) else 1.0
    it["label"] = w / (wmax if wmax>0 else 1.0)

    it["u_idx"] = it["user_id"].map(u2i)
    it["p_idx"] = it["project_id"].map(p2i)
    out = it[["u_idx","p_idx","label"]].dropna()
    out = out.astype({"u_idx":"int64","p_idx":"int64","label":"float32"})

    ensure_dir(CSV)
    out.to_csv(CSV, index=False)
    print(f"interactions.csv saved: {len(out)} rows; users={len(users)}, items={len(projs)}")

if __name__ == "__main__":
    main()
