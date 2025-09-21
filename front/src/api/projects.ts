// 프로젝트 피드 API 호출 함수
import api from './axiosInstance';
import { Project } from '../types/Project';

// Project 타입을 다시 export (다른 컴포넌트에서 사용하기 위해)
export type { Project };

// 프로젝트 피드 요청 파라미터
export interface ProjectFeedParams {
  page?: number;
  size?: number;
  q?: string; // 검색어
  followingOnly?: boolean; // 팔로우 회원만
  uploadedWithin?: '24h' | '7d' | '1m' | '3m'; // 업로드 기간
  sort?: 'latest' | 'popular' | 'recommended'; // 정렬 방식
}

// 프로젝트 피드 응답
export interface ProjectFeedResponse {
  content: Project[];
  page?: number;
  size?: number;
  totalElements: number;
  totalPages: number;
  last: boolean;
  first?: boolean;
}

/**
 * 프로젝트 피드 조회
 */
export const fetchProjectFeed = async (params: ProjectFeedParams = {}): Promise<ProjectFeedResponse> => {
  const searchParams = new URLSearchParams();
  
  // 기본값 설정
  const {
    page = 0,
    size = 20,
    q,
    followingOnly,
    uploadedWithin,
    sort = 'latest'
  } = params;

  // 파라미터 추가
  searchParams.append('page', page.toString());
  searchParams.append('size', size.toString());
  
  if (q) {
    searchParams.append('q', q);
  }
  
  if (followingOnly) {
    searchParams.append('followingOnly', 'true');
  }
  
  if (uploadedWithin) {
    searchParams.append('uploadedWithin', uploadedWithin);
  }
  
  if (sort) {
    searchParams.append('sort', sort);
  }

  const url = `/projects?${searchParams.toString()}`;
  console.log('API 호출:', url); // 디버깅용 로그
  const response = await api.get(url);
  console.log('API 응답:', response.data); // 디버깅용 로그
  return response.data;
};

/**
 * 프로젝트 상세 조회
 */
export const fetchProjectDetail = async (projectId: number): Promise<Project> => {
  const response = await api.get(`/projects/${projectId}`);
  return response.data;
};

/**
 * 프로젝트 좋아요 토글
 */
export const toggleProjectLike = async (projectId: number): Promise<{ liked: boolean; likes: number }> => {
  const response = await api.post(`/projects/${projectId}/like`);
  return response.data;
};

/**
 * 프로젝트 조회수 증가
 */
export const incrementProjectViews = async (projectId: number): Promise<void> => {
  await api.post(`/projects/${projectId}/view`);
};

/**
 * 프로젝트 검색 (debounce용)
 */
export const searchProjects = async (query: string, params: Omit<ProjectFeedParams, 'q'> = {}): Promise<ProjectFeedResponse> => {
  return fetchProjectFeed({ ...params, q: query });
};
