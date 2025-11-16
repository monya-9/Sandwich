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

export type SubmissionPortfolio = {
  language?: string;
  tech?: string[];
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
  portfolio?: SubmissionPortfolio;
  isPublic?: boolean; // 공개 여부 (기본값: true)
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

// 실제 API 응답 타입 (제출물 목록용)
export type SubmissionListItem = {
  id: number;
  ownerId: number;
  title: string;
  repoUrl: string;
  demoUrl?: string;
  desc: string;
  status: string;
  coverUrl?: string;
  assetCount: number;
  viewCount: number;
  likeCount: number;
  commentCount: number;
  createdAt: string;
  owner: SubmissionOwner;
  language: string;
  totalScore: number;
  isPublic?: boolean; // 공개 여부
};

export type SubmissionDetailResponse = {
  id: number; // 백엔드에서는 id 필드가 제출물 ID
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
  portfolio?: SubmissionPortfolio;
  viewCount: number;
  likeCount: number;
  commentCount: number;
  createdAt: string;
  owner: SubmissionOwner;
  language: string;
  totalScore: number;
  entrypoint?: string; // 코드 실행 진입점
  note?: string; // 메모/노트
  isPublic?: boolean; // 공개 여부
};

export type SubmissionListResponse = {
  totalElements: number;
  totalPages: number;
  size: number;
  content: SubmissionListItem[];
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
 * 챌린지 제출물 삭제
 */
export async function deleteChallengeSubmission(
  challengeId: number,
  submissionId: number
): Promise<void> {
  await api.delete(`/challenges/${challengeId}/submissions/${submissionId}`, {
    withCredentials: true,
  });
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
