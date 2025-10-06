# src/api_redis/main.py
import os
from typing import List, Optional
from fastapi import FastAPI, HTTPException, Query, Header, Depends
from pydantic import BaseModel
from sqlalchemy import create_engine, text
from redis.asyncio import Redis
from datetime import datetime
import pytz

# ===== 설정 =====
API_KEY    = os.getenv("API_KEY", "").strip()
REDIS_URL  = os.getenv("REDIS_URL", "redis://ai_redis:6379/0")
AI_DB_URL  = os.getenv("DATABASE_URL", "")
MAIN_DB_URL= os.getenv("MAIN_DB_URL", "")
KEY_PREFIX = "recs:"

def get_tz():
    tz = os.getenv("TZ", "Asia/Seoul")
    try:
        return pytz.timezone(tz)
    except Exception:
        return pytz.UTC

TZ = get_tz()

# ===== 앱/클라이언트 =====
app = FastAPI(title="AI Redis Query API", version="1.2.0", docs_url="/docs")
redis: Optional[Redis] = None
MAIN_ENGINE = create_engine(MAIN_DB_URL, pool_pre_ping=True, future=True) if MAIN_DB_URL else None

# ===== 인증 =====
def require_api_key(x_ai_api_key: Optional[str] = Header(default=None, alias="X-AI-API-Key")):
    if API_KEY and x_ai_api_key != API_KEY:
        raise HTTPException(status_code=401, detail="Invalid API key")
    return True

# ===== 모델 =====
class RecItem(BaseModel):
    project_id: int
    score: float

class ListResponse(BaseModel):
    total: int
    data: List[RecItem]

class ProjectMeta(BaseModel):
    id: int
    title: Optional[str] = None
    image: Optional[str] = None
    tools: Optional[str] = None

class ListResponseExpanded(ListResponse):
    meta: List[ProjectMeta] = []

# ===== 메타 조회 =====
def fetch_project_meta(pids: List[int]) -> List[ProjectMeta]:
    meta: List[ProjectMeta] = []
    if not pids or not MAIN_ENGINE:
        return meta
    try:
        with MAIN_ENGINE.connect() as conn:
            for pid in pids:
                row = conn.execute(
                    text("SELECT id,title,image,tools FROM project WHERE id=:pid"),
                    {"pid": pid}
                ).fetchone()
                if row:
                    meta.append(ProjectMeta(id=int(row.id), title=row.title, image=row.image, tools=row.tools))
    except Exception:
        pass
    return meta

# ===== 키 헬퍼 =====
def today_key() -> str:
    now = datetime.now(TZ)
    return f"top:day:{now.strftime('%Y%m%d')}"

def week_key() -> str:
    now = datetime.now(TZ)
    y, w, _ = now.isocalendar()
    return f"top:week:{y}W{w:02d}"

# ===== 수명주기 =====
@app.on_event("startup")
async def startup():
    global redis
    redis = Redis.from_url(REDIS_URL, decode_responses=True)
    await redis.ping()

@app.on_event("shutdown")
async def shutdown():
    if redis:
        await redis.close()

# ===== 엔드포인트 =====
@app.get("/health")
async def health():
    try:
        pong = await redis.ping()
        return {"status": "ok", "redis": REDIS_URL if pong else "fail"}
    except Exception as e:
        return {"status": "error", "detail": str(e)}

# 개인화 추천: ZSET recs:{u_idx}
@app.get("/recs/u_idx/{u_idx}", response_model=ListResponseExpanded)
async def get_recs_by_u_idx(
    u_idx: int,
    top: int = Query(10, ge=1, le=200),
    expand: bool = Query(False),
    _=Depends(require_api_key)
):
    key = f"{KEY_PREFIX}{u_idx}"
    total = await redis.zcard(key)
    if total == 0:
        return ListResponseExpanded(total=0, data=[], meta=[])
    rows = await redis.zrevrange(key, 0, top - 1, withscores=True)
    data = [RecItem(project_id=int(pid), score=float(score)) for pid, score in rows]
    meta = fetch_project_meta([i.project_id for i in data]) if expand else []
    return ListResponseExpanded(total=int(total), data=data, meta=meta)

# 일간 TOP: ZSET top:day:YYYYMMDD
@app.get("/top/day", response_model=ListResponseExpanded)
async def get_top_day(
    date: Optional[str] = Query(None, description="YYYYMMDD (미지정 시 오늘)"),
    k: int = Query(10, ge=1, le=200),
    expand: bool = Query(False),
    _=Depends(require_api_key)
):
    key = f"top:day:{date}" if date else today_key()
    total = await redis.zcard(key)
    if total == 0:
        return ListResponseExpanded(total=0, data=[], meta=[])
    rows = await redis.zrevrange(key, 0, k - 1, withscores=True)
    data = [RecItem(project_id=int(pid), score=float(score)) for pid, score in rows]
    meta = fetch_project_meta([i.project_id for i in data]) if expand else []
    return ListResponseExpanded(total=int(total), data=data, meta=meta)

# 주간 TOP: ZSET top:week:YYYYWww
@app.get("/top/week", response_model=ListResponseExpanded)
async def get_top_week(
    iso: Optional[str] = Query(None, description="YYYYWww (예: 2025W39). 미지정 시 이번 주"),
    k: int = Query(10, ge=1, le=200),
    expand: bool = Query(False),
    _=Depends(require_api_key)
):
    key = f"top:week:{iso}" if iso else week_key()
    total = await redis.zcard(key)
    if total == 0:
        return ListResponseExpanded(total=0, data=[], meta=[])
    rows = await redis.zrevrange(key, 0, k - 1, withscores=True)
    data = [RecItem(project_id=int(pid), score=float(score)) for pid, score in rows]
    meta = fetch_project_meta([i.project_id for i in data]) if expand else []
    return ListResponseExpanded(total=int(total), data=data, meta=meta)
