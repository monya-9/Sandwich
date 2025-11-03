from __future__ import annotations
import os
import sys
import subprocess
from pathlib import Path

# ── 경로 ─────────────────────────────────────────────
HERE = Path(__file__).resolve()
SRC_DIR = HERE.parents[1]                 # <ROOT>/src
ROOT = SRC_DIR.parent                     # <ROOT>

# 실행 대상 스크립트 (요청한 순서)
PATHS = [
    SRC_DIR / "data_ingestion" / "mapping.py",
    SRC_DIR / "feature_engineering" / "encode_project_features.py",
    SRC_DIR / "feature_engineering" / "encode_user_features.py",
    SRC_DIR / "feature_engineering" / "extract_interactions.py",
    SRC_DIR / "model" / "train.py",
]

# ── 간단 .env 로더 (python-dotenv 없이) ───────────────
def load_env_file():
    """프로젝트 루트 → src → 현재 작업 디렉터리 순으로 .env 탐색 후 os.environ에 주입"""
    for f in (ROOT / ".env", SRC_DIR / ".env", Path.cwd() / ".env"):
        if f.exists():
            for line in f.read_text(encoding="utf-8").splitlines():
                s = line.strip()
                if not s or s.startswith("#") or "=" not in s:
                    continue
                k, v = s.split("=", 1)
                k = k.strip()
                v = v.strip().strip("'").strip('"')
                os.environ.setdefault(k, v)
            break

def ensure_env():
    load_env_file()  # .env 로드(있으면)
    if not os.getenv("MAIN_DB_URL"):
        raise SystemExit("MAIN_DB_URL is not set. .env 또는 환경변수로 설정해 주세요.")
    os.environ.setdefault("LOCK_STATIC", "1")  # 차원 잠금 기본 ON
    # src를 PYTHONPATH에 추가
    os.environ["PYTHONPATH"] = f"{SRC_DIR}{os.pathsep}{os.environ.get('PYTHONPATH','')}"

def run(pyfile: Path):
    if not pyfile.exists():
        raise FileNotFoundError(f"script not found: {pyfile}")
    cmd = [sys.executable, str(pyfile)]
    # 출력 캡처 X → 부모 stdout/stderr 그대로 사용 (인코딩 문제 회피)
    print(f"\n==실행: {pyfile} ===")
    subprocess.run(cmd, cwd=str(ROOT), env=os.environ.copy(), check=True)
    print(f"==완료: {pyfile} ===")

def main():
    ensure_env()
    for p in PATHS:
        run(p)
    print("\ntrain_once: 전체 파이프라인 완료")

if __name__ == "__main__":
    main()
