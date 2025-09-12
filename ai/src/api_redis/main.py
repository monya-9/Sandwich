import os
import json
from datetime import datetime
from typing import List, Optional, Dict

import redis
from fastapi import FastAPI, HTTPException, Query, Header, Depends
from pydantic import BaseModel
from sqlalchemy import create_engine, text

from src.config import REDIS_URL, MAIN_DB_URL, get_tz

app = FastAPI(title="AI Redis Query API", version="1.0.0", docs_url="/docs")

# --- 보안: X-API-Key 헤더 검증 ---
API_KEY = os.getenv("API_KEY", "").strip()

def require_api_key(x_api_key: Optional[str] = Header(default=None)):
    if API_KEY:
        if x_api_key != API_KEY:
            raise HTTPException(status_code=401, detail="Invalid API key")
    return True

def get_redis():
    return redis.Redis.from_url(REDIS_URL, decode_responses=True)

TZ = get_tz()

def today_key() -> str:
    now = datetime.now(TZ) if TZ else datetime.now()
    return f"top:day:{now.strftime('%Y%m%d')}"

def week_key() -> str:
    now = datetime.now(TZ) if TZ else datetime.now()
    y, w, _ = now.isocalendar()
    return f"top:week:{y}W{w:02d}"

# --- user_id <-> u_idx 매핑: AI DB 또는 로컬 파일에서 시도 ---
def load_file_mapping() -> Dict[str, Dict[str, int]]:
    res = {"user2idx": {}, "idx2user": {}}
    try:
        if os.path.exists("data/mappings/users.json"):
            res["user2idx"] = json.loads(open("data/mappings/users.json", "r", encoding="utf-8").read())
        if os.path.exists("data/mappings/users_rev.json"):
            res["idx2user"] = json.loads(open("data/mappings/users_rev.json", "r", encoding="utf-8").read())
    except Exception:
        pass
    return res

def map_user_to_u_idx(user_id: int) -> Optional[int]:
    # 1) AI DB 테이블 시도
    try:
        ai = create_engine(os.getenv("DATABASE_URL"), pool_pre_ping=True, future=True)
        with ai.connect() as conn:
            # 테이블이 없다면 에러 없이 except로 넘어감
            row = conn.execute(
                text("SELECT u_idx FROM id_mapping_users WHERE user_id=:uid"),
                {"uid": user_id}
            ).fetchone()
            if row and row[0] is not None:
                return int(row[0])
    except Exception:
        pass

    # 2) 로컬 파일 매핑 시도
    maps = load_file_mapping()
    u2i = maps.get("user2idx", {})
    val = u2i.get(str(user_id))
    return int(val) if val is not None else None

def map_u_idx_to_user(u_idx: int) -> Optional[int]:
    # 1) AI DB 테이블 시도
    try:
        ai = create_engine(os.getenv("DATABASE_URL"), pool_pre_ping=True, future=True)
        with ai.connect() as conn:
            row = conn.execute(
                text("SELECT user_id FROM id_mapping_users WHERE u_idx=:i"),
                {"i": u_idx}
            ).fetchone()
            if row and row[0] is not None:
                return int(row[0])
    except Exception:
        pass

    # 2) 로컬 파일 매핑 시도
    maps = load_file_mapping()
    i2u = maps.get("idx2user", {})
    val = i2u.get(str(u_idx))
    return int(val) if val is not None else None

# --- 응답 모델 ---
class RecItem(BaseModel):
    project_id: int
    score: float

class RecResponse(BaseModel):
    user_id: Optional[int] = None
    u_idx: Optional[int] = None
    total: int
    items: List[RecItem]

class TopResponse(BaseModel):
    key: str
    total: int
    items: List[RecItem]

class ProjectMeta(BaseModel):
    id: int
    title: Optional[str] = None
    image: Optional[str] = None
    tools: Optional[str] = None

class RecResponseExpanded(RecResponse):
    meta: List[ProjectMeta] = []

class TopResponseExpanded(TopResponse):
    meta: List[ProjectMeta] = []

