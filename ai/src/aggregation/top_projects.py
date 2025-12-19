import os
from pathlib import Path
from datetime import datetime, timedelta, timezone
from typing import Optional, List, Tuple

import numpy as np
import pandas as pd
import requests
from sqlalchemy import create_engine, text

# ========= .env 로더 (루트 ONLY) =========
HERE = Path(__file__).resolve()
ROOT = HERE.parents[2]  # <ROOT>
ENV_FILE = ROOT / ".env"

def load_env_root():
    """프로젝트 루트의 .env만 로드해서 os.environ에 주입."""
    if not ENV_FILE.exists():
        return
    for line in ENV_FILE.read_text(encoding="utf-8").splitlines():
        s = line.strip()
        if not s or s.startswith("#") or "=" not in s:
            continue
        k, v = s.split("=", 1)
        k = k.strip()
        v = v.strip().strip("'").strip('"')
        # 이미 OS에 값이 있으면 유지, 없으면 .env 값 사용
        os.environ.setdefault(k, v)

load_env_root()

# ========= ENV =========
MAIN_DB_URL = os.getenv("MAIN_DB_URL") or os.getenv("DATABASE_URL", "")
if not MAIN_DB_URL:
    raise SystemExit("MAIN_DB_URL (or DATABASE_URL) is not set (루트 .env 확인).")

TZ_NAME   = os.getenv("TZ", "Asia/Seoul")

WORKER_BASE = os.getenv("WORKER_BASE", "").strip()
if not WORKER_BASE:
    raise SystemExit("WORKER_BASE is not set (루트 .env 확인).")
AI_HEADER   = os.getenv("AI_HEADER", "X-AI-API-Key")
AI_API_KEY  = os.getenv("AI_API_KEY", "test")

STORE_TOPK_TOP = int(os.getenv("STORE_TOPK_TOP", "200"))
EVENT_WEIGHTS  = {
    k.strip().lower(): float(v)
    for k, v in (
        seg.split(":") for seg in os.getenv("EVENT_WEIGHTS", "view:1,like:3,comment:4").split(",") if seg
    )
}
W_BASE    = float(os.getenv("W_BASE", "0.6"))
W_PERIOD  = float(os.getenv("W_PERIOD", "0.35"))
W_RECENCY = float(os.getenv("W_RECENCY", "0.05"))
RECENCY_HALF_LIFE_DAYS = float(os.getenv("RECENCY_HALF_LIFE_DAYS", "14"))

# ========= TZ =========
try:
    import zoneinfo
    TZ = zoneinfo.ZoneInfo(TZ_NAME)
except Exception:
    TZ = timezone(timedelta(hours=9))  # KST fallback

# ========= Utils =========
def _post_json(path: str, payload: dict):
    url = WORKER_BASE.rstrip("/") + path
    r = requests.post(url, json=payload, headers={AI_HEADER: AI_API_KEY}, timeout=60)
    if r.status_code >= 400:
        raise RuntimeError(f"worker_error status={r.status_code} url={url} body={r.text}")
    return r.json()

def _today_range():
    now = datetime.now(TZ)
    s = now.replace(hour=0, minute=0, second=0, microsecond=0)
    return s, s + timedelta(days=1)

def _thisweek_range():
    now = datetime.now(TZ)
    s = now.replace(hour=0, minute=0, second=0, microsecond=0) - timedelta(days=now.isoweekday() - 1)
    return s, s + timedelta(days=7)

def _norm(arr: np.ndarray) -> np.ndarray:
    if arr.size == 0:
        return arr
    mx = float(np.nanmax(arr))
    if mx <= 0.0 or np.isnan(mx):
        return np.zeros_like(arr)
    return arr / mx

def _detect_col(conn, table: str, candidates: list[str]) -> Optional[str]:
    rows = conn.execute(
        text("""
            SELECT LOWER(column_name)
            FROM information_schema.columns
            WHERE LOWER(table_name)=LOWER(:t)
        """), {"t": table}
    ).fetchall()
    cols = {r[0] for r in rows}
    for c in candidates:
        if c.lower() in cols:
            return c
    return None

def _table_exists(conn, table: str) -> bool:
    r = conn.execute(text("""
        SELECT COUNT(*) FROM information_schema.tables
        WHERE LOWER(table_name)=LOWER(:t)
    """), {"t": table}).scalar()
    return (r or 0) > 0

