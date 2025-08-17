from sqlalchemy import create_engine, text
from src.config import MAIN_DB_URL, DATABASE_URL, require_vars

DDL = """
CREATE TABLE IF NOT EXISTS events_like (
  source_id  BIGINT PRIMARY KEY,
  user_id    BIGINT NOT NULL,
  project_id BIGINT NOT NULL,
  ts         TIMESTAMP NOT NULL
);
CREATE TABLE IF NOT EXISTS events_comment (
  source_id  BIGINT PRIMARY KEY,
  user_id    BIGINT,
  project_id BIGINT NOT NULL,
  ts         TIMESTAMP NOT NULL
);
CREATE TABLE IF NOT EXISTS events_view (
  source_id  BIGINT PRIMARY KEY,
  viewer_id  BIGINT,
  project_id BIGINT NOT NULL,
  ts         TIMESTAMP NOT NULL,
  cnt        INT
);
"""

SQL_INS_LIKES = """
INSERT INTO events_like (source_id, user_id, project_id, ts)
VALUES (:id, :uid, :pid, :ts)
ON CONFLICT (source_id) DO NOTHING
"""

SQL_INS_COMMENTS = """
INSERT INTO events_comment (source_id, user_id, project_id, ts)
VALUES (:id, :uid, :pid, :ts)
ON CONFLICT (source_id) DO NOTHING
"""

SQL_INS_VIEWS = """
INSERT INTO events_view (source_id, viewer_id, project_id, ts, cnt)
VALUES (:id, :vid, :pid, :ts, :cnt)
ON CONFLICT (source_id) DO NOTHING
"""

def _batch_insert(conn, sql: str, rows: list[dict], chunk: int = 1000):
    if not rows:
        return
    for i in range(0, len(rows), chunk):
        conn.execute(text(sql), rows[i:i+chunk])

def main():
    require_vars()
    hp = create_engine(MAIN_DB_URL, pool_pre_ping=True, future=True)  # 홈페이지 DB (읽기 전용)
    ai = create_engine(DATABASE_URL, pool_pre_ping=True, future=True) # AI DB (쓰기)

    # 테이블 보장
    with ai.begin() as conn:
        for stmt in DDL.strip().split(";\n"):
            if stmt.strip():
                conn.execute(text(stmt))

    # === 데이터 적재 시작 ===
    with ai.begin() as aconn, hp.begin() as hconn:
        # 1) likes (프로젝트당 유저 1 like 기준: DISTINCT user_id 집계는 나중 창 집계 단계에서 반영)
        like_rows = hconn.execute(text("""
            SELECT l.id, l.user_id, l.target_id AS project_id, l.created_at
            FROM likes l
            WHERE l.target_type='PROJECT'
              AND l.user_id IS NOT NULL
        """)).fetchall()
        payload = [
            {"id": r.id, "uid": r.user_id, "pid": r.project_id, "ts": r.created_at}
            for r in like_rows
        ]
        _batch_insert(aconn, SQL_INS_LIKES, payload)

        # 2) comments (여러 개 허용 → 개수 그대로 저장)
        comment_rows = hconn.execute(text("""
            SELECT c.id, c.user_id, c.commentable_id AS project_id, c.created_at
            FROM comment c
            WHERE c.commentable_type='PROJECT'
        """)).fetchall()
        payload = [
            {"id": r.id, "uid": r.user_id, "pid": r.project_id, "ts": r.created_at}
            for r in comment_rows
        ]
        _batch_insert(aconn, SQL_INS_COMMENTS, payload)

        # 3) views (유저별 최근 본 시각+count 스냅샷 보관)
        view_rows = hconn.execute(text("""
            SELECT v.id, v.viewer_id, v.project_id, v.viewed_at, v.count
            FROM project_views v
        """)).fetchall()
        payload = [
            {"id": r.id, "vid": r.viewer_id, "pid": r.project_id, "ts": r.viewed_at, "cnt": r.count}
            for r in view_rows
        ]
        _batch_insert(aconn, SQL_INS_VIEWS, payload)

    print("✅ events_* ingested into AI DB (read-only from homepage DB).")

if __name__ == "__main__":
    main()
