import os, sys, logging, argparse, time
from pathlib import Path

# --- 부트스트랩: 경로/환경 세팅
ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT))  # src/를 최우선으로
try:
    from dotenv import load_dotenv
    load_dotenv(ROOT / ".env")
except Exception:
    pass

# --- 로깅
LOG_DIR = ROOT / "logs"
LOG_DIR.mkdir(parents=True, exist_ok=True)
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s | %(levelname)s | %(message)s",
    handlers=[logging.FileHandler(LOG_DIR / "pipeline.log", encoding="utf-8"),
              logging.StreamHandler()]
)
log = logging.getLogger("pipeline")

# --- 설정/연결 체크
from sqlalchemy import create_engine, text
import redis
from src.config import MAIN_DB_URL, DATABASE_URL, REDIS_URL

def check_env():
    missing = [k for k,v in {
        "MAIN_DB_URL": MAIN_DB_URL,
        "DATABASE_URL": DATABASE_URL,
        "REDIS_URL": REDIS_URL
    }.items() if not v]
    if missing:
        raise RuntimeError(f"환경변수(.env) 누락: {missing}")

def check_connections():
    log.info("DB/Redis 연결 점검...")
    e1 = create_engine(MAIN_DB_URL, pool_pre_ping=True, future=True)
    e2 = create_engine(DATABASE_URL, pool_pre_ping=True, future=True)
    with e1.connect() as c: c.execute(text("SELECT 1"))
    with e2.connect() as c: c.execute(text("SELECT 1"))
    r = redis.Redis.from_url(REDIS_URL)
    assert r.ping(), "Redis ping 실패"
    log.info("DB/Redis OK")

# --- 단계 함수 import (한 번만)
from src.data_ingestion import main_to_ai
from src.feature_engineering import extract_interactions, encode_user_features, encode_project_features
from src.model import train as train_mod
from src.model import inference as infer_mod

# --- 파일/산출물 점검
def assert_file(p: Path, desc: str):
    if not p.exists():
        raise FileNotFoundError(f"{desc} 누락: {p}")

def check_artifacts():
    base = ROOT / "data"
    assert_file(base / "interactions.csv", "interactions.csv")
    assert_file(base / "user_skills.npy", "user_skills.npy")
    assert_file(base / "project_tools.npy", "project_tools.npy")

def check_redis_sample():
    import json
    map_file = ROOT / "data" / "mappings" / "users.json"
    if not map_file.exists():
        log.warning("users.json 없음 → Redis 샘플 확인 스킵")
        return
    with open(map_file, "r", encoding="utf-8") as f:
        u2i = json.load(f)
    if not u2i:
        log.warning("사용자 매핑 비어있음 → Redis 샘플 확인 스킵")
        return
    any_u_idx = next(iter(sorted(u2i.values())))
    key = f"recs:{any_u_idx}"
    r = redis.Redis.from_url(REDIS_URL)
    n = r.zcard(key)
    log.info(f"Redis 샘플 키 '{key}' zcard={n}")

# --- 안전 실행 래퍼
def run_step(name, fn):
    t0 = time.time()
    log.info(f"▶ {name} 시작")
    try:
        fn()
        log.info(f"✔ {name} 완료 ({time.time()-t0:.2f}s)")
        return True
    except Exception as e:
        log.exception(f"✖ {name} 실패: {e}")
        return False

def main():
    parser = argparse.ArgumentParser(description="AI 파이프라인 단일 실행기")
    parser.add_argument("--train", type=int, default=int(os.getenv("TRAIN_ON_RUN","0")),
                        help="1=학습 수행, 0=건너뛰기")
    args = parser.parse_args()

    check_env()
    check_connections()

    # 1) 메인 DB → AI DB 적재
    if not run_step("메인 DB → AI DB 적재", main_to_ai.main):
        return

    # 2) 상호작용 매핑/CSV
    if not run_step("interactions.csv 생성", extract_interactions.main):
        return

    # 3) 피처 인코딩
    if not run_step("유저 피처 인코딩", encode_user_features.main):
        return
    if not run_step("프로젝트 피처 인코딩", encode_project_features.main):
        return

    # 산출물 확인
    check_artifacts()

    # 4) (옵션) 학습
    if args.train == 1:
        if not run_step("모델 학습", train_mod.main):
            return
    else:
        log.info("학습 건너뜀 (--train=0)")

    # 5) 추론 → Redis ZSET
    if not run_step("추론 → Redis 캐시 업데이트", infer_mod.main):
        return

    # 6) 검증
    check_redis_sample()
    log.info("종료")

if __name__ == "__main__":
    main()
