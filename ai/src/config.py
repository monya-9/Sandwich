import os
from pathlib import Path

def _load_env():
    try:
        from dotenv import load_dotenv, find_dotenv
        loaded = load_dotenv(find_dotenv(usecwd=True))
        if not loaded:
            load_dotenv(Path(__file__).resolve().parents[1] / ".env")
    except Exception:
        pass

_load_env()

MAIN_DB_URL = os.getenv("MAIN_DB_URL")
DATABASE_URL = os.getenv("DATABASE_URL")
REDIS_URL    = os.getenv("REDIS_URL", "redis://localhost:4242/0")

INFER_CHUNK_ITEMS = int(os.getenv("INFER_CHUNK_ITEMS", "5000"))
TRAIN_ON_RUN      = os.getenv("TRAIN_ON_RUN", "0") == "1"

WEIGHT_CONTENT  = float(os.getenv("WEIGHT_CONTENT",  "0.6"))  # 유저 스킬(콘텐츠 유사도)
WEIGHT_VIEW     = float(os.getenv("WEIGHT_VIEW",     "0.2"))  # 본(조회) 프로젝트
WEIGHT_LIKE     = float(os.getenv("WEIGHT_LIKE",     "0.1"))  # 좋아요
WEIGHT_COMMENT  = float(os.getenv("WEIGHT_COMMENT",  "0.1"))  # 댓글

# 이미 본 아이템을 제외할지(기본: 0=미제외 / 1=제외)
EXCLUDE_SEEN    = os.getenv("EXCLUDE_SEEN", "0") == "1"

def require_vars():
    missing = [k for k,v in {
        "MAIN_DB_URL": MAIN_DB_URL,
        "DATABASE_URL": DATABASE_URL,
        "REDIS_URL": REDIS_URL
    }.items() if not v]
    if missing:
        raise RuntimeError(f"Missing required env vars: {missing}. Check your .env.")
