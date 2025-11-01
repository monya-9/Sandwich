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
  // ✅ public API: URL 패턴으로 이미 처리됨 (헤더 불필요 - 핫 개발자처럼!)
  try {
    const response = await api.get(url, {
      timeout: 20000 // 20초 타임아웃 (서버가 느릴 때도 적절한 대기)
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
    // ✅ public API: URL 패턴으로 이미 처리됨 (헤더 불필요)
    const response = await api.get(`/projects/user/${userId}?page=${page}&size=${size}`);
    return response.data;
  }
};

/**
 * 프로젝트 상세 조회
 */
export const fetchProjectDetail = async (projectId: number): Promise<Project> => {
  // ✅ public API: URL 패턴으로 이미 처리됨 (헤더 불필요)
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
  const BATCH_SIZE = 5; // 한 번에 최대 5개씩 처리 (서버가 느릴 때 더 작은 배치로)
  const results: Record<number, ProjectMetaSummary> = {};
  
  try {
    if (projectIds.length <= BATCH_SIZE) {
      // 작은 경우 한 번에 처리
      const idsParam = projectIds.join(',');
      // ✅ 헤더 제거 (URL 패턴으로 이미 처리됨 - 핫 개발자처럼!)
      const response = await api.get(`/projects/meta/summary?ids=${idsParam}`, {
        timeout: 10000 // 10초 타임아웃
      });
      return response.data || {};
    } else {
      // 많은 경우 배치로 나눠서 처리 (순차적으로 - 동시 요청으로 인한 취소 방지)
      for (let i = 0; i < projectIds.length; i += BATCH_SIZE) {
        const batch = projectIds.slice(i, i + BATCH_SIZE);
        const idsParam = batch.join(',');
        try {
          // ✅ 헤더 제거 (URL 패턴으로 이미 처리됨 - 핫 개발자처럼!)
          const response = await api.get(`/projects/meta/summary?ids=${idsParam}`, {
            timeout: 10000 // 모든 배치에 동일한 타임아웃
          });
          Object.assign(results, response.data || {});
        } catch (batchError: any) {
          // AbortError는 정상 취소이므로 무시 (컴포넌트 언마운트 등)
          if (batchError.name === 'AbortError' || batchError.code === 'ERR_CANCELED' || batchError.code === 'ECONNABORTED') {
            console.log(`[fetchProjectsMeta] 배치 ${i / BATCH_SIZE + 1} 취소됨 (정상)`);
            break; // 취소된 경우 전체 중단
          }
          // 배치 실패해도 다음 배치는 계속 시도
          console.warn(`[fetchProjectsMeta] 배치 ${i / BATCH_SIZE + 1} 실패:`, batchError);
        }
      }
      return results;
    }
  } catch (error: any) {
    // AbortError는 정상 취소이므로 무시
    if (error.name === 'AbortError' || error.code === 'ERR_CANCELED' || error.code === 'ECONNABORTED') {
      console.log('[fetchProjectsMeta] 요청 취소됨 (정상)');
      return {};
    }
    console.error('[fetchProjectsMeta] 전체 실패:', error);
    return {};
  }
};
