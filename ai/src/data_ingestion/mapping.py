import os
import json
from pathlib import Path
from typing import Optional, List, Tuple

import pandas as pd
from sqlalchemy import create_engine, text

HERE = Path(__file__).resolve().parent

def find_env(start: Path) -> Optional[Path]:
    for p in [start, *start.parents]:
        envp = p / ".env"
        if envp.exists():
            return envp
    return None

def load_env(env_path: Path) -> dict:
    env = {}
    for raw in env_path.read_text(encoding="utf-8").splitlines():
        s = raw.strip()
        if not s or s.startswith("#") or "=" not in s:
            continue
        k, v = s.split("=", 1)
        v = v.strip().strip('"').strip("'")
        env[k.strip()] = v
    return env

def ensure_outdir(base: Path) -> Path:
    out = base / "data" / "mappings"
    out.mkdir(parents=True, exist_ok=True)
    return out

# ---------- DB fetchers ----------
def fetch_users(engine) -> List[int]:
    # is_deleted이 없으면 필터 없이 조회
    with engine.begin() as conn:
        has_is_deleted = conn.execute(text("""
            select 1 from information_schema.columns
            where table_name='users' and column_name='is_deleted'
        """)).fetchone() is not None

        if has_is_deleted:
            sql = "SELECT id::bigint AS user_id FROM users WHERE COALESCE(is_deleted,false)=false ORDER BY id"
        else:
            sql = "SELECT id::bigint AS user_id FROM users ORDER BY id"

        df = pd.read_sql(text(sql), conn)

    return [int(x) for x in df["user_id"].tolist() if pd.notna(x)]

def _project_id_col(conn) -> str:
    # id 우선, 없으면 project_id 사용
    cols = conn.execute(text("""
        select column_name
        from information_schema.columns
        where table_name='project' and column_name in ('id','project_id')
    """)).fetchall()
    names = {r[0] for r in cols}
    if 'id' in names:
        return 'id'
    if 'project_id' in names:
        return 'project_id'
    # 마지막 안전장치: id 가정
    return 'id'

def _project_optional_filters(conn) -> str:
    has_deleted_at = conn.execute(text("""
        select 1 from information_schema.columns
        where table_name='project' and column_name='deleted_at'
    """)).fetchone() is not None
    has_private = conn.execute(text("""
        select 1 from information_schema.columns
        where table_name='project' and column_name='is_private'
    """)).fetchone() is not None

    where = []
    if has_deleted_at:
        where.append("deleted_at is null")
    if has_private:
        where.append("(is_private = false or is_private is null)")
    return (" where " + " and ".join(where)) if where else ""

def fetch_projects(engine) -> List[int]:
    with engine.begin() as conn:
        id_col = _project_id_col(conn)
        where_sql = _project_optional_filters(conn)
        sql = f'SELECT {id_col}::bigint AS project_id FROM project{where_sql} ORDER BY {id_col}'
        df = pd.read_sql(text(sql), conn)
    return [int(x) for x in df["project_id"].tolist() if pd.notna(x)]

# ---------- IO ----------
def write_json(obj, path: Path):
    path.write_text(json.dumps(obj, ensure_ascii=False), encoding="utf-8")

# ---------- main ----------
def main():
    env_path = find_env(HERE)
    if not env_path:
        raise SystemExit("'.env' not found near project root.")
    env = load_env(env_path)

    main_db_url = env.get("MAIN_DB_URL") or os.getenv("MAIN_DB_URL")
    if not main_db_url:
        raise SystemExit("MAIN_DB_URL not set in .env or environment")

    eng = create_engine(main_db_url, pool_pre_ping=True, future=True)

    users = fetch_users(eng)
    projects = fetch_projects(eng)

    # Users: identity mapping
    u2i = {str(u): int(u) for u in users}
    i2u = {str(int(u)): int(u) for u in users}

    # Projects: 0..N-1 preserving ascending project id order
    p2i = {str(p): i for i, p in enumerate(projects)}
    i2p = {str(i): p for p, i in p2i.items()}

    outdir = ensure_outdir(env_path.parent)
    write_json(u2i, outdir / "users.json")
    write_json(i2u, outdir / "users_rev.json")
    write_json(p2i, outdir / "projects.json")
    write_json(i2p, outdir / "projects_rev.json")

    print(f"OK users={len(users)} projects={len(projects)} -> {outdir}")

if __name__ == "__main__":
    main()
