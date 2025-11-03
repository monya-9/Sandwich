# src/feature_engineering/encode_project_features.py
from pathlib import Path
import os, json, re
import numpy as np
import pandas as pd
from sqlalchemy import create_engine, text

BASE = Path(__file__).resolve().parents[2]
DATA = BASE / "data"
MAPD = DATA / "mappings"
NPY  = DATA / "project_tools.npy"
VOC  = DATA / "item_vocab.json"

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

def col_exists(conn, t, c):
    return (conn.execute(text(
        "select count(*) from information_schema.columns where table_name=:t and column_name=:c"
    ), {"t":t, "c":c}).scalar() or 0) > 0

def tokenize(val):
    if val is None: return []
    try:
        if pd.isna(val): return []
    except Exception: pass
    s = str(val).strip()
    if not s: return []
    return [t for t in re.split(r"[,/|\s]+", s.lower()) if t]

def main():
    if not MAIN_DB_URL: raise SystemExit("MAIN_DB_URL not set")
    eng = create_engine(MAIN_DB_URL, pool_pre_ping=True, future=True)

    with eng.begin() as conn:
        # 1) 기존 projects.json 존재 & 잠금이면 그 순서/크기로 고정
        existing_p2i = load_json(MAPD / "projects.json") if LOCK_STATIC else None
        if existing_p2i:
            # 잠금: 기존 프로젝트 인덱스를 그대로 사용
            p2i = {k:int(v) for k,v in existing_p2i.items()}
            projects = [int(pid) for pid in sorted(p2i.keys(), key=lambda x: p2i[str(x)])]
        else:
            # 갱신: 현재 DB에서 프로젝트 불러와 매핑 생성
            id_col = "id" if col_exists(conn, "project", "id") else "project_id"
            dfp = pd.read_sql(text(f"select {id_col}::bigint as project_id from project order by {id_col}"), conn)
            projects = dfp["project_id"].astype("int64").tolist()
            p2i = {str(p): i for i, p in enumerate(projects)}
            save_json(p2i, MAPD / "projects.json")
            save_json({str(i): int(p) for p, i in p2i.items()}, MAPD / "projects_rev.json")

        # 2) 텍스트 후보 컬럼 존재 확인
        candidates = ["tools","tags","tech_stack","stack","languages","skills","skill_tags","techs","hashtags"]
        exist = [c for c in candidates if col_exists(conn, "project", c)]
        id_col = "id" if col_exists(conn, "project", "id") else "project_id"
        cols = ", ".join([f"{id_col}::bigint as project_id"] + exist) if exist else f"{id_col}::bigint as project_id"
        df = pd.read_sql(text(f"select {cols} from project"), conn).replace({pd.NA: None})

    # 3) vocab 잠금/갱신
    existing_vocab = load_json(VOC)
    if LOCK_STATIC and existing_vocab is not None:
        vocab = existing_vocab  # 잠금: 기존 어휘만 사용
    else:
        vocab = {}
        for _, row in df.iterrows():
            toks=[]
            for c in exist: toks += tokenize(row.get(c))
            if toks:
                for t in sorted(set(toks)):
                    if t not in vocab: vocab[t]=len(vocab)
        if not vocab: vocab["__none__"]=0

    # 4) 행렬 크기 고정 (잠금 시 기존 프로젝트 집합만 사용)
    I = np.zeros((len(p2i), len(vocab)), dtype=np.float32)

    # DB에서 읽어온 내용 중, 잠금이면 p2i에 존재하는 프로젝트만 반영
    by_pid = {}
    if exist:
        for _, row in df.iterrows():
            pid = int(row["project_id"])
            if str(pid) not in p2i:  # 잠금일 때 새 프로젝트는 무시
                if not (LOCK_STATIC and existing_p2i):
                    # 잠금이 아니면 새 프로젝트도 p2i에 들어가 있을 것
                    pass
                continue
            toks=[]
            for c in exist: toks += tokenize(row.get(c))
            if toks:
                by_pid[pid]=sorted(set(toks))

    for pid_str, idx in sorted(p2i.items(), key=lambda x: int(x[1])):
        pid = int(pid_str)
        toks = by_pid.get(pid, [])
        for t in toks:
            j = vocab.get(t)  # 잠금: 어휘 외 토큰은 무시
            if j is not None:
                I[int(idx), j]=1.0

    ensure_dir(NPY); np.save(NPY, I); save_json(vocab, VOC)
    print(f"[item] project_tools.npy {I.shape}, vocab={len(vocab)}, lock={LOCK_STATIC}")

if __name__ == "__main__":
    main()
