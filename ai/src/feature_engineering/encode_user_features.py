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
def is_missing(x):
    try:
        return x is None or pd.isna(x)
    except Exception:
        return x is None

def truthy(x):
    # pd.NA / None / 공백 문자열 모두 False 처리
    try:
        if x is None or pd.isna(x):
            return False
    except Exception:
        if x is None:
            return False
    return bool(str(x).strip())

def tokenize(text):
    # pd.NA, None, 빈 문자열 모두 처리
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
    # interests가 NA/None/문자열(JSON)/리스트 모두 안전 처리
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
        val = val.strip()
        if not val:
            return []
        try:
            parsed = json.loads(val)
            return parsed if isinstance(parsed, list) else []
        except Exception:
            return [val]  # 그냥 단일 문자열로 취급
    return []

def main():
    ai = create_engine(DATABASE_URL, pool_pre_ping=True, future=True)
    df = pd.read_sql("SELECT user_id, skills, interests, position FROM raw_user_features", ai)

    # 결측치 정리: pd.NA -> None 로 통일
    df = df.replace({pd.NA: None})
    # (선택) 문자열 칼럼은 strip 적용을 원한다면:
    for col in ["skills", "position"]:
        if col in df.columns:
            df[col] = df[col].apply(lambda x: x.strip() if isinstance(x, str) else x)

    u2i = load_json(MAPD / "users.json", {})
    users_order = sorted(u2i.items(), key=lambda x: x[1])  # (uid, idx) by idx

    # vocab 수집
    vocab = {}
    def add_tok(tok: str):
        if tok and tok not in vocab:
            vocab[tok] = len(vocab)

    # dtype 보정
    if "skills" in df.columns:
        df["skills"] = df["skills"].astype("string").where(df["skills"].notna(), None)
    if "position" in df.columns:
        df["position"] = df["position"].astype("string").where(df["position"].notna(), None)

    # 사전화: Series → dict 로 바꿔 Truthiness 문제 제거
    by_uid = {}
    for _, row in df.iterrows():
        uid = int(row["user_id"])
        by_uid[uid] = {
            "skills": row.get("skills"),
            "interests": row.get("interests"),
            "position": row.get("position"),
        }
        # vocab 업데이트
        for t in tokenize(row.get("skills")): add_tok(t)
        for t in [str(x).lower() for x in to_list(row.get("interests"))]: add_tok(t)
        pos = row.get("position")
        if truthy(pos):
            add_tok(str(pos).strip().lower())

    if not vocab:
        vocab["__none__"] = 0

    U = np.zeros((len(u2i), len(vocab)), dtype=np.float32)

    for uid, idx in users_order:
        uid = int(uid)
        row = by_uid.get(uid)
        if row is None:
            continue  # ← 여기! Series가 아니니 안전
        toks = []
        toks += tokenize(row.get("skills"))
        toks += [str(x).lower() for x in to_list(row.get("interests"))]
        pos = row.get("position")
        if truthy(pos):
            toks.append(str(pos).strip().lower())

    ensure_dir(NPY)
    np.save(NPY, U)
    save_json(vocab, VOC)
    print(f"user_skills.npy saved: shape={U.shape}, vocab={len(vocab)}")

if __name__ == "__main__":
    main()
