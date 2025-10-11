-- === top_day: (ymd, project_id, score, ...) -> (ymd, items JSON, updated_at) ===

-- schema.sql  (Cloudflare D1)

-- 개인화 추천 저장
CREATE TABLE IF NOT EXISTS user_recs (
  u_idx       INTEGER  NOT NULL,
  project_id  INTEGER  NOT NULL,
  score       REAL     NOT NULL,
  created_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (u_idx, project_id)
);
CREATE INDEX IF NOT EXISTS idx_user_recs_u ON user_recs(u_idx);

-- 일간 TOP
CREATE TABLE IF NOT EXISTS top_day (
  ymd        TEXT     NOT NULL,   -- 'YYYYMMDD'
  project_id INTEGER  NOT NULL,
  score      REAL     NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (ymd, project_id)
);
CREATE INDEX IF NOT EXISTS idx_top_day_ymd ON top_day(ymd);

-- 주간 TOP
CREATE TABLE IF NOT EXISTS top_week (
  iso_week   TEXT     NOT NULL,   -- 'YYYYWww'
  project_id INTEGER  NOT NULL,
  score      REAL     NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (iso_week, project_id)
);
CREATE INDEX IF NOT EXISTS idx_top_week_iso ON top_week(iso_week);

CREATE TABLE IF NOT EXISTS top_day_new (
  ymd        TEXT    NOT NULL PRIMARY KEY,  -- 'YYYYMMDD'
  items      TEXT    NOT NULL,              -- JSON array of {project_id, score}
  updated_at INTEGER NOT NULL               -- epoch seconds
);

INSERT INTO top_day_new (ymd, items, updated_at)
SELECT
  d.ymd,
  json_group_array(
    json_object('project_id', d.project_id, 'score', d.score)
  ) AS items,
  strftime('%s','now') AS updated_at
FROM top_day AS d
GROUP BY d.ymd;

DROP TABLE top_day;
ALTER TABLE top_day_new RENAME TO top_day;

CREATE TABLE IF NOT EXISTS user_recs (
  u_idx       INTEGER NOT NULL,
  project_id  INTEGER NOT NULL,
  score       REAL    NOT NULL,
  created_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (u_idx, project_id)
);
CREATE INDEX IF NOT EXISTS idx_user_recs_u ON user_recs(u_idx);

-- === top_week: (iso_week, project_id, score, ...) -> (week, items JSON, updated_at) ===
CREATE TABLE IF NOT EXISTS top_week_new (
  week       TEXT    NOT NULL PRIMARY KEY,  -- 'YYYYWww'
  items      TEXT    NOT NULL,              -- JSON array of {project_id, score}
  updated_at INTEGER NOT NULL               -- epoch seconds
);

INSERT INTO top_week_new (week, items, updated_at)
SELECT
  w.iso_week AS week,
  json_group_array(
    json_object('project_id', w.project_id, 'score', w.score)
  ) AS items,
  strftime('%s','now') AS updated_at
FROM top_week AS w
GROUP BY w.iso_week;

DROP TABLE top_week;
ALTER TABLE top_week_new RENAME TO top_week;