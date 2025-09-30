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

# --- 필수 연결 ---
MAIN_DB_URL = os.getenv("MAIN_DB_URL")              # 홈페이지 DB (읽기)
DATABASE_URL = os.getenv("DATABASE_URL")            # AI DB
REDIS_URL    = os.getenv("REDIS_URL", "redis://localhost:4242/0")

# --- 타임존: 비워두면 로컬시간 사용 ---
_TIMEZONE_ENV = (os.getenv("TIMEZONE") or "").strip()
TIMEZONE = _TIMEZONE_ENV if _TIMEZONE_ENV else None

def get_tz():
    """설정된 TIMEZONE이 있으면 ZoneInfo를 반환, 없으면 None (로컬시간 사용)."""
    if TIMEZONE:
        try:
            from zoneinfo import ZoneInfo
            return ZoneInfo(TIMEZONE)
        except Exception:
            return None
    return None

# --- 파이프라인/인퍼런스 ---
INFER_CHUNK_ITEMS = int(os.getenv("INFER_CHUNK_ITEMS", "5000"))
TRAIN_ON_RUN      = os.getenv("TRAIN_ON_RUN", "0") == "1"

# --- 추천 가중치 ---
WEIGHT_CONTENT  = float(os.getenv("WEIGHT_CONTENT",  "0.6"))
WEIGHT_VIEW     = float(os.getenv("WEIGHT_VIEW",     "0.2"))
WEIGHT_LIKE     = float(os.getenv("WEIGHT_LIKE",     "0.1"))
WEIGHT_COMMENT  = float(os.getenv("WEIGHT_COMMENT",  "0.1"))

# --- 콜드스타트 fallback ---
WEIGHT_POPULARITY = float(os.getenv("WEIGHT_POPULARITY", "0.7"))
WEIGHT_RECENCY    = float(os.getenv("WEIGHT_RECENCY",    "0.3"))
RECENCY_HALF_LIFE_DAYS = float(os.getenv("RECENCY_HALF_LIFE_DAYS", "14"))

# --- 결과 저장 최적화 ---
EXCLUDE_SEEN   = os.getenv("EXCLUDE_SEEN", "0") == "1"
STORE_MIN_SCORE = float(os.getenv("STORE_MIN_SCORE", "0.0"))
STORE_TOPK      = int(os.getenv("STORE_TOPK", "0"))

# --- 동률 깨기 & 샤프닝 ---
TIE_BREAK_EPS     = float(os.getenv("TIE_BREAK_EPS", "1e-6"))
SCORE_TEMPERATURE = float(os.getenv("SCORE_TEMPERATURE", "1.0"))

# --- 인기/트렌드 집계용 ---
VIEW_W     = float(os.getenv("VIEW_W", "1.0"))
LIKE_W     = float(os.getenv("LIKE_W", "4.0"))
COMMENT_W  = float(os.getenv("COMMENT_W", "6.0"))
BLEND_ALPHA_DAILY  = float(os.getenv("BLEND_ALPHA_DAILY", "0.7"))
BLEND_ALPHA_WEEKLY = float(os.getenv("BLEND_ALPHA_WEEKLY", "0.8"))
EWM_ALPHA          = float(os.getenv("EWM_ALPHA", "0.5"))
TREND_MIN          = float(os.getenv("TREND_MIN", "0.5"))
TREND_MAX          = float(os.getenv("TREND_MAX", "3.0"))
TIE_BREAK_EPS_TOP  = float(os.getenv("TIE_BREAK_EPS_TOP", "1e-6"))
STORE_TOPK_TOP     = int(os.getenv("STORE_TOPK_TOP", "5"))

def require_vars():
    missing = [k for k, v in {
        "MAIN_DB_URL": MAIN_DB_URL,
        "DATABASE_URL": DATABASE_URL,
        "REDIS_URL": REDIS_URL,
    }.items() if not v]
    if missing:
        raise RuntimeError(f"Missing required env vars: {missing}")
