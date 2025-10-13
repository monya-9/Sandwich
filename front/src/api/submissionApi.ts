// src/api/submissionApi.ts
// 챌린지 제출물 관련 API

import api from './axiosInstance';

// ===== 챌린지 제출물 관련 타입 정의 =====

export type SubmissionAsset = {
  url: string;
  mime: string;
};

export type SubmissionCode = {
  language: string;
  entrypoint: string;
  commitSha: string;
};

export type SubmissionOwner = {
  userId: number;
  username: string;
  profileImageUrl: string;
  position: string;
};

export type SubmissionCreateRequest = {
  title: string;
  desc: string;
  repoUrl: string;
  demoUrl?: string;
  coverUrl?: string;
  participationType: "SOLO" | "TEAM";
  teamName?: string;
  membersText?: string;
  assets?: SubmissionAsset[];
  code?: SubmissionCode;
};

export type SubmissionResponse = {
  submissionId: number;
  voteCount: number;
  uiUxAvg: number;
  creativityAvg: number;
  codeQualityAvg: number;
  difficultyAvg: number;
  totalScore: number;
  rank: number;
};

export type SubmissionDetailResponse = {
  submissionId: number;
  title: string;
  desc: string;
  repoUrl: string;
  demoUrl?: string;
  coverUrl?: string;
  participationType: "SOLO" | "TEAM";
  teamName?: string;
  membersText?: string;
  assets?: SubmissionAsset[];
  code?: SubmissionCode;
  viewCount: number;
  likeCount: number;
  commentCount: number;
  createdAt: string;
  owner: SubmissionOwner;
  language: string;
  totalScore: number;
  entrypoint?: string; // 코드 실행 진입점
  note?: string; // 메모/노트
};

export type SubmissionListResponse = {
  totalElements: number;
  totalPages: number;
  size: number;
  content: SubmissionResponse[];
  number: number;
  sort: Array<{
    direction: string;
    nullHandling: string;
    ascending: boolean;
    property: string;
    ignoreCase: boolean;
  }>;
  pageable: {
    offset: number;
    sort: Array<{
      direction: string;
      nullHandling: string;
      ascending: boolean;
      property: string;
      ignoreCase: boolean;
    }>;
    paged: boolean;
    pageNumber: number;
    pageSize: number;
    unpaged: boolean;
  };
  numberOfElements: number;
  first: boolean;
  last: boolean;
  empty: boolean;
};

// ===== 챌린지 제출물 API 함수들 =====

/**
 * 챌린지 제출물 목록 조회
 */
export async function fetchChallengeSubmissions(
  challengeId: number,
  page: number = 0,
  size: number = 10,
  sort: string = "id,desc"
): Promise<SubmissionListResponse> {
  const response = await api.get(`/challenges/${challengeId}/submissions`, {
    params: { page, size, sort },
    withCredentials: true,
  });
  return response.data;
}

/**
 * 챌린지 제출물 생성
 */
export async function createChallengeSubmission(
  challengeId: number,
  submissionData: SubmissionCreateRequest
): Promise<SubmissionDetailResponse> {
  const response = await api.post(`/challenges/${challengeId}/submissions`, submissionData, {
    withCredentials: true,
  });
  return response.data;
}

/**
 * 챌린지 제출물 상세 조회
 */
export async function fetchChallengeSubmissionDetail(
  challengeId: number,
  submissionId: number
): Promise<SubmissionDetailResponse> {
  const response = await api.get(`/challenges/${challengeId}/submissions/${submissionId}`, {
    withCredentials: true,
  });
  return response.data;
}

/**
 * 챌린지 제출물 수정
 */
export async function updateChallengeSubmission(
  challengeId: number,
  submissionId: number,
  submissionData: Partial<SubmissionCreateRequest>
): Promise<SubmissionDetailResponse> {
  const response = await api.put(`/challenges/${challengeId}/submissions/${submissionId}`, submissionData, {
    withCredentials: true,
  });
  return response.data;
}

/**
 * 코드 챌린지 제출물 목록 조회 (별칭)
 */
export async function fetchCodeSubmissions(
  challengeId: number,
  page: number = 0,
  size: number = 10,
  sort: string = "id,desc"
): Promise<SubmissionListResponse> {
  return fetchChallengeSubmissions(challengeId, page, size, sort);
}

/**
 * 포트폴리오 챌린지 제출물 목록 조회 (별칭)
 */
export async function fetchPortfolioSubmissions(
  challengeId: number,
  page: number = 0,
  size: number = 10,
  sort: string = "id,desc"
): Promise<SubmissionListResponse> {
  return fetchChallengeSubmissions(challengeId, page, size, sort);
}
