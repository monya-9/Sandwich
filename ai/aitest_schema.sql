-- schema.sql
CREATE TABLE IF NOT EXISTS weekly_ranks (
  week TEXT NOT NULL,
  user TEXT NOT NULL,
  rank INTEGER NOT NULL,
  score REAL NOT NULL,
  accuracy REAL NOT NULL,
  time_med_sec REAL,
  time_mean_sec REAL,
  time_p95_sec REAL,
  mem_med_mb REAL,
  mem_p95_mb REAL,
  PRIMARY KEY (week, user)
);

CREATE TABLE IF NOT EXISTS weekly_results (
  week TEXT NOT NULL,
  user TEXT NOT NULL,
  passed_all INTEGER NOT NULL,        -- 1/0
  message TEXT NOT NULL,              -- "정답입니다!" 또는 진단 요약
  first_fail_case INTEGER,            -- 실패 시 첫 실패 케이스
  reason TEXT,                        -- whitespace/format_mismatch/...
  hint TEXT,                          -- 수정 힌트
  diff TEXT,                          -- 짧은 diff
  PRIMARY KEY (week, user)
);
