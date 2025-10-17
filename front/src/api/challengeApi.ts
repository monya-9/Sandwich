// src/api/challengeApi.ts
// 챌린지 관련 API

import api from './axiosInstance';

// ===== 챌린지 관련 타입 정의 =====

export type ChallengeType = "CODE" | "PORTFOLIO";

export type ChallengeStatus = "DRAFT" | "OPEN" | "VOTING" | "ENDED";

export type ChallengeListItem = {
  id: number;
  type: ChallengeType;
  title: string;
  status: ChallengeStatus;
  startAt: string;
  endAt: string;
  voteStartAt?: string;
  voteEndAt?: string;
  submissionCount: number;
  voteCount: number;
};

export type ChallengeListResponse = {
  totalElements: number;
  totalPages: number;
  size: number;
  content: ChallengeListItem[];
  number: number;
  numberOfElements: number;
  first: boolean;
  last: boolean;
  empty: boolean;
};

// ===== AI Sync Payload Types (Frontend -> Backend, exact pass-through) =====

// Monthly: { ym, found, data: { title, summary, must / must_have, md? ... } }
export type AiMonthlyData = {
  ym: string; // YYYY-MM
  found: boolean;
  data: {
    title: string;
    summary?: string;
    must?: string[]; // 서버에서 must_have를 must로 통합한다고 했으므로, 그대로 전달
    must_have?: string[];
    requirements?: string[];
    tips?: string[];
    md?: string;
    [k: string]: any;
  };
};

// Weekly: { week, found, data: { title, summary, must, md? ... } }
export type AiWeeklyData = {
  week: string; // YYYYWww
  found: boolean;
  data: {
    title: string;
    summary?: string;
    must?: string[];
    md?: string;
    [k: string]: any;
  };
};

export type AiSyncResponse = {
  challengeId: number;
  status: ChallengeStatus;
  message?: string;
  [k: string]: any;
};

// ===== INTERNAL AI Batch (Machine → Backend) =====
export type AiBatchItem = {
  title: string;
  type: ChallengeType; // "CODE" | "PORTFOLIO"
  summary: string;
  must?: string[];
  md?: string;
  startAt?: string; // ISO8601
  endAt?: string;   // ISO8601
};

export type AiBatchPayload = {
  month: string; // YYYY-MM
  items: AiBatchItem[];
};

/**
 * INTERNAL 배치 업서트 (AI 서버 전용). 일반 프런트에서 직접 호출하지 않는 용도.
 * 필요한 경우 API 키/멱등키를 인자로 전달.
 */
export async function internalAiChallengesBatch(payload: AiBatchPayload, opts?: { apiKey?: string; idemKey?: string }): Promise<any> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (opts?.apiKey) headers['X-AI-API-Key'] = opts.apiKey;
  if (opts?.idemKey) headers['Idempotency-Key'] = opts.idemKey;
  const res = await api.post('/internal/ai/challenges/batch', payload, { headers, withCredentials: true });
  return res.data;
}

// ===== 챌린지 API 함수들 =====

/**
 * 챌린지 목록 조회
 */
export async function fetchChallenges(
  page: number = 0,
  size: number = 20,
  type?: ChallengeType,
  status?: ChallengeStatus
): Promise<ChallengeListResponse> {
  const params: any = { page, size };
  if (type) params.type = type;
  if (status) params.status = status;
  
  const response = await api.get('/challenges', {
    params,
    withCredentials: true,
  });
  return response.data;
}

/**
 * 특정 챌린지 상세 조회
 */
export async function fetchChallengeDetail(challengeId: number): Promise<any> {
  const response = await api.get(`/challenges/${challengeId}`, {
    withCredentials: true,
  });
  return response.data;
}

// ===== AI Sync Endpoints (Backend) =====

/**
 * 프론트가 AI 월간 데이터를 그대로 전달하여 챌린지를 업서트
 * POST /api/challenges/sync-ai-monthly
 */
export async function syncAiMonthly(payload: AiMonthlyData): Promise<AiSyncResponse> {
  const res = await api.post('/challenges/sync-ai-monthly', payload, { withCredentials: true });
  return res.data;
}

/**
 * 프론트가 AI 주간 데이터를 그대로 전달하여 챌린지를 업서트
 * POST /api/challenges/sync-ai-weekly
 */
export async function syncAiWeekly(payload: AiWeeklyData): Promise<AiSyncResponse> {
  const res = await api.post('/challenges/sync-ai-weekly', payload, { withCredentials: true });
  return res.data;
}

/**
 * 우리 백엔드가 AI에서 월간을 끌어와 업서트 (옵션 ym)
 * GET /api/challenges/sync-ai-monthly/fetch?ym=YYYY-MM
 */
export async function fetchAndSyncAiMonthly(ym?: string): Promise<AiSyncResponse> {
  const res = await api.get('/challenges/sync-ai-monthly/fetch', {
    params: ym ? { ym } : undefined,
    withCredentials: true,
  });
  return res.data;
}

/**
 * 우리 백엔드가 AI에서 주간을 끌어와 업서트 (옵션 week)
 * GET /api/challenges/sync-ai-weekly/fetch?week=YYYYWww
 */
