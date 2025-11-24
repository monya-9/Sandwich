// src/api/aiJudgeApi.ts
// ⚠️ DEPRECATED: 이 파일의 함수들은 더 이상 사용되지 않습니다.
// 
// 배경:
// - 프로덕션 환경에서 /ext/* 경로가 nginx 프록시를 타지 않고 백엔드로 직접 라우팅되어 500 에러 발생
// - AI 서버 통신은 이제 모두 백엔드에서만 처리 (/api/challenges/{id}/leaderboard API 사용)
// 
// 마이그레이션:
// - fetchAiLeaderboard(week) → api.get(`/challenges/${challengeId}/leaderboard`, { params: { limit } })
// - 백엔드가 AI 서버 호출 + 유저 정보 매핑을 모두 처리하여 반환
//
// 이 파일은 향후 참고용으로만 유지되며, 실제 코드에서는 사용하지 마세요.

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
  
  // 모든 환경에서 프록시 사용 (CORS 방지)
  // 로컬: /ext -> http://localhost:3000/ext -> setupProxy.js -> https://api.dnutzs.org/api
  // 배포: /ext -> nginx -> https://api.dnutzs.org/api
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
 * GET /api/reco/judge/result/:week/:user
 */
export async function fetchAiUserResult(week: string, userId: string | number): Promise<AiUserResultResponse> {
  const w = normalizeWeek(week);
  const u = String(userId);
  
  // 모든 환경에서 프록시 사용 (CORS 방지)
  const res = await api.get(`/ext/reco/judge/result/${encodeURIComponent(w)}/${encodeURIComponent(u)}` as const, {
    baseURL: "",
    withCredentials: false,
    headers: { "Cache-Control": "no-cache" },
    timeout: 10000,
  });
  return res.data as AiUserResultResponse;
}


