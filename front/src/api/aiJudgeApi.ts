// src/api/aiJudgeApi.ts
// AI 채점 서버 공개 API 조회 전용 클라이언트
// 프록시: 개발환경에서 /ext -> https://api.dnutzs.org/api 로 전달됨 (setupProxy.js 참조)

import api from "./axiosInstance";

export type AiLeaderboardItem = {
  user: string;    // 내부 user id (문자열)
  rank: number;
  score: number;
};

export type AiLeaderboardResponse = {
  week: string;
  leaderboard: AiLeaderboardItem[];
};

export type AiUserResultResponse = {
  week: string;
  result: Record<string, any> & { user: string };
};

export function normalizeWeek(week: string): string {
  if (!week) return week;
  return week.trim().toUpperCase().replace(/-/g, "");
}

/**
 * 주간 리더보드 조회
 * GET /api/reco/judge/leaderboard/:week
 */
export async function fetchAiLeaderboard(week: string): Promise<AiLeaderboardResponse> {
  const w = normalizeWeek(week);
  const isLocalDev = typeof window !== 'undefined' && /localhost:\d+/.test(window.location.host);

  if (isLocalDev) {
    // 로컬 개발에서는 프록시만 사용 (외부 직접 호출 금지: CORS 방지)
    const res = await api.get(`/ext/reco/judge/leaderboard/${encodeURIComponent(w)}` as const, {
      baseURL: "",
      withCredentials: false,
      headers: { "Cache-Control": "no-cache" },
      timeout: 10000,
    });
    return res.data as AiLeaderboardResponse;
  }

  // 운영/비-로컬 환경: 외부 공개 API 직접 호출 (환경변수 사용)
  const AI_BASE = process.env.REACT_APP_AI_API_BASE?.replace(/\/+$/, "");
  if (!AI_BASE) throw new Error("AI base URL is not configured (REACT_APP_AI_API_BASE)");
  const directUrl = `${AI_BASE}/api/reco/judge/leaderboard/${encodeURIComponent(w)}`;
  const res = await fetch(directUrl, { 
    credentials: "omit",
    headers: { "Cache-Control": "no-cache" },
  });
  if (!res.ok) {
    throw new Error(`리더보드 조회 실패: ${res.status}`);
  }
  return await res.json() as AiLeaderboardResponse;
}

/**
 * 특정 유저 결과 조회
 * GET /api/reco/judge/result/:week/:user
 */
export async function fetchAiUserResult(week: string, userId: string | number): Promise<AiUserResultResponse> {
  const w = normalizeWeek(week);
  const u = String(userId);
  const isLocalDev = typeof window !== 'undefined' && /localhost:\d+/.test(window.location.host);

  if (isLocalDev) {
    // 로컬 개발에서는 프록시만 사용 (외부 직접 호출 금지: CORS 방지)
    const res = await api.get(`/ext/reco/judge/result/${encodeURIComponent(w)}/${encodeURIComponent(u)}` as const, {
      baseURL: "",
      withCredentials: false,
      headers: { "Cache-Control": "no-cache" },
      timeout: 10000,
    });
    return res.data as AiUserResultResponse;
  }

  // 운영/비-로컬 환경: 외부 공개 API 직접 호출 (환경변수 사용)
  const AI_BASE = process.env.REACT_APP_AI_API_BASE?.replace(/\/+$/, "");
  if (!AI_BASE) throw new Error("AI base URL is not configured (REACT_APP_AI_API_BASE)");
  const directUrl = `${AI_BASE}/api/reco/judge/result/${encodeURIComponent(w)}/${encodeURIComponent(u)}`;
  const res = await fetch(directUrl, { 
    credentials: "omit",
    headers: { "Cache-Control": "no-cache" },
  });
  if (!res.ok) {
    throw new Error(`유저 결과 조회 실패: ${res.status}`);
  }
  return await res.json() as AiUserResultResponse;
}


