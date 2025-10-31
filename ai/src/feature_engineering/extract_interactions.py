# src/feature_engineering/extract_interactions.py
from pathlib import Path
import os, json
import numpy as np
import pandas as pd
from sqlalchemy import create_engine, text

BASE = Path(__file__).resolve().parents[2]
DATA = BASE / "data"
MAPD = DATA / "mappings"
CSV  = DATA / "interactions.csv"

LOCK_STATIC = os.getenv("LOCK_STATIC", "1") == "1"  # ← 잠금 기본값: 켜짐

def ensure_dir(p: Path):
    p.parent.mkdir(parents=True, exist_ok=True)

def save_json(obj, p: Path):
    ensure_dir(p)
    p.write_text(json.dumps(obj, ensure_ascii=False, indent=2), encoding="utf-8")

def load_json(p: Path):
    if p.exists():
        return json.loads(p.read_text(encoding="utf-8"))
    return None

def load_env() -> dict:
    for root in [BASE, BASE.parent, Path.cwd()]:
        f = root / ".env"
        if f.exists():
            env = {}
            for line in f.read_text(encoding="utf-8").splitlines():
                s = line.strip()
                if not s or s.startswith("#") or "=" not in s:
                    continue
                k, v = s.split("=", 1)
                env[k.strip()] = v.strip().strip("'").strip('"')
            return env
    return {}

ENV = load_env()
MAIN_DB_URL = os.getenv("MAIN_DB_URL", ENV.get("MAIN_DB_URL", ""))

def table_exists(conn, t: str) -> bool:
    return (conn.execute(text(
        "select count(*) from information_schema.tables where table_name=:t"
    ), {"t": t}).scalar() or 0) > 0

def col_exists(conn, t: str, c: str) -> bool:
    return (conn.execute(text(
        "select count(*) from information_schema.columns where table_name=:t and column_name=:c"
    ), {"t": t, "c": c}).scalar() or 0) > 0

def pick(conn, table: str, candidates):
    for c in candidates:
        if col_exists(conn, table, c):
            return c
    return None

def read_source(conn, table: str, u_cands, p_cands, ts_cands, where_sql: str, weight: float):
    if not table_exists(conn, table):
        return None
    ucol = pick(conn, table, u_cands)
    pcol = pick(conn, table, p_cands)
    if not ucol or not pcol:
        return None
    tscol = pick(conn, table, ts_cands) or "created_at"
    q = text(f"select {ucol}::bigint as user_id, {pcol}::bigint as project_id, {tscol} as ts from {table}{where_sql}")
    df = pd.read_sql(q, conn)
    if df.empty:
        return None
    df["weight"] = weight
    return df

# 가중치
W_LIKE, W_COMMENT, W_VIEW = 3.0, 5.0, 1.0

def main():
    if not MAIN_DB_URL:
        raise SystemExit("MAIN_DB_URL not set")

    eng = create_engine(MAIN_DB_URL, pool_pre_ping=True, future=True)

    with eng.begin() as conn:
        # 활성 유저
        has_is_deleted = col_exists(conn, "users", "is_deleted")
        q_users = "select id::bigint as user_id from users" + (" where coalesce(is_deleted,false)=false" if has_is_deleted else "")
        active_users = pd.read_sql(text(q_users), conn)["user_id"].astype("int64").tolist()
        active_set = set(active_users)

        # 프로젝트 매핑 (잠금이면 projects.json 고정, 아니면 현재 DB로 생성)
        existing_p2i = load_json(MAPD / "projects.json") if LOCK_STATIC else None
        if existing_p2i:
            p2i = {int(k): int(v) for k, v in existing_p2i.items()}
            i2p = {int(v): int(k) for k, v in existing_p2i.items()}
        else:
            pid_col = "id" if col_exists(conn, "project", "id") else "project_id"
            proj_df = pd.read_sql(text(f"select {pid_col}::bigint as project_id from project"), conn)
            projects = sorted(proj_df["project_id"].astype("int64").tolist())
            p2i = {int(p): i for i, p in enumerate(projects)}
            i2p = {i: p for p, i in p2i.items()}
            save_json({str(k): v for k, v in p2i.items()}, MAPD / "projects.json")
            save_json({str(k): v for k, v in i2p.items()}, MAPD / "projects_rev.json")

        dfs = []

        # likes
        df_likes = read_source(
            conn,
            table="likes",
            u_cands=["user_id", "from_user_id"],
            p_cands=["project_id", "target_id"],
            ts_cands=["created_at", "ts", "updated_at"],
            where_sql=" where target_type='PROJECT'" if col_exists(conn, "likes", "target_type") else "",
            weight=W_LIKE
        )
        if df_likes is not None: dfs.append(df_likes)

        # comment
        df_comment = read_source(
            conn,
            table="comment",
            u_cands=["user_id"],
            p_cands=["project_id", "commentable_id"],
            ts_cands=["created_at", "ts", "updated_at"],
            where_sql=" where commentable_type='PROJECT'" if col_exists(conn, "comment", "commentable_type") else "",
            weight=W_COMMENT
        )
        if df_comment is not None: dfs.append(df_comment)

        # project_views(viewer_id)
        df_views = read_source(
            conn,
            table="project_views",
            u_cands=["viewer_id", "user_id"],
            p_cands=["project_id"],
            ts_cands=["ts", "created_at", "viewed_at"],
            where_sql="",
            weight=W_VIEW
        )
        if df_views is not None: dfs.append(df_views)

    if not dfs:
        raise SystemExit("no interaction sources")

    it = pd.concat(dfs, ignore_index=True)
    it = it.dropna(subset=["user_id","project_id"]).copy()
    it["user_id"] = it["user_id"].astype("int64")
    it["project_id"] = it["project_id"].astype("int64")

    # 활성 유저 필터
    it = it[it["user_id"].isin(active_set)].copy()

    # u_idx 매핑 잠금(유저 사전이 있으면 그 범위로, 없으면 아이덴티티로)
    existing_users_map = load_json(MAPD / "users.json") if LOCK_STATIC else None
    if existing_users_map:
        u2i = {int(k): int(v) for k, v in existing_users_map.items()}  # 보통 u_idx == user_id
    else:
        users = sorted(set(it["user_id"].tolist()) | active_set)
        u2i = {int(u): int(u) for u in users}
        save_json({str(k): v for k, v in u2i.items()}, MAPD / "users.json")
        save_json({str(k): v for k, v in u2i.items()}, MAPD / "users_rev.json")

    it["u_idx"] = it["user_id"].map(u2i)
    it["p_idx"] = it["project_id"].map(p2i)
    # 잠금: 매핑에 없는 신규 프로젝트/유저는 떨어져 나감
    it = it.dropna(subset=["u_idx","p_idx"]).copy()
    it["u_idx"] = it["u_idx"].astype("int64")
    it["p_idx"] = it["p_idx"].astype("int64")

    # [0,1] 정규화
    w = it["weight"].values.astype(np.float32)
    wmax = float(w.max()) if len(w) else 1.0
    it["label"] = w / (wmax if wmax>0 else 1.0)

    out = it[["u_idx","p_idx","label"]].astype({"u_idx":"int64","p_idx":"int64","label":"float32"})
    ensure_dir(CSV); out.to_csv(CSV, index=False)

    # projects/users 매핑은 위에서 필요 시에만 저장
    print(f"[interactions] rows={len(out)}, users={len(set(out.u_idx))}, items={len(set(out.p_idx))}, lock={LOCK_STATIC}")

if __name__ == "__main__":
    main()
