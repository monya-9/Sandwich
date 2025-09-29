from pathlib import Path
import json
import re
import numpy as np
import pandas as pd
from sqlalchemy import create_engine
from src.config import DATABASE_URL
from src.utils.io import load_json, save_json, ensure_dir

BASE = Path(__file__).resolve().parents[2]
DATA = BASE / "data"
MAPD = DATA / "mappings"
NPY  = DATA / "user_skills.npy"
VOC  = DATA / "user_vocab.json"

def truthy(x):
    try:
        if x is None or pd.isna(x):
            return False
    except Exception:
        if x is None:
            return False
    return bool(str(x).strip())

def tokenize(text):
    if text is None:
        return []
    try:
        if pd.isna(text):
            return []
    except Exception:
        pass
    s = str(text).strip()
    if not s:
        return []
    toks = re.split(r"[,/|\s]+", s.lower())
    return [t for t in toks if t]

def to_list(val):
    if val is None:
        return []
    try:
        if pd.isna(val):
            return []
    except Exception:
        pass
    if isinstance(val, (list, tuple)):
        return list(val)
    if isinstance(val, str):
        s = val.strip()
        if not s:
            return []
        try:
            parsed = json.loads(s)
            return parsed if isinstance(parsed, list) else []
        except Exception:
            return [s]
    return []

def main():
    ai = create_engine(DATABASE_URL, pool_pre_ping=True, future=True)
    df = pd.read_sql("SELECT user_id, skills, interests, position FROM raw_user_features", ai)
    df = df.replace({pd.NA: None})
    for col in ["skills", "position"]:
        if col in df.columns:
            df[col] = df[col].apply(lambda x: x.strip() if isinstance(x, str) else x)

    # u_idx == user_id mapping loaded
    u2i = load_json(MAPD / "users.json", {})
    if not u2i:
        raise RuntimeError("users.json is empty. Run mapping generation first.")

    # Build vocab from user features
    vocab = {}
    def add_tok(tok: str):
        if tok and tok not in vocab:
            vocab[tok] = len(vocab)

    by_uid = {}
    for _, row in df.iterrows():
        uid = int(row["user_id"])
        toks = []
        toks += tokenize(row.get("skills"))
        toks += [str(x).lower() for x in to_list(row.get("interests"))]
        pos = row.get("position")
        if truthy(pos):
            toks.append(str(pos).strip().lower())
        by_uid[uid] = toks
        for t in toks:
            add_tok(t)

    if not vocab:
        vocab["__none__"] = 0

    # Allocate rows by max u_idx + 1 to satisfy identity indexing
    idx_values = [int(v) for v in u2i.values()]
    max_idx = max(idx_values) if idx_values else -1
    rows = (max_idx + 1) if max_idx >= 0 else 0
    U = np.zeros((rows, len(vocab)), dtype=np.float32)

    # Fill using identity index
    for uid_str, idx in u2i.items():
        idx = int(idx)
        uid = int(uid_str)
        toks = by_uid.get(uid, [])
        if idx >= rows:
            # safety, should not happen due to rows=max_idx+1
            continue
        for t in toks:
            j = vocab.get(t)
            if j is not None:
                U[idx, j] = 1.0

    ensure_dir(NPY)
    np.save(NPY, U)
    save_json(vocab, VOC)
    print(f"user_skills.npy saved: shape={U.shape}, vocab={len(vocab)}")

if __name__ == "__main__":
    main()
