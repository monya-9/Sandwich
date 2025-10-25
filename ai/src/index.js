export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    const json = (obj, status = 200) =>
      new Response(JSON.stringify(obj), {
        status,
        headers: { "Content-Type": "application/json; charset=utf-8" },
      });

    const needKey = (req) => {
      const headerName = env.AI_HEADER || "X-AI-API-Key";
      const must = env.AI_API_KEY;
      if (!must) return true;
      const got = req.headers.get(headerName);
      return got === must;
    };

    const parseItems = (txt) => {
      if (!txt) return [];
      try { return JSON.parse(txt); }
      catch (_) {
        try { return JSON.parse(txt.replace(/""/g, '"')); }
        catch { return []; }
      }
    };

    // helper: ISO 주차 YYYYWww 생성
    const isoWeekStr = (date) => {
      const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
      d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7)); // 목요일 기준
      const year = d.getUTCFullYear();
      const yearStart = new Date(Date.UTC(year, 0, 1));
      const week = Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
      return `${year}W${String(week).padStart(2, "0")}`;
    };

    // health
    if (url.pathname === "/api/reco/health") return json({ ok: true });

    // ---------- user recs read ----------
    if (url.pathname.startsWith("/api/reco/user/") && request.method === "GET") {
      const u = Number(url.pathname.split("/").pop());
      const limit = Number(url.searchParams.get("limit") || "10");
      const rows = await env.SANDWICH_RECO.prepare(
        `SELECT project_id, score
           FROM user_recs
          WHERE u_idx = ?
          ORDER BY score DESC, project_id ASC
          LIMIT ?`
      ).bind(u, limit).all();
      return json({ u_idx: u, total: rows.results?.length || 0, data: rows.results || [] });
    }

    // ---------- user recs upsert (admin) ----------
    if (url.pathname === "/api/reco/admin/upsert/user" && request.method === "POST") {
      if (!needKey(request)) return json({ error: "unauthorized" }, 401);
      let body; try { body = await request.json(); } catch { return json({ error: "bad_json" }, 400); }

      const u_idx = Number(body.u_idx ?? body.user ?? body.user_id ?? body.uid);
      if (!Number.isFinite(u_idx)) return json({ error: "missing_u_idx" }, 400);

      const items = Array.isArray(body.items) ? body.items : [];
      const replace = !!body.replace;
      const now = Math.floor(Date.now() / 1000);

      const stmts = [];
      if (replace) stmts.push(env.SANDWICH_RECO.prepare(`DELETE FROM user_recs WHERE u_idx=?`).bind(u_idx));

      for (const it of items) {
        const pid = Number(it.project_id ?? it.pid ?? it.id);
        const score = Number(it.score ?? it.s);
        if (!Number.isFinite(pid) || !Number.isFinite(score)) continue;
        stmts.push(
          env.SANDWICH_RECO.prepare(
            `INSERT INTO user_recs (u_idx, project_id, score, updated_at)
             VALUES (?,?,?,?)
             ON CONFLICT(u_idx, project_id) DO UPDATE SET
               score=excluded.score, updated_at=excluded.updated_at`
          ).bind(u_idx, pid, score, now)
        );
      }
      if (stmts.length) await env.SANDWICH_RECO.batch(stmts);
      return json({ ok: true, u_idx, count: items.length, replaced: replace });
    }

    // ---------- daily top read ----------
    if (url.pathname === "/api/reco/top/day" && request.method === "GET") {
      let ymd = url.searchParams.get("ymd");
      if (!ymd) {
        const now = new Date();
        const mm = String(now.getMonth() + 1).padStart(2, "0");
        const dd = String(now.getDate()).padStart(2, "0");
        ymd = `${now.getFullYear()}${mm}${dd}`;
      }
      const limit = Number(url.searchParams.get("k") || url.searchParams.get("limit") || "0");
      const row = await env.SANDWICH_RECO.prepare(`SELECT items FROM top_day WHERE ymd=?`).bind(ymd).first();
      if (!row) return json({ ymd, total: 0, data: [] });
      let items = parseItems(row.items);
      if (limit > 0) items = items.slice(0, limit);
      return json({ ymd, total: items.length, data: items });
    }

    // ---------- weekly top read ----------
    if (url.pathname === "/api/reco/top/week" && request.method === "GET") {
      let week = (url.searchParams.get("week") || url.searchParams.get("iso") || "").trim();
      if (!week) week = isoWeekStr(new Date()); // 기본값: 현재 ISO 주
      const limit = Number(url.searchParams.get("k") || url.searchParams.get("limit") || "0");
      const row = await env.SANDWICH_RECO.prepare(`SELECT items FROM top_week WHERE week=?`).bind(week).first();
      if (!row) return json({ week, total: 0, data: [] });
      let items = parseItems(row.items);
      if (limit > 0) items = items.slice(0, limit);
      return json({ week, total: items.length, data: items });
    }
    // === 추가: 주간 문제 다건 업서트 ===
    if (url.pathname === "/api/reco/admin/upsert/topics/weekly-multi" && request.method === "POST") {
      if (!needKey(request)) return json({ error: "unauthorized" }, 401);
      let body; try { body = await request.json(); } catch { return json({ error: "bad_json" }, 400); }

      const week = String(body.week ?? body.iso ?? body.iso_week ?? "").trim();
      const idx  = Number(body.idx ?? body.index ?? 0); // 1..3
      const title = String(body.title ?? "").trim();
      const summary = String(body.summary ?? "").trim();
      const must = Array.isArray(body.must) ? body.must
                 : Array.isArray(body.must_have) ? body.must_have : [];
      const md = String(body.md ?? "").trim();

      if (!/^20\d{2}W\d{2}$/.test(week)) return json({ error: "bad_week_YYYYWww" }, 400);
      if (!Number.isFinite(idx) || idx < 1) return json({ error: "bad_idx" }, 400);
      if (!title || !summary) return json({ error: "missing_fields" }, 400);

      const now = Math.floor(Date.now() / 1000);
      await env.SANDWICH_RECO.prepare(
        `INSERT INTO weekly_topics_multi
           (week, idx, title, summary, must_json, md, created_at, updated_at)
         VALUES (?,?,?,?,?,?,?,?)
         ON CONFLICT(week, idx) DO UPDATE SET
           title=excluded.title,
           summary=excluded.summary,
           must_json=excluded.must_json,
           md=excluded.md,
           updated_at=excluded.updated_at`
      ).bind(week, idx, title, summary, JSON.stringify(must || []), md, now, now).run();

      return json({ ok: true, week, idx });
    }

    // === 추가: 주간 문제 목록 조회 ===
    // GET /api/reco/topics/weekly/list?week=2025W43  (week 미지정 시 현재 ISO 주)
    if (url.pathname === "/api/reco/topics/weekly/list" && request.method === "GET") {
      let week = (url.searchParams.get("week") || "").trim();
      if (!week) week = isoWeekStr(new Date());
      const rows = await env.SANDWICH_RECO.prepare(
        `SELECT week, idx, title, summary, must_json, updated_at
           FROM weekly_topics_multi
          WHERE week=?
          ORDER BY idx ASC`
      ).bind(week).all();
      const data = (rows.results || []).map(r => ({
        idx: r.idx,
        title: r.title,
        summary: r.summary,
        must_have: parseItems(r.must_json || "[]"),
        updated_at: r.updated_at
      }));
      return json({ week, total: data.length, data });
    }

    // ---------- monthly topics read (latest, no md) ----------
    if (url.pathname === "/api/reco/monthly" && request.method === "GET") {
      const row = await env.SANDWICH_RECO.prepare(
        `SELECT ym, title, summary, must_json, updated_at
           FROM monthly_topics
          ORDER BY updated_at DESC, ym DESC
          LIMIT 1`
      ).first();
      if (!row) return json({ found: false, data: null });
      return json({
        ym: row.ym, found: true,
        data: { title: row.title, summary: row.summary, must_have: JSON.parse(row.must_json || "[]"), updated_at: row.updated_at }
      });
    }

    // ---------- monthly topics read (by ym, no md) ----------
    if (url.pathname === "/api/reco/topics/monthly" && request.method === "GET") {
      const ym = (url.searchParams.get("ym") || "").trim();
      if (!ym) return json({ error: "missing_ym" }, 400);
      const row = await env.SANDWICH_RECO.prepare(
        `SELECT ym, title, summary, must_json, updated_at
           FROM monthly_topics
          WHERE ym=?`
      ).bind(ym).first();
      if (!row) return json({ ym, found: false, data: [] });
      return json({
        ym, found: true,
        data: { title: row.title, summary: row.summary, must_have: JSON.parse(row.must_json || "[]"), updated_at: row.updated_at }
      });
    }

    // ---------- weekly topics read (latest, no md) ----------
    if (url.pathname === "/api/reco/weekly" && request.method === "GET") {
      const row = await env.SANDWICH_RECO.prepare(
        `SELECT week, title, summary, must_json, updated_at
           FROM weekly_topics
          ORDER BY updated_at DESC, week DESC
          LIMIT 1`
      ).first();
      if (!row) return json({ found: false, data: null });
      return json({
        week: row.week, found: true,
        data: { title: row.title, summary: row.summary, must_have: JSON.parse(row.must_json || "[]"), updated_at: row.updated_at }
      });
    }

    // ---------- weekly topics read (by week, no md) ----------
    if (url.pathname === "/api/reco/topics/weekly" && request.method === "GET") {
      const week = (url.searchParams.get("week") || "").trim();
      if (!week) return json({ error: "missing_week" }, 400);
      const row = await env.SANDWICH_RECO.prepare(
        `SELECT week, title, summary, must_json, updated_at
           FROM weekly_topics
          WHERE week=?`
      ).bind(week).first();
      if (!row) return json({ week, found: false, data: [] });
      return json({
        week, found: true,
        data: { title: row.title, summary: row.summary, must_have: JSON.parse(row.must_json || "[]"), updated_at: row.updated_at }
      });
    }

    // ---------- monthly topics upsert (admin) ----------
    if (url.pathname === "/api/reco/admin/upsert/topics/monthly" && request.method === "POST") {
      if (!needKey(request)) return json({ error: "unauthorized" }, 401);
      let body; try { body = await request.json(); } catch { return json({ error: "bad_json" }, 400); }

      const ym = String(body.ym ?? body.month ?? body["YYYY-MM"] ?? body.date ?? "").trim();
      const title = String(body.title ?? body.topic ?? body.name ?? "").trim();
      const summary = String(body.summary ?? body.desc ?? body.description ?? "").trim();
      const must = Array.isArray(body.must) ? body.must
                 : Array.isArray(body.must_have) ? body.must_have
                 : [];
      const md = String(body.md ?? body.markdown ?? body.content ?? "").trim();

      if (!ym || !title || !summary) return json({ error: "missing_fields" }, 400);
      const now = Math.floor(Date.now() / 1000);
      await env.SANDWICH_RECO.prepare(
        `INSERT INTO monthly_topics (ym, title, summary, must_json, md, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?)
         ON CONFLICT(ym) DO UPDATE SET
           title=excluded.title,
           summary=excluded.summary,
           must_json=excluded.must_json,
           md=excluded.md,
           updated_at=excluded.updated_at`
      ).bind(ym, title, summary, JSON.stringify(must || []), md, now, now).run();
      return json({ ok: true, ym });
    }

    // ========== NEW: monthly topics MULTI upsert (admin) ==========
    // POST /api/reco/admin/upsert/topics/monthly-multi
    // { ym, idx:1..3, title, summary, must|must_have, md }
    if (url.pathname === "/api/reco/admin/upsert/topics/monthly-multi" && request.method === "POST") {
      if (!needKey(request)) return json({ error: "unauthorized" }, 401);
      let body; try { body = await request.json(); } catch { return json({ error: "bad_json" }, 400); }

      const ym = String(body.ym ?? body.month ?? body["YYYY-MM"] ?? "").trim();
      const idx = Number(body.idx ?? body.index ?? 0);
      const title = String(body.title ?? "").trim();
      const summary = String(body.summary ?? "").trim();
      const must = Array.isArray(body.must) ? body.must
                 : Array.isArray(body.must_have) ? body.must_have : [];
      const md = String(body.md ?? "").trim();

      if (!/^\d{4}-\d{2}$/.test(ym)) return json({ error: "bad_ym_YYYY-MM" }, 400);
      if (!Number.isFinite(idx) || idx < 1) return json({ error: "bad_idx" }, 400);
      if (!title || !summary) return json({ error: "missing_fields" }, 400);

      const now = Math.floor(Date.now() / 1000);
      await env.SANDWICH_RECO.prepare(
        `INSERT INTO monthly_topics_multi
           (ym, idx, title, summary, must_json, md, created_at, updated_at)
         VALUES (?,?,?,?,?,?,?,?)
         ON CONFLICT(ym, idx) DO UPDATE SET
           title=excluded.title,
           summary=excluded.summary,
           must_json=excluded.must_json,
           md=excluded.md,
           updated_at=excluded.updated_at`
      ).bind(ym, idx, title, summary, JSON.stringify(must || []), md, now, now).run();

      return json({ ok: true, ym, idx });
    }

    // ========== NEW: monthly topics MULTI list ==========
    // GET /api/reco/topics/monthly/list?ym=YYYY-MM
    // ym 없으면 updated_at DESC 기준 최신 ym 선택 후 반환
    if (url.pathname === "/api/reco/topics/monthly/list" && request.method === "GET") {
      let ym = (url.searchParams.get("ym") || "").trim();

      if (!ym) {
        const row = await env.SANDWICH_RECO.prepare(
          `SELECT ym
             FROM monthly_topics_multi
            ORDER BY updated_at DESC, ym DESC
            LIMIT 1`
        ).first();
        if (!row) return json({ found: false, total: 0, data: [] });
        ym = row.ym;
      }

      const rows = await env.SANDWICH_RECO.prepare(
        `SELECT ym, idx, title, summary, must_json, updated_at
           FROM monthly_topics_multi
          WHERE ym=?
          ORDER BY idx ASC`
      ).bind(ym).all();

      const data = (rows.results || []).map(r => ({
        idx: r.idx,
        title: r.title,
        summary: r.summary,
        must_have: parseItems(r.must_json || "[]"),
        updated_at: r.updated_at
      }));

      return json({ ym, total: data.length, data, found: data.length > 0 });
    }

    // ---------- weekly topics upsert (admin) ----------
    if (url.pathname === "/api/reco/admin/upsert/topics/weekly" && request.method === "POST") {
      if (!needKey(request)) return json({ error: "unauthorized" }, 401);
      let body; try { body = await request.json(); } catch { return json({ error: "bad_json" }, 400); }

      const week = String(body.week ?? body.iso ?? body.iso_week ?? body["YYYYWww"] ?? "").trim();
      const title = String(body.title ?? body.topic ?? body.name ?? "").trim();
      const summary = String(body.summary ?? body.desc ?? body.description ?? "").trim();
      const must = Array.isArray(body.must) ? body.must
                 : Array.isArray(body.must_have) ? body.must_have
                 : [];
      const md = String(body.md ?? body.markdown ?? body.content ?? "").trim();

      if (!week || !title || !summary) return json({ error: "missing_fields" }, 400);
      const now = Math.floor(Date.now() / 1000);
      await env.SANDWICH_RECO.prepare(
        `INSERT INTO weekly_topics (week, title, summary, must_json, md, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?)
         ON CONFLICT(week) DO UPDATE SET
           title=excluded.title,
           summary=excluded.summary,
           must_json=excluded.must_json,
           md=excluded.md,
           updated_at=excluded.updated_at`
      ).bind(week, title, summary, JSON.stringify(must || []), md, now, now).run();
      return json({ ok: true, week });
    }

    // ---------- NEW: daily top upsert (admin) ----------
    if (url.pathname === "/api/reco/admin/upsert/top/day" && request.method === "POST") {
      if (!needKey(request)) return json({ error: "unauthorized" }, 401);
      let body; try { body = await request.json(); } catch { return json({ error: "bad_json" }, 400); }

      const ymd = String(body.ymd ?? "").trim();
      if (!/^\d{8}$/.test(ymd)) return json({ error: "bad_ymd_YYYYMMDD" }, 400);

      const rawItems = Array.isArray(body.items) ? body.items : [];
      const items = [];
      for (const it of rawItems) {
        const pid = Number(it.project_id ?? it.pid ?? it.id);
        const score = Number(it.score ?? it.s);
        if (Number.isFinite(pid) && Number.isFinite(score)) items.push({ project_id: pid, score });
      }
      const now = Math.floor(Date.now() / 1000);
      await env.SANDWICH_RECO.prepare(
        `INSERT INTO top_day (ymd, items, updated_at)
         VALUES (?, ?, ?)
         ON CONFLICT(ymd) DO UPDATE SET
           items=excluded.items,
           updated_at=excluded.updated_at`
      ).bind(ymd, JSON.stringify(items), now).run();
      return json({ ok: true, ymd, count: items.length });
    }

    // ---------- NEW: weekly top upsert (admin) ----------
    if (url.pathname === "/api/reco/admin/upsert/top/week" && request.method === "POST") {
      if (!needKey(request)) return json({ error: "unauthorized" }, 401);
      let body; try { body = await request.json(); } catch { return json({ error: "bad_json" }, 400); }

      const week = String(body.week ?? body.iso ?? body.iso_week ?? "").trim();
      if (!/^20\d{2}W\d{2}$/.test(week)) return json({ error: "bad_week_YYYYWww" }, 400);

      const rawItems = Array.isArray(body.items) ? body.items : [];
      const items = [];
      for (const it of rawItems) {
        const pid = Number(it.project_id ?? it.pid ?? it.id);
        const score = Number(it.score ?? it.s);
        if (Number.isFinite(pid) && Number.isFinite(score)) items.push({ project_id: pid, score });
      }
      const now = Math.floor(Date.now() / 1000);
      await env.SANDWICH_RECO.prepare(
        `INSERT INTO top_week (week, items, updated_at)
         VALUES (?, ?, ?)
         ON CONFLICT(week) DO UPDATE SET
           items=excluded.items,
           updated_at=excluded.updated_at`
      ).bind(week, JSON.stringify(items), now).run();
      return json({ ok: true, week, count: items.length });
    }
    // GET /api/reco/judge/leaderboard/:week
    if (request.method === "GET") {
      const m = url.pathname.match(/^\/api\/reco\/judge\/leaderboard\/([A-Za-z0-9W]+)$/);
      if (m) {
        const week = m[1];
        const rs = await env.SANDWICH_RECO.prepare(
          `SELECT user, rank, score
             FROM weekly_ranks
            WHERE week=?
            ORDER BY rank ASC`
        ).bind(week).all();
        return json({ week, leaderboard: rs.results ?? [] });
      }
    }


    // GET /api/reco/judge/result/:week/:user
    if (request.method === "GET") {
      const m = url.pathname.match(/^\/api\/reco\/judge\/result\/([A-Za-z0-9W]+)\/(.+)$/);
      if (m) {
        const week = m[1];
        const user = decodeURIComponent(m[2]);
        const row = await env.SANDWICH_RECO.prepare(
          `SELECT user, message
             FROM weekly_results
            WHERE week=? AND user=?`
        ).bind(week, user).first();
        return json({ week, result: row ?? null });
      }
    }


    // POST /api/reco/judge/ingest
