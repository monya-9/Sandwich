// src/index.js
export default {
  async fetch(request, env) {
    try {
      const url = new URL(request.url);
      if (!url.pathname.startsWith("/api/reco/")) {
        return sendJSON({ error: "not_found" }, 404);
      }

      // 개인화 추천 조회
      const mUserGet = url.pathname.match(/^\/api\/reco\/user\/(\d+)$/);
      if (mUserGet && request.method === "GET") {
        const uidx = toInt(mUserGet[1]);
        return getUserRecs(env, uidx);
      }

      // 개인화 추천 업서트(배치)
      if (url.pathname === "/api/reco/admin/upsert/user" && request.method === "POST") {
        if (!needKey(request, env)) return sendJSON({ error: "unauthorized" }, 401);
        const body = await readJsonSafe(request);
        return upsertUserRecs(env, body);
      }

    const sendJSON = (obj, status = 200) =>
      new Response(JSON.stringify(obj), {
        status,
        headers: { "content-type": "application/json" },
      });

    // ---- Asia/Seoul 기준 날짜/주 계산 ----
    const nowSeoul = () => {
      const now = new Date();
      // Asia/Seoul 오프셋(+09:00) 고정 사용
      const offsetMs = 9 * 60 * 60 * 1000;
      return new Date(now.getTime() + offsetMs - now.getTimezoneOffset() * 60000);
    };
    const todayYMD = () => {
      const d = nowSeoul();
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, "0");
      const dd = String(d.getDate()).padStart(2, "0");
      return `${y}${m}${dd}`;
    };
    const thisISOWeek = () => {
      // ISO week 계산(Seoul 기준)
      const d = nowSeoul();
      // 목요일 기준
      const target = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
      const dayNr = (target.getUTCDay() + 6) % 7; // 0=월
      target.setUTCDate(target.getUTCDate() - dayNr + 3);
      const firstThursday = new Date(Date.UTC(target.getUTCFullYear(), 0, 4));
      const dayDiff = (target - firstThursday) / 86400000;
      const week = 1 + Math.round(dayDiff / 7);
      const year = target.getUTCFullYear();
      return `${year}W${String(week).padStart(2, "0")}`;
    };

    // ---- top_week 컬럼명 자동감지(week | iso_week) ----
    async function detectWeekCol(env) {
      // 간단 캐시
      if (env.__weekCol) return env.__weekCol;
      const rows = await env.SANDWICH_RECO.prepare(
        `PRAGMA table_info(top_week);`
      ).all();
      const cols = new Set((rows?.results || []).map(r => r.name));
      env.__weekCol = cols.has("week") ? "week" : "iso_week";
      return env.__weekCol;
    }

    // ================== READ APIs ==================

    // 일간 TOP 읽기: /api/reco/top/day?ymd=YYYYMMDD
    if (url.pathname === "/api/reco/top/day") {
      let ymd = url.searchParams.get("ymd") || todayYMD();

      // 1차 조회
      let row = await env.SANDWICH_RECO
        .prepare(`SELECT items FROM top_day WHERE ymd=?`)
        .bind(ymd)
        .first();

      // 없으면 최신 1건 fallback
      if (!row) {
        row = await env.SANDWICH_RECO
          .prepare(`SELECT items FROM top_day ORDER BY ymd DESC LIMIT 1`)
          .first();
        if (!row) return new Response("[]", { headers: { "content-type": "application/json" } });
      }

      // items 원문(JSON 문자열) 그대로 반환
      return new Response(row.items ?? "[]", {
        headers: { "content-type": "application/json" },
      });
    }

    // 주간 TOP 읽기: /api/reco/top/week?week=YYYYWww (또는 ?iso=YYYYWww)
    if (url.pathname === "/api/reco/top/week") {
      let week = url.searchParams.get("week") || url.searchParams.get("iso") || thisISOWeek();
      const weekCol = await detectWeekCol(env);

      // 1차 조회
      let row = await env.SANDWICH_RECO
        .prepare(`SELECT items FROM top_week WHERE ${weekCol}=?`)
        .bind(week)
        .first();

      // 없으면 최신 1건 fallback
      if (!row) {
        row = await env.SANDWICH_RECO
          .prepare(`SELECT items FROM top_week ORDER BY ${weekCol} DESC LIMIT 1`)
          .first();
        if (!row) return new Response("[]", { headers: { "content-type": "application/json" } });
      }

      return new Response(row.items ?? "[]", {
        headers: { "content-type": "application/json" },
      });
    }

      // 일간 TOP 업서트
      if (url.pathname === "/api/reco/admin/upsert/top/day" && request.method === "POST") {
        if (!needKey(request, env)) return sendJSON({ error: "unauthorized" }, 401);
        const body = await readJsonSafe(request);
        return upsertTopDay(env, body);
      }

      // 주간 TOP 업서트
      if (url.pathname === "/api/reco/admin/upsert/top/week" && request.method === "POST") {
        if (!needKey(request, env)) return sendJSON({ error: "unauthorized" }, 401);
        const body = await readJsonSafe(request);
        return upsertTopWeek(env, body);
      }

      return sendJSON({ error: "not_found" }, 404);
    } catch (e) {
      return sendJSON({ error: "exception", message: String(e?.stack || e) }, 500);
    }
  },
};

