from pathlib import Path
import json
import pandas as pd
from sqlalchemy import create_engine, text

from src.config import MAIN_DB_URL, DATABASE_URL, require_vars

BASE = Path(__file__).resolve().parents[2]
DATA = BASE / "data"
MAPD = DATA / "mappings"
DATA.mkdir(parents=True, exist_ok=True)
MAPD.mkdir(parents=True, exist_ok=True)

def run_sql(engine, sql: str, params=None):
    with engine.begin() as conn:
        conn.execute(text(sql), params or {})

def df_to_table(engine, df: pd.DataFrame, table: str, if_exists="replace"):
    df.to_sql(table, engine, if_exists=if_exists, index=False)

def extract_user_features(hp, ai):
    # skills, interests(JSON array), position
    users = pd.read_sql("""
        SELECT u.id AS user_id,
               p.skills AS skills,
               ui.interests AS interests,
               up.position AS position
        FROM users u
        LEFT JOIN (
            SELECT user_id, skills
            FROM profile
        ) p ON p.user_id = u.id
        LEFT JOIN (
            SELECT ui.user_id,
                   json_agg(i.name ORDER BY i.name) AS interests
            FROM user_interest ui
            JOIN interest i ON i.id = ui.interest_id
            GROUP BY ui.user_id
        ) ui ON ui.user_id = u.id
        LEFT JOIN (
            SELECT user_id,
                   (SELECT name FROM "position" WHERE id = up.position_id) AS position
            FROM user_position up
        ) up ON up.user_id = u.id
    """, hp)
    df_to_table(ai, users, "raw_user_features")

def extract_project_features(hp, ai):
    # tools, hashtags(JSON array)
    projs = pd.read_sql("""
        SELECT p.id AS project_id,
               p.tools AS tools,
               h.hlist AS hashtags
        FROM project p
        LEFT JOIN (
            SELECT project_id, json_agg(hashtag ORDER BY hashtag) AS hlist
            FROM hashtag
            GROUP BY project_id
        ) h ON h.project_id = p.id
    """, hp)
    df_to_table(ai, projs, "raw_project_features")

def extract_interactions(hp, ai):
    # like/view/comment → unified with weights
    likes = pd.read_sql("""
        SELECT l.user_id, l.target_id AS project_id, 'like' AS event_type,
               3.0 AS weight, l.created_at AS ts
        FROM likes l
        WHERE l.target_type = 'PROJECT' AND l.user_id IS NOT NULL
    """, hp)
    views = pd.read_sql("""
        SELECT v.viewer_id AS user_id, v.project_id, 'view' AS event_type,
               LEAST(5.0, 1.0 + LN(1 + GREATEST(0, v.count))) AS weight,
               v.viewed_at AS ts
        FROM project_views v
        WHERE v.viewer_id IS NOT NULL
    """, hp)
    comments = pd.read_sql("""
        SELECT c.user_id, c.commentable_id AS project_id, 'comment' AS event_type,
               5.0 AS weight, c.created_at AS ts
        FROM comment c
        WHERE c.commentable_type = 'PROJECT' AND c.user_id IS NOT NULL
    """, hp)

    # concat safely
    frames = [d for d in (likes, views, comments) if d is not None and not d.empty]
    if frames:
        df = pd.concat(frames, ignore_index=True)
    else:
        df = pd.DataFrame(columns=["user_id","project_id","event_type","weight","ts"])

    # same (user,project) → sum weights; latest ts
    if not df.empty:
        agg = (df.groupby(["user_id","project_id"], as_index=False)
                 .agg(weight=("weight","sum"), ts=("ts","max")))
        # keep representative event_type by priority
        prio = {"view":1,"like":2,"comment":3}
        df["rank"] = df["event_type"].map(prio)
        et = (df.sort_values("rank")
                .groupby(["user_id","project_id"])["event_type"]
                .last().reset_index())
        out = agg.merge(et, on=["user_id","project_id"], how="left")
    else:
        out = df

    df_to_table(ai, out, "raw_interactions")

def extract_project_meta(hp, ai):
    # created_at만 필요(신규 점수 계산용)
    meta = pd.read_sql("""
        SELECT p.id AS project_id, p.created_at
        FROM project p
    """, hp)
    # 테이블 생성/업서트
    run_sql(ai, """
        CREATE TABLE IF NOT EXISTS raw_project_meta (
            project_id BIGINT PRIMARY KEY,
            created_at TIMESTAMP NULL
        )
    """)
    # 덮어쓰기
    df_to_table(ai, meta, "raw_project_meta")

def compute_item_popularity(ai):
    # raw_interactions의 weight 합으로 pop_score 계산
    df = pd.read_sql("""
        SELECT project_id, SUM(weight) AS pop_score
        FROM raw_interactions
        GROUP BY project_id
    """, ai)
    run_sql(ai, """
        CREATE TABLE IF NOT EXISTS raw_item_popularity (
            project_id BIGINT PRIMARY KEY,
            pop_score DOUBLE PRECISION NOT NULL DEFAULT 0
        )
    """)
    if df.empty:
        # 최소 스키마 보장
        df = pd.DataFrame(columns=["project_id","pop_score"])
    df_to_table(ai, df, "raw_item_popularity")

def build_mappings(ai):
    # users/projects 매핑(JSON)
    ints = pd.read_sql("SELECT DISTINCT user_id, project_id FROM raw_interactions", ai)
    # 유저/프로젝트가 전혀 없다면, raw_user_features/raw_project_features에서라도 가져오기
    if ints.empty:
        udf = pd.read_sql("SELECT DISTINCT user_id FROM raw_user_features", ai)
        pdf = pd.read_sql("SELECT DISTINCT project_id FROM raw_project_features", ai)
        u_ids = sorted(set(map(int, udf["user_id"].tolist()))) if not udf.empty else []
        p_ids = sorted(set(map(int, pdf["project_id"].tolist()))) if not pdf.empty else []
    else:
        u_ids = sorted(set(map(int, ints["user_id"].tolist())))
        p_ids = sorted(set(map(int, ints["project_id"].tolist())))

    u2i = {str(u): i for i, u in enumerate(u_ids)}
    i2u = {str(i): u for u, i in u2i.items()}
    p2i = {str(p): i for i, p in enumerate(p_ids)}
    i2p = {str(i): p for p, i in p2i.items()}

    (MAPD / "users.json").write_text(json.dumps(u2i), encoding="utf-8")
    (MAPD / "users_rev.json").write_text(json.dumps(i2u), encoding="utf-8")
    (MAPD / "projects.json").write_text(json.dumps(p2i), encoding="utf-8")
    (MAPD / "projects_rev.json").write_text(json.dumps(i2p), encoding="utf-8")

def main():
    require_vars()
    hp = create_engine(MAIN_DB_URL, pool_pre_ping=True, future=True)
    ai = create_engine(DATABASE_URL, pool_pre_ping=True, future=True)

    extract_user_features(hp, ai)
    extract_project_features(hp, ai)
    extract_interactions(hp, ai)
    extract_project_meta(hp, ai)     # ⬅️ 신규
    compute_item_popularity(ai)      # ⬅️ 신규
    build_mappings(ai)

if __name__ == "__main__":
    main()
