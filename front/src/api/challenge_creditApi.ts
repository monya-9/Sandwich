// src/api/challenge_creditApi.ts
// 챌린지 크레딧/보상 관련 API

import api from './axiosInstance';

// ===== 크레딧 관련 타입 정의 =====

export type CreditTransaction = {
  id: number;
  type: 'EARNED' | 'SPENT' | 'REFUND';
  amount: number;
  description: string;
  createdAt: string;
  challengeId?: number;
  challengeTitle?: string;
};

export type CreditBalance = {
  balance: number;
  txns: CreditTransaction[];
};

export type RewardItem = {
  id: number;
  challengeId: number;
  challengeTitle: string;
  rank?: number;
  amount: number;
  status: 'PENDING' | 'CLAIMED' | 'EXPIRED';
  createdAt: string;
  claimedAt?: string;
};

export type RewardResponse = {
  rewards: RewardItem[];
  totalAmount: number;
};

export type ClaimRewardResponse = {
  success: boolean;
  message: string;
  creditAmount?: number;
};

// ===== 크레딧 API 함수들 =====

/**
 * 내 크레딧 잔액 및 거래 내역 조회
 * GET /api/me/credits
 */
export async function fetchMyCredits(): Promise<CreditBalance> {
  try {
    const response = await api.get('/me/credits', {
      withCredentials: true,
    });
    return response.data;
  } catch (error) {
    // API가 아직 구현되지 않은 경우 더미 데이터 반환
    console.warn('크레딧 API 호출 실패, 더미 데이터 사용:', error);
    return {
      balance: 15000,
      txns: [
        {
          id: 1,
          type: 'EARNED',
          amount: 10000,
          description: '포트폴리오 챌린지 1등 보상',
          createdAt: '2025-01-15T10:30:00Z',
          challengeId: 1,
          challengeTitle: '학습 퀴즈 루틴'
        },
        {
          id: 2,
          type: 'EARNED',
          amount: 500,
          description: '코드 챌린지 참가 보상',
          createdAt: '2025-01-10T15:20:00Z',
          challengeId: 2,
          challengeTitle: '구간 곱 모듈러 변형'
        },
        {
          id: 3,
          type: 'EARNED',
          amount: 5000,
          description: '포트폴리오 챌린지 2등 보상',
          createdAt: '2025-01-05T09:15:00Z',
          challengeId: 3,
          challengeTitle: '9월 포트폴리오'
        }
      ]
    };
  }
}

/**
 * 내 보상 내역 조회
 * GET /api/me/rewards
 */
export async function fetchMyRewards(): Promise<RewardResponse> {
  try {
    const response = await api.get('/me/rewards', {
      withCredentials: true,
    });
    return response.data;
  } catch (error) {
    // API가 아직 구현되지 않은 경우 더미 데이터 반환
    console.warn('보상 API 호출 실패, 더미 데이터 사용:', error);
    return {
      rewards: [
        {
          id: 1,
          challengeId: 1,
          challengeTitle: '학습 퀴즈 루틴',
          rank: 1,
          amount: 10000,
          status: 'CLAIMED',
          createdAt: '2025-01-15T10:30:00Z',
          claimedAt: '2025-01-15T10:35:00Z'
        },
        {
          id: 2,
          challengeId: 2,
          challengeTitle: '구간 곱 모듈러 변형',
          rank: undefined,
          amount: 500,
          status: 'CLAIMED',
          createdAt: '2025-01-10T15:20:00Z',
          claimedAt: '2025-01-10T15:25:00Z'
        },
        {
          id: 3,
          challengeId: 3,
          challengeTitle: '9월 포트폴리오',
          rank: 2,
          amount: 5000,
          status: 'CLAIMED',
          createdAt: '2025-01-05T09:15:00Z',
          claimedAt: '2025-01-05T09:20:00Z'
        },
        {
          id: 4,
          challengeId: 4,
          challengeTitle: '11월 포트폴리오 A',
          rank: 3,
          amount: 3000,
          status: 'PENDING',
          createdAt: '2025-01-20T14:00:00Z'
        }
      ],
      totalAmount: 18500
    };
  }
}

/**
 * 보상 수령
 * POST /api/me/rewards/{rewardId}/claim
 */
export async function claimReward(rewardId: number): Promise<ClaimRewardResponse> {
  try {
    const response = await api.post(`/me/rewards/${rewardId}/claim`, {}, {
      withCredentials: true,
    });
    return response.data;
  } catch (error) {
    // API가 아직 구현되지 않은 경우 더미 응답 반환
    console.warn('보상 수령 API 호출 실패, 더미 응답 사용:', error);
    return {
      success: true,
      message: '보상을 성공적으로 수령했습니다.',
      creditAmount: 3000
    };
  }
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
  try {
    const response = await api.post(`/admin/rewards/challenges/${challengeId}/publish-results`, {}, {
      withCredentials: true,
    });
    return response.data;
  } catch (error) {
    // API가 아직 구현되지 않은 경우 더미 응답 반환
    console.warn('챌린지 결과 발표 API 호출 실패, 더미 응답 사용:', error);
    return {
      success: true,
      message: '챌린지 결과가 발표되었습니다.',
      inserted: 4,
      rewards: [
        { userId: 12, rank: 1, amount: 10000 },
        { userId: 13, rank: 2, amount: 5000 },
        { userId: 11, rank: 3, amount: 3000 },
        { userId: 14, rank: undefined, amount: 500 }
      ]
    };
  }
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
