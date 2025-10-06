from pathlib import Path
import pandas as pd
from sqlalchemy import create_engine, text
import numpy as np

from src.config import MAIN_DB_URL, DATABASE_URL
from src.utils.io import ensure_dir, save_json

BASE = Path(__file__).resolve().parents[2]
DATA = BASE / "data"
MAPD = DATA / "mappings"
CSV  = DATA / "interactions.csv"

ACTIVE_USERS_SQL = """
SELECT id::bigint AS user_id
FROM users
WHERE COALESCE(is_deleted,false)=false
"""

def main():
    # 원천: AI DB의 raw_interactions
    ai = create_engine(DATABASE_URL, pool_pre_ping=True, future=True)
    it = pd.read_sql("SELECT user_id, project_id, weight, ts FROM raw_interactions", ai)

    # 활성 사용자: 홈페이지 DB에서 삭제 아닌 사용자만
    src = create_engine(MAIN_DB_URL, pool_pre_ping=True, future=True)
    with src.begin() as conn:
        active_users = pd.read_sql(text(ACTIVE_USERS_SQL), conn)["user_id"].astype("int64").tolist()
    active_users_set = set(active_users)

    # 활성 사용자만 남김
    it = it[it["user_id"].isin(active_users_set)].copy()

    # users: 동일값 매핑(u_idx == user_id)
    users = sorted(set(it["user_id"].astype("int64").tolist()) | active_users_set)
    u2i = {int(u): int(u) for u in users}
    i2u = {int(u): int(u) for u in users}

    # projects: 0..N-1 인덱싱
    projs = sorted(it["project_id"].dropna().unique().astype("int64").tolist())
    p2i = {int(p): i for i, p in enumerate(projs)}
    i2p = {i: int(p) for p, i in p2i.items()}

    # 매핑 저장
    ensure_dir(MAPD / "users.json")
    save_json({str(k): v for k, v in u2i.items()}, MAPD / "users.json")
    save_json({str(k): v for k, v in p2i.items()}, MAPD / "projects.json")
    save_json({str(k): v for k, v in i2u.items()}, MAPD / "users_rev.json")
    save_json({str(k): v for k, v in i2p.items()}, MAPD / "projects_rev.json")

    # weight → [0,1] 정규화
    w = it["weight"].values.astype(np.float32)
    wmax = w.max() if len(w) else 1.0
    it["label"] = w / (wmax if wmax > 0 else 1.0)

    # 인덱스 적용
    it["u_idx"] = it["user_id"].map(u2i)
    it["p_idx"] = it["project_id"].map(p2i)

    out = it[["u_idx", "p_idx", "label"]].dropna()
    out = out.astype({"u_idx": "int64", "p_idx": "int64", "label": "float32"})

    ensure_dir(CSV)
    out.to_csv(CSV, index=False)
    print(f"interactions.csv saved: {len(out)} rows; users={len(users)}, items={len(projs)}")

if __name__ == "__main__":
    main()
