// 계정 검색 API
import api from './axiosInstance';

// 프로젝트 정보 타입
export interface ProjectInfo {
  id: number;
  title: string;
  description: string;
  thumbnailUrl: string | null;
}

// 계정 검색 결과 타입 (백엔드 AccountSearchItem에 맞춤)
export interface AccountSearchResult {
  id: number;
  nickname: string;
  email?: string;  // 추가: 이메일 필드
  avatarUrl: string | null;
  isVerified: boolean;
  position?: string;  // 추가: 포지션 필드
  projects?: ProjectInfo[];  // 추가: 프로젝트 정보
}

// 계정 검색 응답 타입
export interface AccountSearchResponse {
  content: AccountSearchResult[];
  pageable: {
    pageNumber: number;
    pageSize: number;
  };
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
  
  const searchParams = new URLSearchParams({
    q,
    page: page.toString(),
    size: size.toString()
  });
  
  if (followingOnly) {
    searchParams.append('followingOnly', 'true');
  }
  
  // 직접 fetch 사용 (인증 문제 우회)
  const response = await fetch(`/api/search/accounts?${searchParams.toString()}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  });
  
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }
  
  const data = await response.json();
  
  // 백엔드 응답 형식에 맞춰 변환
  return {
    content: data.content || [],
    pageable: {
      pageNumber: data.page || 0,
      pageSize: data.size || 20
    },
    totalElements: data.totalElements || 0,
    totalPages: data.totalPages || 0,
    last: data.last || true
  };
};

// 계정 검색 결과 하이라이트 함수
export const highlightSearchTerm = (text: string, searchTerm: string): string => {
  if (!searchTerm.trim()) return text;
  
  const regex = new RegExp(`(${searchTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
  return text.replace(regex, '<mark class="bg-yellow-200 px-1 rounded">$1</mark>');
};

