// src/api/challenge_creditApi.ts
// 챌린지 크레딧/보상 관련 API

import api from './axiosInstance';

// ===== 크레딧 관련 타입 정의 =====

export type CreditTransaction = {
  amount: number;
  reason: string;
  ref_id: number;
  created_at: string;
};

export type CreditBalance = {
  balance: number;
  txns: CreditTransaction[];
};

export type RewardItem = {
  challenge_id: number;
  challenge_title: string;
  amount: number;
  rank?: number;
  created_at: string;
};

export type RewardResponse = RewardItem[];


// ===== 크레딧 API 함수들 =====

/**
 * 내 크레딧 잔액 및 거래 내역 조회
 * GET /api/me/credits
 */
export async function fetchMyCredits(): Promise<CreditBalance> {
  const response = await api.get('/me/credits');
  return response.data;
}

/**
 * 내 보상 내역 조회
 * GET /api/me/rewards
 */
export async function fetchMyRewards(): Promise<RewardResponse> {
  const response = await api.get('/me/rewards');
  return response.data;
}


/**
 * 챌린지 결과 발표 및 보상 지급 (관리자용)
 * POST /admin/rewards/challenges/{challengeId}/publish-results
 */
export async function publishChallengeResults(challengeId: number): Promise<{
  success: boolean;
  message: string;
  inserted: number;
  rewards: Array<{
    userId: number;
    rank?: number;
    amount: number;
  }>;
}> {
  const response = await api.post(`/admin/rewards/challenges/${challengeId}/publish-results`);
  return response.data;
}

/**
 * 커스텀 보상 지급 (관리자용)
 * POST /admin/rewards/{challengeId}/custom-payout
 */
export async function adminCustomPayout(
  challengeId: number,
  payload: { userId: number; amount: number; rank?: number; memo?: string; reason?: string },
  idempotencyKey?: string
): Promise<{ ok: boolean; updated: number }> {
  const headers: any = {};
  if (idempotencyKey && idempotencyKey.trim()) {
    headers["Idempotency-Key"] = idempotencyKey.trim();
  }
  const res = await api.post(`/admin/rewards/${challengeId}/custom-payout`, payload, {
    withCredentials: true,
    // 관리자 엔드포인트는 서버 루트에 매핑되어 있으므로 기본 '/api' prefix를 비활성화
    baseURL: '',
    headers,
  });
  return res.data;
}

/**
 * 커스텀 보상 지급 (관리자용)
 * POST /admin/rewards/{challengeId}/custom-payout
 */
export async function adminCustomPayout(
  challengeId: number,
  payload: { userId: number; amount: number; rank?: number; memo?: string; reason?: string },
  idempotencyKey?: string
): Promise<{ ok: boolean; updated: number }> {
  const headers: any = {};
  if (idempotencyKey && idempotencyKey.trim()) {
    headers["Idempotency-Key"] = idempotencyKey.trim();
  }
  const res = await api.post(`/admin/rewards/${challengeId}/custom-payout`, payload, {
    withCredentials: true,
    // 관리자 엔드포인트는 서버 루트에 매핑되어 있으므로 기본 '/api' prefix를 비활성화
    baseURL: '',
    headers,
  });
  return res.data;
}