# --- 내부: 프로젝트 메타데이터 확장 (홈페이지 DB, 읽기 전용) ---
def fetch_project_meta(project_ids: List[int]) -> List[ProjectMeta]:
    meta: List[ProjectMeta] = []
    if not project_ids or not MAIN_DB_URL:
        return meta
    try:
        hp = create_engine(MAIN_DB_URL, pool_pre_ping=True, future=True)
        with hp.connect() as conn:
            # 상위 N(보통 5~10)이라 개별 쿼리도 부담 거의 없음
            for pid in project_ids:
                row = conn.execute(
                    text("SELECT id, title, image, tools FROM project WHERE id=:pid"),
                    {"pid": pid}
                ).fetchone()
                if row:
                    meta.append(ProjectMeta(id=int(row.id), title=row.title, image=row.image, tools=row.tools))
    except Exception:
        # 메타 확장은 best-effort
        pass
    return meta

@app.get("/health")
def health():
    return {"status": "ok", "redis": REDIS_URL}

@app.get("/recs/u_idx/{u_idx}", response_model=RecResponse)
def get_recs_by_u_idx(
    u_idx: int,
    top: int = Query(10, ge=1, le=200),
    expand: bool = Query(False, description="프로젝트 메타데이터(제목/이미지/툴) 포함"),
    _=Depends(require_api_key)
):
    r = get_redis()
    key = f"recs:{u_idx}"
    rows = r.zrevrange(key, 0, top - 1, withscores=True)
    total = r.zcard(key)
    if rows is None:
        raise HTTPException(status_code=404, detail="No recommendations found")

    items = [RecItem(project_id=int(pid), score=float(score)) for pid, score in rows]
    user_id = map_u_idx_to_user(u_idx)

    if not expand:
        return RecResponse(user_id=user_id, u_idx=u_idx, total=int(total), items=items)

    meta = fetch_project_meta([i.project_id for i in items])
    return RecResponseExpanded(user_id=user_id, u_idx=u_idx, total=int(total), items=items, meta=meta)

@app.get("/recs/user/{user_id}", response_model=RecResponse)
def get_recs_by_user_id(
    user_id: int,
    top: int = Query(10, ge=1, le=200),
    expand: bool = Query(False),
    _=Depends(require_api_key)
):
    u_idx = map_user_to_u_idx(user_id)
    if u_idx is None:
        raise HTTPException(status_code=404, detail="No u_idx mapping for user_id")

    return get_recs_by_u_idx(u_idx=u_idx, top=top, expand=expand)

@app.get("/top/day", response_model=TopResponse)
def get_top_day(
    date: Optional[str] = Query(None, description="YYYYMMDD (미지정 시 오늘)"),
    k: int = Query(5, ge=1, le=100),
    expand: bool = Query(False),
    _=Depends(require_api_key)
):
    if date:
        key = f"top:day:{date}"
    else:
        key = today_key()

    r = get_redis()
    rows = r.zrevrange(key, 0, k - 1, withscores=True)
    total = r.zcard(key)
    if rows is None:
        raise HTTPException(status_code=404, detail="No daily top found")

    items = [RecItem(project_id=int(pid), score=float(score)) for pid, score in rows]
    if not expand:
        return TopResponse(key=key, total=int(total), items=items)

    meta = fetch_project_meta([i.project_id for i in items])
    return TopResponseExpanded(key=key, total=int(total), items=items, meta=meta)

@app.get("/top/week", response_model=TopResponse)
def get_top_week(
    iso: Optional[str] = Query(None, description="YYYYWww (예: 2025W34). 미지정 시 이번 주"),
    k: int = Query(5, ge=1, le=100),
    expand: bool = Query(False),
    _=Depends(require_api_key)
):
    if iso:
        key = f"top:week:{iso}"
    else:
        key = week_key()

    r = get_redis()
    rows = r.zrevrange(key, 0, k - 1, withscores=True)
    total = r.zcard(key)
    if rows is None:
        raise HTTPException(status_code=404, detail="No weekly top found")

    items = [RecItem(project_id=int(pid), score=float(score)) for pid, score in rows]
    if not expand:
        return TopResponse(key=key, total=int(total), items=items)

    meta = fetch_project_meta([i.project_id for i in items])
    return TopResponseExpanded(key=key, total=int(total), items=items, meta=meta)
