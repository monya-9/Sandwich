import os
from pathlib import Path

def _load_env():
    try:
        from dotenv import load_dotenv, find_dotenv
        loaded = load_dotenv(find_dotenv(usecwd=True))
        if not loaded:
            # ai/ 루트에 있는 .env도 시도
            load_dotenv(Path(__file__).resolve().parents[1] / ".env")
    except Exception:
        pass

_load_env()

MAIN_DB_URL = os.getenv("MAIN_DB_URL")
DATABASE_URL = os.getenv("DATABASE_URL")
REDIS_URL    = os.getenv("REDIS_URL", "redis://localhost:4242/0")

INFER_CHUNK_ITEMS = int(os.getenv("INFER_CHUNK_ITEMS", "5000"))
TRAIN_ON_RUN      = os.getenv("TRAIN_ON_RUN", "0") == "1"

# --- 추천 가중치 ---
WEIGHT_CONTENT  = float(os.getenv("WEIGHT_CONTENT",  "0.6"))
WEIGHT_VIEW     = float(os.getenv("WEIGHT_VIEW",     "0.2"))
WEIGHT_LIKE     = float(os.getenv("WEIGHT_LIKE",     "0.1"))
WEIGHT_COMMENT  = float(os.getenv("WEIGHT_COMMENT",  "0.1"))

# --- 콜드스타트 fallback(인기/신규) ---
WEIGHT_POPULARITY = float(os.getenv("WEIGHT_POPULARITY", "0.7"))
WEIGHT_RECENCY    = float(os.getenv("WEIGHT_RECENCY",    "0.3"))
RECENCY_HALF_LIFE_DAYS = float(os.getenv("RECENCY_HALF_LIFE_DAYS", "14"))

# --- 결과 저장 최적화 ---
EXCLUDE_SEEN   = os.getenv("EXCLUDE_SEEN", "0") == "1"
STORE_MIN_SCORE = float(os.getenv("STORE_MIN_SCORE", "0.0"))  # 이 값 초과만 저장
STORE_TOPK      = int(os.getenv("STORE_TOPK", "0"))           # 0=전체 저장, >0=상위 K만 저장

# --- 동률 깨기 & 점수 샤프닝 ---
TIE_BREAK_EPS     = float(os.getenv("TIE_BREAK_EPS", "1e-6"))  # 아주 작은 결정적 지터
SCORE_TEMPERATURE = float(os.getenv("SCORE_TEMPERATURE", "1.0"))

def require_vars():
    missing = [k for k, v in {
        "MAIN_DB_URL": MAIN_DB_URL,
        "DATABASE_URL": DATABASE_URL,
        "REDIS_URL": REDIS_URL
    }.items() if not v]
    if missing:
        raise RuntimeError(
            f"Missing required env vars: {missing}. "
            "Set them in your .env or environment."
        )