/* ========== 공통 유틸 ========== */
function sendJSON(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "access-control-allow-origin": "*",
      "access-control-allow-headers": "Content-Type,X-AI-API-Key",
      "access-control-allow-methods": "GET,POST,OPTIONS",
    },
  });
}

function toInt(v) {
  const n = Number(v);
  return Number.isFinite(n) ? Math.trunc(n) : NaN;
}

function needKey(request, env) {
  const need = env.AI_API_KEY;
  if (!need) return true;
  const got = request.headers.get("X-AI-API-Key");
  return got === need;
}

async function readJsonSafe(request) {
  try { return await request.json(); } catch { return {}; }
}

/* ========== D1: 개인화(user_recs) ========== */
async function getUserRecs(env, uidx) {
  if (!Number.isFinite(uidx)) return sendJSON({ error: "bad_u_idx" }, 400);
  const rs = await env.SANDWICH_RECO.prepare(`
    SELECT project_id, score
    FROM user_recs
    WHERE u_idx = ?
    ORDER BY score DESC, project_id ASC
  `).bind(uidx).all();

  const rows = rs.results || [];
  return sendJSON({
    u_idx: uidx,
    total: rows.length,
    data: rows.map(r => ({ project_id: Number(r.project_id), score: Number(r.score) })),
  });
}

async function upsertUserRecs(env, body) {
  const u_idx = toInt(body.u_idx ?? body.uIdx);
  if (!Number.isFinite(u_idx)) return sendJSON({ error: "missing_u_idx" }, 400);

  const items = Array.isArray(body.items) ? body.items : [];
  const replace = !!body.replace;

  const batch = [];
  if (replace) {
    batch.push(env.SANDWICH_RECO.prepare(`DELETE FROM user_recs WHERE u_idx = ?`).bind(u_idx));
  }
  for (const it of items) {
    const pid = toInt(it.project_id ?? it.projectId);
    const score = Number(it.score);
    if (!Number.isFinite(pid) || !Number.isFinite(score)) continue;
    batch.push(
      env.SANDWICH_RECO.prepare(
        `INSERT INTO user_recs (u_idx, project_id, score, updated_at)
         VALUES (?, ?, ?, CURRENT_TIMESTAMP)
         ON CONFLICT(u_idx, project_id)
         DO UPDATE SET score=excluded.score, updated_at=CURRENT_TIMESTAMP`
      ).bind(u_idx, pid, score)
    );
  }

  if (batch.length === 0) return sendJSON({ ok: true, u_idx, upserted: 0, replaced: replace });
  const res = await env.SANDWICH_RECO.batch(batch, "exclusive");
  return sendJSON({ ok: true, u_idx, upserted: items.length, replaced: replace, tx: res.length });
}

/* ========== D1: 일간/주간 TOP (items JSON 그대로 반환) ========== */
async function getTopDay(env, ymd) {
  if (!/^\d{8}$/.test(ymd)) return sendJSON({ error: "bad_date_YYYYMMDD" }, 400);
  const row = await env.SANDWICH_RECO.prepare(`SELECT items FROM top_day WHERE ymd = ?`).bind(ymd).first();
  if (!row) return sendJSON({ ymd, total: 0, data: [] });

  let items;
  try { items = JSON.parse(row.items || "[]"); } catch { items = []; }
  return sendJSON({ ymd, total: Array.isArray(items) ? items.length : 0, data: items });
}

async function getTopWeek(env, week) {
  if (!/^\d{4}W\d{2}$/.test(week)) return sendJSON({ error: "bad_week_YYYYWww" }, 400);
  const row = await env.SANDWICH_RECO.prepare(`SELECT items FROM top_week WHERE week = ?`).bind(week).first();
  if (!row) return sendJSON({ week, total: 0, data: [] });

  let items;
  try { items = JSON.parse(row.items || "[]"); } catch { items = []; }
  return sendJSON({ week, total: Array.isArray(items) ? items.length : 0, data: items });
}

async function upsertTopDay(env, body) {
  const ymd = String(body.ymd || "").trim();
  if (!/^\d{8}$/.test(ymd)) return sendJSON({ error: "bad_date_YYYYMMDD" }, 400);

  const itemsJson = JSON.stringify(Array.isArray(body.items) ? body.items : []);
  await env.SANDWICH_RECO.prepare(
    `INSERT INTO top_day (ymd, items, updated_at)
     VALUES (?, ?, CURRENT_TIMESTAMP)
     ON CONFLICT(ymd) DO UPDATE SET items=excluded.items, updated_at=CURRENT_TIMESTAMP`
  ).bind(ymd, itemsJson).run();

  return sendJSON({ ok: true, ymd });
}

async function upsertTopWeek(env, body) {
  const week = String(body.week || body.iso || "").trim();
  if (!/^\d{4}W\d{2}$/.test(week)) return sendJSON({ error: "bad_week_YYYYWww" }, 400);

  const itemsJson = JSON.stringify(Array.isArray(body.items) ? body.items : []);
  await env.SANDWICH_RECO.prepare(
    `INSERT INTO top_week (week, items, updated_at)
     VALUES (?, ?, CURRENT_TIMESTAMP)
     ON CONFLICT(week) DO UPDATE SET items=excluded.items, updated_at=CURRENT_TIMESTAMP`
  ).bind(week, itemsJson).run();

  return sendJSON({ ok: true, week });
}
