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
  authorId?: number; // 선택적: 특정 작성자
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
    size = 20, // ✅ 사이즈를 20으로 변경
    q,
    followingOnly,
    uploadedWithin,
    sort = 'latest',
    authorId,
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

  if (authorId) {
    searchParams.append('authorId', String(authorId));
  }

  const url = `/projects?${searchParams.toString()}`;
  // ✅ public API: 401 에러 시 자동 리프레시/로그아웃 방지
  try {
    const response = await api.get(url, {
      headers: { 'X-Skip-Auth-Refresh': '1' }
    });
    return response.data;
  } catch (error: any) {
    console.error('[fetchProjectFeed] API 호출 실패:', {
      url,
      status: error.response?.status,
      message: error.message,
      data: error.response?.data
    });
    throw error;
  }
};

/** 사용자별 프로젝트 목록 (우선 /projects?authorId=, 실패 시 /projects/user/) */
export const fetchUserProjects = async (userId: number, page = 0, size = 20): Promise<ProjectFeedResponse> => {
  try {
    return await fetchProjectFeed({ authorId: userId, page, size, sort: 'latest' });
  } catch {
    // ✅ public API: 401 에러 시 자동 리프레시/로그아웃 방지
    const response = await api.get(`/projects/user/${userId}?page=${page}&size=${size}`, {
      headers: { 'X-Skip-Auth-Refresh': '1' }
    });
    return response.data;
  }
};

/**
 * 프로젝트 상세 조회
 */
export const fetchProjectDetail = async (projectId: number): Promise<Project> => {
  // ✅ public API: 401 에러 시 자동 리프레시/로그아웃 방지
  const response = await api.get(`/projects/${projectId}`, {
    headers: { 'X-Skip-Auth-Refresh': '1' }
  });
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

/**
 * 프로젝트 메타 정보 조회 (좋아요, 댓글, 조회수)
 */
export interface ProjectMetaSummary {
  views: number;
  likes: number;
  comments: number;
}

export const fetchProjectsMeta = async (projectIds: number[]): Promise<Record<number, ProjectMetaSummary>> => {
  if (projectIds.length === 0) return {};
  
  // ✅ 배치 처리: ID가 많으면 여러 번 나눠서 요청 (504 타임아웃 방지)
  const BATCH_SIZE = 10; // 한 번에 최대 10개씩 처리
  const results: Record<number, ProjectMetaSummary> = {};
  
  try {
    if (projectIds.length <= BATCH_SIZE) {
      // 작은 경우 한 번에 처리
      const idsParam = projectIds.join(',');
      const response = await api.get(`/projects/meta/summary?ids=${idsParam}`, {
        headers: { 'X-Skip-Auth-Refresh': '1' },
        timeout: 15000 // 15초 타임아웃
      });
      return response.data || {};
    } else {
      // 많은 경우 배치로 나눠서 처리
      for (let i = 0; i < projectIds.length; i += BATCH_SIZE) {
        const batch = projectIds.slice(i, i + BATCH_SIZE);
        const idsParam = batch.join(',');
        try {
          const response = await api.get(`/projects/meta/summary?ids=${idsParam}`, {
            headers: { 'X-Skip-Auth-Refresh': '1' },
            timeout: 15000 // 15초 타임아웃
          });
          Object.assign(results, response.data || {});
        } catch (batchError) {
          // 배치 실패해도 다음 배치는 계속 시도
          console.warn(`[fetchProjectsMeta] 배치 ${i / BATCH_SIZE + 1} 실패:`, batchError);
        }
      }
      return results;
    }
  } catch (error) {
    console.error('[fetchProjectsMeta] 전체 실패:', error);
    return {};
  }
};
