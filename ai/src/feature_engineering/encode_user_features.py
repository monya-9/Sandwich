# src/feature_engineering/encode_user_features.py
from pathlib import Path
import os, json
import numpy as np
import pandas as pd
from sqlalchemy import create_engine, text

BASE = Path(__file__).resolve().parents[2]
DATA = BASE / "data"
MAPD = DATA / "mappings"
NPY  = DATA / "user_skills.npy"
VOC  = DATA / "user_vocab.json"

LOCK_STATIC = os.getenv("LOCK_STATIC", "1") == "1"  # ← 잠금 기본값: 켜짐

def ensure_dir(p: Path): p.parent.mkdir(parents=True, exist_ok=True)
def save_json(obj, p: Path):
    ensure_dir(p); p.write_text(json.dumps(obj, ensure_ascii=False, indent=2), encoding="utf-8")
def load_json(p: Path):
    if p.exists():
        return json.loads(p.read_text(encoding="utf-8"))
    return None

def load_env():
    for root in [BASE, BASE.parent, Path.cwd()]:
        f = root / ".env"
        if f.exists():
            env={}
            for line in f.read_text(encoding="utf-8").splitlines():
                s=line.strip()
                if not s or s.startswith("#") or "=" not in s: continue
                k,v=s.split("=",1); env[k.strip()]=v.strip().strip("'").strip('"')
            return env
    return {}
ENV = load_env()
MAIN_DB_URL = os.getenv("MAIN_DB_URL", ENV.get("MAIN_DB_URL",""))

def main():
    if not MAIN_DB_URL: raise SystemExit("MAIN_DB_URL not set")
    eng = create_engine(MAIN_DB_URL, pool_pre_ping=True, future=True)

    # 1) 활성 유저
    q_users = "select id::bigint as user_id from users where coalesce(is_deleted,false)=false"
    users = pd.read_sql(text(q_users), eng)["user_id"].astype("int64").tolist()
    users = sorted(set(users))

    # 2) 어휘: interest, position 이름 사용
    df_interest = pd.read_sql(text("select id::bigint as id, name from interest"), eng)
    df_interest["name"] = df_interest["name"].astype(str).str.strip().str.lower()
    iid2tok = dict(zip(df_interest["id"].astype("int64"), df_interest["name"]))

    df_position = pd.read_sql(text("select id::bigint as id, name from position"), eng)
    df_position["name"] = df_position["name"].astype(str).str.strip().str.lower()
    pid2tok = dict(zip(df_position["id"].astype("int64"), df_position["name"]))

    # 3) 매핑: user_interest / user_position
    ui = pd.read_sql(text(
        "select user_id::bigint as user_id, interest_id::bigint as iid from user_interest"
    ), eng)
    up = pd.read_sql(text(
        "select user_id::bigint as user_id, position_id::bigint as pid from user_position"
    ), eng)

    by_uid = {int(u): [] for u in users}
    for _, r in ui.iterrows():
        u = int(r["user_id"]); t = iid2tok.get(int(r["iid"]))
        if t and u in by_uid: by_uid[u].append(t)
    for _, r in up.iterrows():
        u = int(r["user_id"]); t = pid2tok.get(int(r["pid"]))
        if t and u in by_uid: by_uid[u].append(t)

    # 4) vocab 잠금/갱신
    existing_vocab = load_json(VOC)
    if LOCK_STATIC and existing_vocab is not None:
        vocab = existing_vocab  # 잠금: 기존 어휘만 사용 (새 토큰 무시)
    else:
        vocab = {}
        for toks in by_uid.values():
            for t in toks:
                if t not in vocab: vocab[t]=len(vocab)
        if not vocab: vocab["__none__"]=0

    # 5) 사용자 인덱스 잠금(행 수 고정)
    existing_users_map = load_json(MAPD / "users.json") if LOCK_STATIC else None
    if LOCK_STATIC and existing_users_map:
        # 저장된 사용자 인덱스 공간 유지 (u_idx == user_id 설계 유지)
        target_users = sorted(int(u) for u in existing_users_map.keys())
        max_u = max(target_users) if target_users else 0
    else:
        target_users = users
        max_u = max(users) if users else 0

    U = np.zeros((max_u + 1, len(vocab)), dtype=np.float32)

    for u, toks in by_uid.items():
        if LOCK_STATIC and existing_users_map and str(u) not in existing_users_map:
            # 잠금: 새 유저는 무시
            continue
        for t in toks:
            j = vocab.get(t)  # 잠금: 새 토큰은 없음 → 자동 무시
            if j is not None and 0 <= u <= max_u:
                U[u, j]=1.0

    # 6) 저장 (잠금이면 기존 매핑/어휘를 유지, 갱신이면 새로 저장)
    ensure_dir(MAPD / "users.json")
    if not (LOCK_STATIC and existing_users_map):
        save_json({str(u): int(u) for u in target_users}, MAPD / "users.json")
        save_json({str(u): int(u) for u in target_users}, MAPD / "users_rev.json")
    # vocab 저장(잠금이면 변경 없음)
    ensure_dir(NPY); np.save(NPY, U); save_json(vocab, VOC)
    print(f"[user] user_skills.npy {U.shape}, vocab={len(vocab)}, lock={LOCK_STATIC}")

if __name__ == "__main__":
    main()
