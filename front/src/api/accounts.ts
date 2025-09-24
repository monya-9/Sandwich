// 계정 검색 API
import api from './axiosInstance';

// 프로젝트 정보 타입 (실제 프로젝트 데이터)
export interface ProjectInfo {
  id: number;
  title?: string;
  coverUrl?: string;
  thumbnailUrl?: string;
}

// 포지션 정보 타입 (기존 userApi에서 가져옴)
export interface PositionDto {
  id: number;
  name: string;
}

// 계정 검색 결과 타입 (백엔드 실제 응답에 맞춤)
export interface AccountSearchResult {
  id: number;
  nickname: string;
  email: string;
  avatarUrl: string | null;
  isVerified: boolean;
  position?: string;  // 선택적: 백엔드에서 제공하지 않을 수 있음
  projects?: ProjectInfo[];  // 선택적: 백엔드에서 제공하지 않을 수 있음
}

// 계정 검색 응답 타입 (백엔드 실제 응답에 맞춤)
export interface AccountSearchResponse {
  content: AccountSearchResult[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
  last: boolean;
}

// 계정 검색 파라미터
export interface AccountSearchParams {
  q: string;
  page?: number;
  size?: number;
  followingOnly?: boolean; // 팔로우 회원만
}

// 계정 검색 API 호출
export const searchAccounts = async (params: AccountSearchParams): Promise<AccountSearchResponse> => {
  const { q, page = 0, size = 20, followingOnly } = params;
  
  const searchParams = new URLSearchParams();
  
  // 검색어를 먼저 추가 (Postman과 동일한 순서)
  if (q && q.trim()) {
    searchParams.append('q', q.trim());
  }
  
  // 페이지 정보 추가
  searchParams.append('page', page.toString());
  searchParams.append('size', size.toString());
  
  if (followingOnly) {
    searchParams.append('followingOnly', 'true');
  }
  
  try {
    const url = `/search/accounts?${searchParams.toString()}`;
    const response = await api.get<AccountSearchResponse>(url);
    return response.data;
  } catch (error: any) {
    console.error('계정 검색 API 호출 실패:', error);
    throw error;
  }
};

/**
 * 프로젝트 상세 정보 조회
 */
export const fetchProjectDetail = async (projectId: number): Promise<ProjectInfo> => {
  try {
    const response = await api.get(`/projects/${projectId}`);
    return {
      id: response.data.id,
      title: response.data.title,
      coverUrl: response.data.coverUrl,
      thumbnailUrl: response.data.coverUrl // coverUrl을 thumbnailUrl로 사용
    };
  } catch (error: any) {
    console.error(`프로젝트 ${projectId} 조회 실패:`, error);
    return { id: projectId };
  }
};

/**
 * 여러 프로젝트 정보를 한번에 조회
 */
export const fetchProjectsDetails = async (projectIds: number[]): Promise<ProjectInfo[]> => {
  const promises = projectIds.map(id => fetchProjectDetail(id));
  return Promise.all(promises);
};

// 계정 검색 결과 하이라이트 함수
export const highlightSearchTerm = (text: string, searchTerm: string): string => {
  if (!searchTerm.trim()) return text;
  
  const regex = new RegExp(`(${searchTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
  return text.replace(regex, '<mark class="bg-yellow-200 px-1 rounded">$1</mark>');
};