# ========= Load events from MAIN DB =========
def _load_events(engine, s_period: datetime, e_period: datetime) -> tuple[pd.DataFrame, pd.DataFrame, pd.DataFrame]:
    """
    returns: (df_all, df_period, df_last_event_ts)
      - df_all: project_id, evt, cnt  (전체 기간)
      - df_period: project_id, evt, cnt (요청 구간)
      - df_last_event_ts: project_id, last_ts
    """
    sources = []
    with engine.connect() as conn:
        # project_views → view
        if _table_exists(conn, "project_views"):
            pcol = _detect_col(conn, "project_views", ["project_id", "target_id", "pid"])
            tcol = _detect_col(conn, "project_views", ["ts", "created_at", "viewed_at", "timestamp", "event_time", "time"])
            if pcol and tcol:
                q = text(f"SELECT {pcol}::bigint AS project_id, {tcol} AS ts, 'view'::text AS evt FROM project_views")
                df = pd.read_sql(q, conn)
                if not df.empty:
                    sources.append(df[["project_id","ts","evt"]])

        # likes → like (PROJECT만)
        if _table_exists(conn, "likes"):
            pcol = _detect_col(conn, "likes", ["project_id", "target_id", "pid"])
            tcol = _detect_col(conn, "likes", ["created_at", "ts", "updated_at", "timestamp", "event_time", "time"])
            has_type = _detect_col(conn, "likes", ["target_type"]) is not None
            where = " WHERE target_type='PROJECT'" if has_type else ""
            if pcol and tcol:
                q = text(f"SELECT {pcol}::bigint AS project_id, {tcol} AS ts, 'like'::text AS evt FROM likes{where}")
                df = pd.read_sql(q, conn)
                if not df.empty:
                    sources.append(df[["project_id","ts","evt"]])

        # comment → comment (PROJECT만)
        if _table_exists(conn, "comment"):
            pcol = _detect_col(conn, "comment", ["project_id", "commentable_id", "target_id", "pid"])
            tcol = _detect_col(conn, "comment", ["created_at", "ts", "updated_at", "timestamp", "event_time", "time"])
            has_type = _detect_col(conn, "comment", ["commentable_type"]) is not None
            where = " WHERE commentable_type='PROJECT'" if has_type else ""
            if pcol and tcol:
                q = text(f"SELECT {pcol}::bigint AS project_id, {tcol} AS ts, 'comment'::text AS evt FROM comment{where}")
                df = pd.read_sql(q, conn)
                if not df.empty:
                    sources.append(df[["project_id","ts","evt"]])

    if not sources:
        empty = pd.DataFrame(columns=["project_id","evt","cnt"])
        return empty.copy(), empty.copy(), pd.DataFrame(columns=["project_id","last_ts"])

    ev = pd.concat(sources, ignore_index=True)
    ev["ts"] = pd.to_datetime(ev["ts"], utc=True, errors="coerce")
    ev = ev.dropna(subset=["project_id", "ts", "evt"]).copy()
    ev["project_id"] = ev["project_id"].astype("int64")
    ev["evt"] = ev["evt"].astype(str).str.lower()

    # 전체 집계
    df_all = ev.groupby(["project_id", "evt"], as_index=False).size().rename(columns={"size": "cnt"})

    # 기간 집계
    mask = (ev["ts"] >= pd.Timestamp(s_period).tz_convert("UTC")) & (ev["ts"] < pd.Timestamp(e_period).tz_convert("UTC"))
    ev_p = ev.loc[mask]
    if ev_p.empty:
        df_period = pd.DataFrame(columns=["project_id","evt","cnt"])
    else:
        df_period = ev_p.groupby(["project_id","evt"], as_index=False).size().rename(columns={"size":"cnt"})

    # 가장 최근 이벤트 시각
    df_last = ev.groupby("project_id", as_index=False)["ts"].max().rename(columns={"ts":"last_ts"})
    return df_all, df_period, df_last

def _weighted(df: pd.DataFrame) -> pd.DataFrame:
    if df.empty:
        return pd.DataFrame(columns=["project_id","score"])
    wmap = EVENT_WEIGHTS
    df = df.copy()
    df["w"] = df["evt"].map(lambda k: wmap.get(str(k).lower(), 0.0)).astype(float)
    df["ws"] = df["w"] * df["cnt"].astype(float)
    return df.groupby("project_id", as_index=False)["ws"].sum().rename(columns={"ws":"score"})