if (url.pathname === "/api/reco/judge/ingest" && request.method === "POST") {
  if (!needKey(request)) return json({ error: "unauthorized" }, 401);
  let p; try { p = await request.json(); } catch { return json({ error: "bad_json" }, 400); }

  // 유효성
  if (!p || !p.week) return json({ error: "missing_week" }, 400);
  const DB = env.SANDWICH_RECO;

  try {
    // upsert 준비
    const stmts = [];
    for (const e of (p.leaderboard || [])) {
      stmts.push(
        DB.prepare(
          `INSERT INTO weekly_ranks
           (week,user,rank,score,accuracy,time_med_sec,time_mean_sec,time_p95_sec,mem_med_mb,mem_p95_mb)
           VALUES (?,?,?,?,?,?,?,?,?,?)
           ON CONFLICT(week,user) DO UPDATE SET
             rank=excluded.rank, score=excluded.score, accuracy=excluded.accuracy,
             time_med_sec=excluded.time_med_sec, time_mean_sec=excluded.time_mean_sec,
             time_p95_sec=excluded.time_p95_sec, mem_med_mb=excluded.mem_med_mb, mem_p95_mb=excluded.mem_p95_mb`
        ).bind(
          p.week, e.user, e.rank, e.score, e.accuracy,
          e.time_med_sec ?? null, e.time_mean_sec ?? null, e.time_p95_sec ?? null,
          e.mem_med_mb ?? null, e.mem_p95_mb ?? null
        )
      );
    }
    for (const r of (p.results || [])) {
      stmts.push(
        DB.prepare(
          `INSERT INTO weekly_results
           (week,user,passed_all,message,first_fail_case,reason,hint,diff)
           VALUES (?,?,?,?,?,?,?,?)
           ON CONFLICT(week,user) DO UPDATE SET
             passed_all=excluded.passed_all, message=excluded.message,
             first_fail_case=excluded.first_fail_case, reason=excluded.reason,
             hint=excluded.hint, diff=excluded.diff`
        ).bind(
          p.week, r.user, r.passed_all ? 1 : 0, r.message,
          r.first_fail_case ?? null, r.reason ?? null, r.hint ?? null, r.diff ?? null
        )
      );
    }

    // D1 batch는 너무 크면 실패할 수 있음 → 40개씩 끊어서 실행
    let wrote = 0;
    for (let i = 0; i < stmts.length; i += 40) {
      const chunk = stmts.slice(i, i + 40);
      const res = await DB.batch(chunk);
      wrote += res.length;
    }
    return json({ ok: true, wrote });
  } catch (err) {
    // 에러 원인 확인용 상세 반환
    return json({ error: "d1_batch_failed", detail: String(err) }, 500);
  }
}

    return json({ error: "not_found" }, 404);
  },
};
