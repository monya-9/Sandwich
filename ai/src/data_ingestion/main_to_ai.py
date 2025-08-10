import pandas as pd
from sqlalchemy import create_engine, text
from src.config import MAIN_DB_URL, DATABASE_URL, require_vars

# ← 여기서 필수 값 점검
require_vars()

hp = create_engine(MAIN_DB_URL, pool_pre_ping=True, future=True)
ai = create_engine(DATABASE_URL, pool_pre_ping=True, future=True)

DDL = """
CREATE TABLE IF NOT EXISTS raw_user_features (
  user_id   BIGINT PRIMARY KEY,
  skills    TEXT,
  interests TEXT,       -- JSON string of array
  position  TEXT
);

CREATE TABLE IF NOT EXISTS raw_project_features (
  project_id BIGINT PRIMARY KEY,
  tools      TEXT,
  hashtags   TEXT        -- JSON string of array
);

CREATE TABLE IF NOT EXISTS raw_interactions (
  user_id    BIGINT NOT NULL,
  project_id BIGINT NOT NULL,
  event_type VARCHAR(20) NOT NULL, -- view/like/comment
  weight     DOUBLE PRECISION NOT NULL,
  ts         TIMESTAMP
);
"""

def extract_user_features():
    sql = """
    SELECT u.id AS user_id,
           p.skills AS skills,
           COALESCE(json_agg(DISTINCT i.name) FILTER (WHERE i.id IS NOT NULL), '[]') AS interests,
           pos.name AS position
    FROM users u
    LEFT JOIN profile p ON p.user_id = u.id
    LEFT JOIN user_interest ui ON ui.user_id = u.id
    LEFT JOIN interest i ON i.id = ui.interest_id
    LEFT JOIN user_position up ON up.user_id = u.id
    LEFT JOIN "position" pos ON pos.id = up.position_id
    GROUP BY u.id, p.skills, pos.name
    """
    return pd.read_sql(sql, hp)

def extract_project_features():
    sql = """
    SELECT pr.id AS project_id,
           pr.tools AS tools,
           COALESCE(json_agg(DISTINCT h.hashtag) FILTER (WHERE h.id IS NOT NULL), '[]') AS hashtags
    FROM project pr
    LEFT JOIN hashtag h ON h.project_id = pr.id
    GROUP BY pr.id, pr.tools
    """
    return pd.read_sql(sql, hp)

def extract_interactions():
    # Likes (PROJECT만)
    likes = pd.read_sql("""
        SELECT l.user_id, l.target_id AS project_id, 'like' AS event_type,
               3.0 AS weight, l.created_at AS ts
        FROM likes l
        WHERE l.target_type = 'PROJECT' AND l.user_id IS NOT NULL
    """, hp)

    # Views
    views = pd.read_sql("""
        SELECT v.viewer_id AS user_id, v.project_id, 'view' AS event_type,
               LEAST(5.0, 1.0 + LN(1 + GREATEST(0, v.count))) AS weight,
               v.viewed_at AS ts
        FROM project_views v
        WHERE v.viewer_id IS NOT NULL
    """, hp)

    # Comments (PROJECT에 달린 것만)
    comments = pd.read_sql("""
        SELECT c.user_id, c.commentable_id AS project_id, 'comment' AS event_type,
               5.0 AS weight, c.created_at AS ts
        FROM comment c
        WHERE c.commentable_type = 'PROJECT' AND c.user_id IS NOT NULL
    """, hp)

    # 1) dtype 고정 유틸
    def fix_types(df: pd.DataFrame) -> pd.DataFrame:
        if df is None or df.empty:
            return df
        df = df.astype({
            "user_id": "int64",
            "project_id": "int64",
            "event_type": "string",
            "weight": "float64",
        })
        df["ts"] = pd.to_datetime(df["ts"], errors="coerce")
        return df

    likes    = fix_types(likes)
    views    = fix_types(views)
    comments = fix_types(comments)

    # 2) 빈 DF 제외하고 concat
    frames = [d for d in (likes, views, comments) if d is not None and not d.empty]
    if not frames:
        # 이후 로직을 위해 스키마만 맞춘 빈 DF 반환
        return pd.DataFrame(columns=["user_id","project_id","event_type","weight","ts"])

    df = pd.concat(frames, ignore_index=True)

    # 동일 (user, project) 다중 이벤트 → 가중치 합산
    df = df.dropna(subset=["user_id","project_id"])
    agg = df.groupby(["user_id","project_id"], as_index=False).agg(
        weight=("weight","sum"),
        ts=("ts","max")
    )

    # 우선순위: comment > like > view
    prio = {"view":1, "like":2, "comment":3}
    df["rank"] = df["event_type"].map(prio)
    et = df.sort_values("rank").groupby(["user_id","project_id"])["event_type"].last().reset_index()

    out = agg.merge(et, on=["user_id","project_id"], how="left")
    out = out[["user_id","project_id","event_type","weight","ts"]]
    return out

def main():
    with ai.begin() as conn:
        for stmt in DDL.strip().split(";\n\n"):
            if stmt.strip():
                conn.execute(text(stmt))

    uf = extract_user_features()
    pf = extract_project_features()
    it = extract_interactions()

    uf.to_sql("raw_user_features", ai, if_exists="replace", index=False)
    pf.to_sql("raw_project_features", ai, if_exists="replace", index=False)
    it.to_sql("raw_interactions",    ai, if_exists="replace", index=False)

    print("Loaded to AI DB: raw_user_features, raw_project_features, raw_interactions")

if __name__ == "__main__":
    main()
