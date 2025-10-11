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
NPY  = DATA / "project_tools.npy"
VOC  = DATA / "item_vocab.json"

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
    df = pd.read_sql("SELECT project_id, tools, hashtags FROM raw_project_features", ai)
    df = df.replace({pd.NA: None})
    if "tools" in df.columns:
        df["tools"] = df["tools"].apply(lambda x: x.strip() if isinstance(x, str) else x)

    p2i = load_json(MAPD / "projects.json", {})
    projs_order = sorted(p2i.items(), key=lambda x: int(x[1]))  # (project_id, idx)

    vocab = {}
    def add_tok(tok: str):
        if tok and tok not in vocab:
            vocab[tok] = len(vocab)

    by_pid = {}
    for _, row in df.iterrows():
        pid = int(row["project_id"])
        tools = row.get("tools")
        hashtags = row.get("hashtags")
        by_pid[pid] = {"tools": tools, "hashtags": hashtags}
        for t in tokenize(tools): add_tok(t)
        for h in [str(x).lower() for x in to_list(hashtags)]: add_tok(h)

    if not vocab:
        vocab["__none__"] = 0

    I = np.zeros((len(p2i), len(vocab)), dtype=np.float32)

    for pid, idx in projs_order:
        pid = int(pid); idx = int(idx)
        row = by_pid.get(pid)
        if row is None:
            continue
        toks = []
        toks += tokenize(row.get("tools"))
        toks += [str(x).lower() for x in to_list(row.get("hashtags"))]
        for t in toks:
            j = vocab.get(t)
            if j is not None:
                I[idx, j] = 1.0

    ensure_dir(NPY)
    np.save(NPY, I)
    save_json(vocab, VOC)
    print(f"project_tools.npy saved: shape={I.shape}, vocab={len(vocab)}")

if __name__ == "__main__":
    main()