export async function fetchAndSyncAiWeekly(week?: string): Promise<AiSyncResponse> {
  const res = await api.get('/challenges/sync-ai-weekly/fetch', {
    params: week ? { week } : undefined,
    withCredentials: true,
  });
  return res.data;
}

export type ChallengeRuleJson = {
  ym?: string;       // YYYY-MM for portfolio
  week?: string;     // YYYYWww for code
  must?: string[];   // requirements list (can be empty)
  md?: string;       // markdown body (0+)
  [k: string]: any;
};

export type ChallengeUpsertRequest = {
  type: ChallengeType;
  title: string;
  summary?: string;
  status?: ChallengeStatus; // optional – server may default
  startAt: string;     // ISO8601
  endAt: string;       // ISO8601
  voteStartAt?: string; // ISO8601
  voteEndAt?: string;   // ISO8601
  ruleJson?: ChallengeRuleJson; // type-specific keys (ym/week) and content (must/md)
};

export async function createChallenge(payload: ChallengeUpsertRequest): Promise<{ id: number }> {
  const toServerBody = (p: ChallengeUpsertRequest): any => ({
    ...p,
    // 서버 DTO는 ruleJson을 문자열(String)로 기대함 → 객체를 JSON 문자열로 변환
    ruleJson: p.ruleJson ? JSON.stringify(p.ruleJson) : undefined,
  });

  const post = async (path: string, body: ChallengeUpsertRequest) => (await api.post(path, toServerBody(body), { withCredentials: true })).data;
  try {
    return await post('/admin/challenges', payload);
  } catch (e: any) {
    const status = e?.response?.status;
    // 날짜 포맷 문제 가능성: 'T' → ' ' 로 한번 더 시도
    if (status >= 400) {
      const p2: ChallengeUpsertRequest = {
        ...payload,
        startAt: (payload.startAt || '').replace('T', ' '),
        endAt: (payload.endAt || '').replace('T', ' '),
        voteStartAt: payload.voteStartAt ? payload.voteStartAt.replace('T', ' ') : undefined,
        voteEndAt: payload.voteEndAt ? payload.voteEndAt.replace('T', ' ') : undefined,
      };
      try {
        return await post('/admin/challenges', p2);
      } catch {}
    }
    // 폴백은 권한/라우팅 불일치일 때만 수행, 서버 5xx면 재시도하지 않음
    if (status === 404 || status === 405 || status === 403) {
      try {
        return await post('/challenges', payload);
      } catch (e2: any) {
        // 마지막으로 날짜 포맷 변경하여 시도
        const p2: ChallengeUpsertRequest = {
          ...payload,
          startAt: (payload.startAt || '').replace('T', ' '),
          endAt: (payload.endAt || '').replace('T', ' '),
          voteStartAt: payload.voteStartAt ? payload.voteStartAt.replace('T', ' ') : undefined,
          voteEndAt: payload.voteEndAt ? payload.voteEndAt.replace('T', ' ') : undefined,
        };
        return await post('/challenges', p2);
      }
    }
    throw e;
  }
}

export async function updateChallenge(challengeId: number, payload: ChallengeUpsertRequest): Promise<void> {
  const toServerBody = (p: ChallengeUpsertRequest): any => ({
    ...p,
    ruleJson: p.ruleJson ? JSON.stringify(p.ruleJson) : undefined,
  });

  const patch = async (path: string, body: ChallengeUpsertRequest) => api.patch(path, toServerBody(body), { withCredentials: true });
  try {
    await patch(`/admin/challenges/${challengeId}`, payload);
  } catch (e: any) {
    const status = e?.response?.status;
    if (status >= 400) {
      const p2: ChallengeUpsertRequest = {
        ...payload,
        startAt: (payload.startAt || '').replace('T', ' '),
        endAt: (payload.endAt || '').replace('T', ' '),
        voteStartAt: payload.voteStartAt ? payload.voteStartAt.replace('T', ' ') : undefined,
        voteEndAt: payload.voteEndAt ? payload.voteEndAt.replace('T', ' ') : undefined,
      };
      try { await patch(`/admin/challenges/${challengeId}`, p2); return; } catch {}
    }
    if (status === 404 || status === 405 || status === 403) {
      try { await patch(`/challenges/${challengeId}`, payload); return; } catch {}
      const p2: ChallengeUpsertRequest = {
        ...payload,
        startAt: (payload.startAt || '').replace('T', ' '),
        endAt: (payload.endAt || '').replace('T', ' '),
        voteStartAt: payload.voteStartAt ? payload.voteStartAt.replace('T', ' ') : undefined,
        voteEndAt: payload.voteEndAt ? payload.voteEndAt.replace('T', ' ') : undefined,
      };
      await patch(`/challenges/${challengeId}`, p2); return;
    }
    throw e;
  }
}

// 상태 전환 API (관리자)
export async function changeChallengeStatus(
  challengeId: number,
  status: ChallengeStatus
): Promise<void> {
  await api.patch(`/admin/challenges/${challengeId}`, { status }, { withCredentials: true });
}

// 관리자: 챌린지 삭제
export async function deleteChallenge(challengeId: number, opts?: { force?: boolean }): Promise<void> {
  const params: any = {};
  if (opts?.force) params.force = true;
  await api.delete(`/admin/challenges/${challengeId}`, { params, withCredentials: true });
}