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
 * GET /api/reco/judge/leaderboard/:week (프론트에선 /ext 경유)
 */
export async function fetchAiLeaderboard(week: string): Promise<AiLeaderboardResponse> {
  const w = normalizeWeek(week);
  const res = await api.get(`/ext/reco/judge/leaderboard/${encodeURIComponent(w)}` as const, {
    baseURL: "",
    withCredentials: false,
    headers: { "Cache-Control": "no-cache" },
    timeout: 10000,
  });
  return res.data as AiLeaderboardResponse;
}

/**
 * 특정 유저 결과 조회
 * GET /api/reco/judge/result/:week/:user (프론트에선 /ext 경유)
 */
export async function fetchAiUserResult(week: string, userId: string | number): Promise<AiUserResultResponse> {
  const w = normalizeWeek(week);
  const u = String(userId);
  const res = await api.get(`/ext/reco/judge/result/${encodeURIComponent(w)}/${encodeURIComponent(u)}` as const, {
    baseURL: "",
    withCredentials: false,
    headers: { "Cache-Control": "no-cache" },
    timeout: 10000,
  });
  return res.data as AiUserResultResponse;
}


