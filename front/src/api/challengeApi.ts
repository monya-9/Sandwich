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