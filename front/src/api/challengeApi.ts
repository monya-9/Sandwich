// src/api/challengeApi.ts
// 챌린지 관련 API

import api from './axiosInstance';
import axios from 'axios';

// ===== 챌린지 관련 타입 정의 =====

export type ChallengeType = "CODE" | "PORTFOLIO";

export type ChallengeStatus = "DRAFT" | "OPEN" | "CLOSED" | "VOTING" | "ENDED";

export type ChallengeListItem = {
  id: number;
  type: ChallengeType;
  title: string;
  ruleJson: string;  // 🔥 백엔드에서 추가된 필드
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
  status?: ChallengeStatus,
  config?: { signal?: AbortSignal; sort?: string }
): Promise<ChallengeListResponse> {
  const params: any = { page, size };
  if (type) params.type = type;
  if (status) params.status = status;
  if (config?.sort) params.sort = config.sort;
  
  // ✅ public API: URL 패턴으로 이미 처리됨 (헤더 불필요)
  const response = await api.get('/challenges', {
    params,
    signal: config?.signal,
    withCredentials: true,
    timeout: 8000,
  });
  return response.data;
}

/**
 * 특정 챌린지 상세 조회
 */
export async function fetchChallengeDetail(
  challengeId: number,
  config?: { signal?: AbortSignal }
): Promise<any> {
  // ✅ public API: URL 패턴으로 이미 처리됨 (헤더 불필요)
  const response = await api.get(`/challenges/${challengeId}`, {
    withCredentials: true,
    timeout: 8000,
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
  summary?: string;  // 챌린지 요약 (ruleJson 안에 저장됨)
  [k: string]: any;
};

export type ChallengeUpsertRequest = {
  type: ChallengeType;
  title: string;
  status?: ChallengeStatus; // optional – server may default
  startAt: string;     // ISO8601
  endAt: string;       // ISO8601
  voteStartAt?: string; // ISO8601
  voteEndAt?: string;   // ISO8601
  ruleJson?: ChallengeRuleJson; // type-specific keys (ym/week) and content (must/md), summary는 여기 안에
  selectedIdx?: number; // 선택된 인덱스
  aiMonth?: string;     // AI 월간 식별자 (YYYY-MM)
  aiWeek?: string;      // AI 주간 식별자 (YYYYWww)
};

export async function createChallenge(payload: ChallengeUpsertRequest): Promise<{ id: number }> {
  const toServerBody = (p: ChallengeUpsertRequest): any => ({
    ...p,
    // 서버 DTO는 ruleJson을 문자열(String)로 기대함 → 객체를 JSON 문자열로 변환
    ruleJson: p.ruleJson ? JSON.stringify(p.ruleJson) : undefined,
  });

  const post = async (path: string, body: ChallengeUpsertRequest) => (await api.post(path, toServerBody(body), { baseURL: '' })).data;
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

  const patch = async (path: string, body: ChallengeUpsertRequest) => api.patch(path, toServerBody(body), { baseURL: '' });
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
  await api.patch(`/admin/challenges/${challengeId}/status`, { status }, { baseURL: '' });
}

// 관리자: 챌린지 삭제
export async function deleteChallenge(challengeId: number, opts?: { force?: boolean }): Promise<void> {
  const params: any = {};
  if (opts?.force) params.force = true;
  await api.delete(`/admin/challenges/${challengeId}`, { params, baseURL: '' });
}

// 관리자: 챌린지 목록 조회 (admin 전용)
export async function adminFetchChallenges(params?: {
  page?: number;
  size?: number;
  type?: ChallengeType;
  status?: ChallengeStatus;
  source?: string;
  ym?: string;   // YYYY-MM -> 서버 aiMonth로 매핑할 수도 있음
  week?: string; // YYYYWww -> 서버 aiWeek로 매핑
  sort?: string; // e.g. -startAt
}): Promise<ChallengeListResponse> {
  const p: any = { page: 0, size: 20, sort: '-startAt', ...(params || {}) };
  if (params?.ym) p.aiMonth = params.ym;
  if (params?.week) p.aiWeek = params.week;
  const res = await api.get('/admin/challenges', { params: p, timeout: 10000, baseURL: '' });
    return res.data as ChallengeListResponse;
}

// ===== 리더보드/우승자 관련 =====

/** 관리자: 리더보드 재집계 트리거 */
export async function rebuildLeaderboard(challengeId: number): Promise<void> {
  await api.post(`/admin/challenges/${challengeId}/rebuild-leaderboard`, {}, { baseURL: '' });
}
export type LeaderboardEntry = {
  rank: number;
  submissionId?: number;
  userId: number;
  userName: string;
  userInitial: string;
  profileImageUrl?: string;
  teamName?: string;
  totalScore?: number;
  voteCount?: number;
  credits?: number;
  uiUxAvg?: number;
  creativityAvg?: number;
  codeQualityAvg?: number;
  difficultyAvg?: number;
};

export type LeaderboardResponse = {
  challengeId: number;
  entries: LeaderboardEntry[];
  total: number;
};

/**
 * 포트폴리오 챌린지 리더보드 조회
 */
export async function fetchPortfolioLeaderboard(
  challengeId: number, 
  limit: number = 10
): Promise<LeaderboardResponse> {
  // ✅ public API: URL 패턴으로 이미 처리됨 (헤더 불필요)
  const response = await api.get(`/challenges/${challengeId}/leaderboard`, {
    params: { limit },
    withCredentials: true,
  });
  
  // API 응답이 { items: [...] } 형태인 경우 { entries: [...] } 형태로 변환
  const data = response.data;
  if (data.items && !data.entries) {
    return {
      challengeId: challengeId,
      entries: data.items.map((item: any, index: number) => ({
        rank: index + 1, // 순서대로 1, 2, 3 설정
        submissionId: item.submissionId,
        userId: item.owner?.userId || 0,
        userName: item.owner?.username || 'Unknown',
        userInitial: item.owner?.username ? item.owner.username.charAt(0) : 'U',
        profileImageUrl: item.owner?.profileImageUrl || item.owner?.profileImage || item.owner?.avatarUrl || item.owner?.avatar,
        teamName: item.teamName || '',
        totalScore: item.totalScore || 0,
        voteCount: item.voteCount || 0,
        credits: item.credits || 0,
        uiUxAvg: item.uiUxAvg,
        creativityAvg: item.creativityAvg,
        codeQualityAvg: item.codeQualityAvg,
        difficultyAvg: item.difficultyAvg,
      })),
      total: data.items.length,
    };
  }
  
  return data;
}

/**
 * 코드 챌린지 상위 제출자 조회 (제출물 API 활용)
 */
export async function fetchCodeTopSubmitters(
  challengeId: number,
  limit: number = 10
): Promise<LeaderboardResponse> {
  const response = await api.get(`/challenges/${challengeId}/submissions`, {
    params: { 
      page: 0, 
      size: limit,
      sort: "likeCount,desc" // 좋아요 순으로 정렬
    },
    withCredentials: true,
  });
  
  // 제출물 응답을 리더보드 형식으로 변환
  const submissions = response.data.content || [];
  const entries: LeaderboardEntry[] = submissions.map((sub: any, index: number) => ({
    rank: index + 1,
    userId: sub.authorId || sub.userId || sub.owner?.userId,
    userName: sub.authorName || sub.userName || sub.owner?.username || 'Unknown',
    userInitial: (sub.authorName || sub.userName || sub.owner?.username || 'U')[0].toUpperCase(),
    profileImageUrl: sub.authorProfileImageUrl || sub.profileImageUrl || sub.owner?.profileImageUrl || sub.owner?.profileImage || sub.owner?.avatarUrl || sub.owner?.avatar,
    totalScore: sub.likeCount || 0,
    voteCount: sub.likeCount || 0,
  }));

  return {
    challengeId,
    entries,
    total: response.data.totalElements || entries.length,
  };
}

// ===== 포트폴리오 투표 관련 타입 및 API =====

export type VoteRequest = {
  submissionId: number;
  uiUx: number;
  creativity: number;
  codeQuality: number;
  difficulty: number;
};

export type VoteResponse = {
  id: number;
};

export type MyVoteResponse = {
  submissionId: number;
  uiUx: number;
  creativity: number;
  codeQuality: number;
  difficulty: number;
};

export type VoteSummaryResponse = {
  submissionId: number;
  voteCount: number;
  uiUxAvg: number;
  creativityAvg: number;
  codeQualityAvg: number;
  difficultyAvg: number;
  totalScore: number;
}[];

/**
 * 포트폴리오 챌린지 투표 생성
 */
export async function createVote(
  challengeId: number,
  voteData: VoteRequest
): Promise<VoteResponse> {
  const response = await api.post(`/challenges/${challengeId}/votes`, voteData, {
    withCredentials: true,
  });
  return response.data;
}

/**
 * 내 투표 수정
 */
export async function updateMyVote(
  challengeId: number,
  voteData: VoteRequest
): Promise<VoteResponse> {
  const response = await api.put(`/challenges/${challengeId}/votes/me`, voteData, {
    withCredentials: true,
  });
  return response.data;
}

/**
 * 내 투표 조회
 */
export async function getMyVote(challengeId: number): Promise<MyVoteResponse | null> {
  try {
    const response = await api.get(`/challenges/${challengeId}/votes/me`, {
      withCredentials: true,
    });
    return response.data;
  } catch (error: any) {
    if (error?.response?.status === 404) {
      return null; // 투표하지 않은 경우
    }
    throw error;
  }
}

/**
 * 투표 요약 조회 (공개)
 */
export async function getVoteSummary(challengeId: number): Promise<VoteSummaryResponse> {
  const response = await api.get(`/challenges/${challengeId}/votes/summary`, {
    withCredentials: true,
  });
  return response.data;
}

// ===== AI 생성 문제 목록 관련 =====

export type AiGeneratedChallenge = {
  idx: number;
  title: string;
  summary: string;
  must_have: string[];
  updated_at: number;
};

export type AiChallengeListResponse = {
  week: string;
  total: number;
  data: AiGeneratedChallenge[];
};

/**
 * AI가 생성한 주간 코드 챌린지 목록 조회
 * 로컬: /ext 프록시를 통해 https://api.dnutzs.org/api 에 접근
 * 배포: 환경변수의 AI API URL로 직접 호출
 */
export async function fetchAiGeneratedChallenges(): Promise<AiChallengeListResponse> {
  const isLocalDev = typeof window !== 'undefined' && /localhost:\d+/.test(window.location.host);

  if (isLocalDev) {
    // 로컬 개발에서는 프록시 사용
    const response = await axios.get('/ext/reco/topics/weekly/list', {
      timeout: 10000,
    });
    return response.data;
  }

  // 운영/비-로컬 환경: 외부 공개 API 직접 호출
  const AI_BASE = process.env.REACT_APP_AI_API_BASE?.replace(/\/+$/, "");
  if (!AI_BASE) throw new Error("AI base URL is not configured (REACT_APP_AI_API_BASE)");
  const directUrl = `${AI_BASE}/api/reco/topics/weekly/list`;
  const res = await fetch(directUrl, {
    credentials: "omit",
    headers: { "Cache-Control": "no-cache" },
  });
  if (!res.ok) {
    throw new Error(`AI 주간 챌린지 목록 조회 실패: ${res.status}`);
  }
  return await res.json() as AiChallengeListResponse;
}

/**
 * AI가 생성한 월간 포트폴리오 챌린지 목록 조회
 * 로컬: /ext 프록시를 통해 https://api.dnutzs.org/api 에 접근
 * 배포: 환경변수의 AI API URL로 직접 호출
 */
export async function fetchAiGeneratedMonthlyChallenges(): Promise<AiChallengeListResponse> {
  const isLocalDev = typeof window !== 'undefined' && /localhost:\d+/.test(window.location.host);

  if (isLocalDev) {
    // 로컬 개발에서는 프록시 사용
    const response = await axios.get('/ext/reco/topics/monthly/list', {
      timeout: 10000,
    });
    return response.data;
  }

  // 운영/비-로컬 환경: 외부 공개 API 직접 호출
  const AI_BASE = process.env.REACT_APP_AI_API_BASE?.replace(/\/+$/, "");
  if (!AI_BASE) throw new Error("AI base URL is not configured (REACT_APP_AI_API_BASE)");
  const directUrl = `${AI_BASE}/api/reco/topics/monthly/list`;
  const res = await fetch(directUrl, {
    credentials: "omit",
    headers: { "Cache-Control": "no-cache" },
  });
  if (!res.ok) {
    throw new Error(`AI 월간 챌린지 목록 조회 실패: ${res.status}`);
  }
  return await res.json() as AiChallengeListResponse;
}