def _norm(arr: np.ndarray) -> np.ndarray:
    if arr.size == 0:
        return arr
    mx = float(np.nanmax(arr))
    if mx <= 0.0 or np.isnan(mx):
        return np.zeros_like(arr)
    return arr / mx

def _aggregate(engine, s_period: datetime, e_period: datetime) -> pd.DataFrame:
    df_all, df_p, df_last = _load_events(engine, s_period, e_period)
    base_df   = _weighted(df_all)
    period_df = _weighted(df_p)

    # recency
    if df_last.empty:
        rec_df = pd.DataFrame(columns=["project_id","recency"])
    else:
        now_ts = datetime.now(TZ).timestamp()
        half = max(1.0, RECENCY_HALF_LIFE_DAYS) * 86400.0
        lam = np.log(2.0) / half
        rec_df = df_last.copy()
        rec_df["ts_num"] = pd.to_datetime(rec_df["last_ts"], utc=True).astype("int64") / 1e9
        rec_df["age"] = np.maximum(0.0, now_ts - rec_df["ts_num"])
        rec_df["recency"] = np.exp(-lam * rec_df["age"])
        rec_df = rec_df[["project_id","recency"]]

    keys = set(map(int, base_df.get("project_id", pd.Series([],dtype="int64")).tolist())) \
         | set(map(int, period_df.get("project_id", pd.Series([],dtype="int64")).tolist())) \
         | set(map(int, rec_df.get("project_id", pd.Series([],dtype="int64")).tolist()))
    if not keys:
        return pd.DataFrame(columns=["project_id","base","period","recency","final"])

    out = pd.DataFrame({"project_id": sorted(keys)})
    out = out.merge(base_df.rename(columns={"score":"base"}), on="project_id", how="left")
    out = out.merge(period_df.rename(columns={"score":"period"}), on="project_id", how="left")
    out = out.merge(rec_df, on="project_id", how="left")
    out[["base","period","recency"]] = out[["base","period","recency"]].fillna(0.0).infer_objects(copy=False)

    base_n   = _norm(out["base"].to_numpy(dtype=float))
    period_n = _norm(out["period"].to_numpy(dtype=float))
    rec_n    = _norm(out["recency"].to_numpy(dtype=float))

    out["final"] = (float(os.getenv("W_BASE", W_BASE))   * base_n +
                    float(os.getenv("W_PERIOD", W_PERIOD)) * period_n +
                    float(os.getenv("W_RECENCY", W_RECENCY)) * rec_n).astype(float)
    out["final"] = out["final"] + (np.arange(len(out)) % 997) * 1e-12
    return out

def _upsert_top_day(ymd: str, items: List[Tuple[int,float]]):
    return _post_json("/api/reco/admin/upsert/top/day",
                      {"ymd": ymd, "items": [{"project_id": p, "score": s} for p, s in items]})

def _upsert_top_week(week: str, items: List[Tuple[int,float]]):
    return _post_json("/api/reco/admin/upsert/top/week",
                      {"week": week, "items": [{"project_id": p, "score": s} for p, s in items]})

def run(mode: str):
    eng = create_engine(MAIN_DB_URL, pool_pre_ping=True, future=True)

    if mode == "day":
        s, e = _today_range()
        df = _aggregate(eng, s, e).sort_values(["final","project_id"], ascending=[False, True])
        if STORE_TOPK_TOP > 0:
            df = df.head(STORE_TOPK_TOP)
        items = [(int(r.project_id), float(r.final)) for r in df.itertuples(index=False)]
        _upsert_top_day(s.strftime("%Y%m%d"), items)

    elif mode == "week":
        s, e = _thisweek_range()
        df = _aggregate(eng, s, e).sort_values(["final","project_id"], ascending=[False, True])
        if STORE_TOPK_TOP > 0:
            df = df.head(STORE_TOPK_TOP)
        iso_year, iso_week, _ = s.isocalendar()
        week = f"{iso_year}W{iso_week:02d}"
        items = [(int(r.project_id), float(r.final)) for r in df.itertuples(index=False)]
        _upsert_top_week(week, items)

    else:
        raise ValueError("mode must be 'day' or 'week'")

def main():
    print(f"[top_projects] .env={ENV_FILE} MAIN_DB_URL set → WORKER_BASE={WORKER_BASE}")
    run("day");  print("[top_projects] day upsert ok")
    run("week"); print("[top_projects] week upsert ok")
    print("[top_projects] done")

if __name__ == "__main__":
    main()
