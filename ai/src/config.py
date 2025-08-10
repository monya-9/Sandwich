# src/config.py
import os
from pathlib import Path

def _load_env():
    # 1) python-dotenv 사용 (있으면)
    try:
        from dotenv import load_dotenv, find_dotenv
        # 1차: CWD 기준 탐색, 2차: 파일 위치 기준 탐색
        loaded = load_dotenv(find_dotenv(usecwd=True))
        if not loaded:
            load_dotenv(Path(__file__).resolve().parents[1] / ".env")
    except Exception:
        # dotenv가 없어도 OS 환경변수로만 동작
        pass

_load_env()

MAIN_DB_URL = os.getenv("MAIN_DB_URL")
DATABASE_URL = os.getenv("DATABASE_URL")
REDIS_URL    = os.getenv("REDIS_URL", "redis://localhost:4242/0")

INFER_CHUNK_ITEMS = int(os.getenv("INFER_CHUNK_ITEMS", "5000"))
TRAIN_ON_RUN      = os.getenv("TRAIN_ON_RUN", "0") == "1"

def require_vars():
    missing = [k for k,v in {
        "MAIN_DB_URL": MAIN_DB_URL,
        "DATABASE_URL": DATABASE_URL,
        "REDIS_URL": REDIS_URL
    }.items() if not v]
    if missing:
        raise RuntimeError(
            f"Missing required env vars: {missing}. "
            "Check your .env in the project root."
        )
