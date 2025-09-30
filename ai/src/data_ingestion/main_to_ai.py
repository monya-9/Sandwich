#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Generate mapping JSONs from real tables.
Fix: ensure ALL projects are included even if table name differs.
- Users: users where COALESCE(is_deleted,false)=false; u_idx == user_id
- Projects: from 'project' or 'projects' table, no filters; 0..N-1
- Only writes JSONs under project-root/data/mappings
"""
import os
import json
from pathlib import Path
from typing import Optional, List

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

def detect_project_table(conn) -> str:
    probe = """
    SELECT table_name
    FROM information_schema.tables
    WHERE table_schema NOT IN ('pg_catalog','information_schema')
      AND table_name IN ('project','projects')
    ORDER BY table_name
    """
    rows = conn.execute(text(probe)).fetchall()
    if not rows:
        # default to 'project'
        return "project"
    # prefer 'project' if both exist
    names = [r[0] for r in rows]
    return "project" if "project" in names else names[0]

def fetch_users(engine) -> List[int]:
    sql = "SELECT id::bigint AS user_id FROM users WHERE COALESCE(is_deleted,false)=false ORDER BY id"
    with engine.begin() as conn:
        df = pd.read_sql(text(sql), conn)
    return [int(x) for x in df["user_id"].tolist() if pd.notna(x)]

def fetch_projects(engine) -> List[int]:
    with engine.begin() as conn:
        tname = detect_project_table(conn)
        sql = f"SELECT id::bigint AS project_id FROM {tname} ORDER BY id"
        df = pd.read_sql(text(sql), conn)
    return [int(x) for x in df["project_id"].tolist() if pd.notna(x)]

def write_json(obj, path: Path):
    path.write_text(json.dumps(obj), encoding="utf-8")

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

    # Projects: 0..N-1 preserving ascending id order
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
