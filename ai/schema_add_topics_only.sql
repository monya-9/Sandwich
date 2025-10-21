-- ===== 신규: 월간/주간 MD 저장 =====
CREATE TABLE IF NOT EXISTS monthly_topics (
  ym         TEXT    NOT NULL PRIMARY KEY,   -- 'YYYY-MM'
  title      TEXT    NOT NULL,
  summary    TEXT    NOT NULL,
  must_json  TEXT    NOT NULL,               -- JSON 문자열(배열)
  md         TEXT    NOT NULL,               -- 렌더링된 마크다운
  created_at INTEGER NOT NULL DEFAULT (unixepoch()),
  updated_at INTEGER NOT NULL DEFAULT (unixepoch())
);
CREATE INDEX IF NOT EXISTS idx_monthly_topics_ym ON monthly_topics(ym);

CREATE TABLE IF NOT EXISTS weekly_topics (
  week       TEXT    NOT NULL PRIMARY KEY,   -- 'YYYYWww'
  title      TEXT    NOT NULL,
  summary    TEXT    NOT NULL,
  must_json  TEXT    NOT NULL,               -- JSON 문자열(배열)
  md         TEXT    NOT NULL,               -- 렌더링된 마크다운
  created_at INTEGER NOT NULL DEFAULT (unixepoch()),
  updated_at INTEGER NOT NULL DEFAULT (unixepoch())
);
CREATE INDEX IF NOT EXISTS idx_weekly_topics_week ON weekly_topics(week);