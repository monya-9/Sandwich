import api from './axiosInstance';

// 최근 검색어 아이템 타입
export interface RecentSearchItem {
  id: number;
  keyword: string;
  type: 'PORTFOLIO' | 'ACCOUNT';
  updatedAt: string;
}

// 최근 검색어 저장 요청 타입
export interface SaveRecentSearchRequest {
  keyword: string;
  type: 'PORTFOLIO' | 'ACCOUNT';
}

// 최근 검색어 조회 응답 타입
export interface RecentSearchResponse {
  content: RecentSearchItem[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
}

/**
 * 최근 검색어 목록 조회
 * @param limit 조회할 개수 (기본값: 10)
 * @param type 검색 타입 (PORTFOLIO | ACCOUNT)
 */
export const getRecentSearches = async (
  limit: number = 10,
  type?: 'PORTFOLIO' | 'ACCOUNT'
): Promise<RecentSearchItem[]> => {
  try {
    const params = new URLSearchParams();
    params.append('limit', limit.toString());
    if (type) {
      params.append('type', type);
    }

    const response = await api.get<RecentSearchResponse>(
      `/search/recent?${params.toString()}`
    );
    
    return response.data.content || [];
  } catch (error: any) {
    console.error('최근 검색어 조회 실패:', error);
    // 401 에러인 경우 빈 배열 반환 (로그인하지 않은 사용자)
    if (error.response?.status === 401) {
      console.log('로그인하지 않은 사용자 - 빈 배열 반환');
      return [];
    }
    throw error;
  }
};

/**
 * 최근 검색어 저장
 * @param keyword 검색 키워드
 * @param type 검색 타입
 */
export const saveRecentSearch = async (
  keyword: string,
  type: 'PORTFOLIO' | 'ACCOUNT'
): Promise<RecentSearchItem> => {
  try {
    const response = await api.post<RecentSearchItem>(
      '/search/recent',
      {
        keyword,
        type
      }
    );
    
    return response.data;
  } catch (error: any) {
    console.error('최근 검색어 저장 실패:', error);
    // 401 에러인 경우 조용히 실패 (로그인하지 않은 사용자)
    if (error.response?.status === 401) {
      console.log('로그인하지 않은 사용자 - 저장 건너뛰기');
      throw new Error('로그인이 필요합니다');
    }
    throw error;
  }
};

/**
 * 특정 최근 검색어 삭제
 * @param id 삭제할 검색어 ID
 */
export const deleteRecentSearch = async (id: number): Promise<void> => {
  try {
    await api.delete(`/search/recent/${id}`);
  } catch (error: any) {
    console.error('최근 검색어 삭제 실패:', error);
    throw error;
  }
};

/**
 * 특정 타입의 모든 최근 검색어 삭제
 * @param type 삭제할 검색 타입
 */
export const clearAllRecentSearches = async (
  type: 'PORTFOLIO' | 'ACCOUNT'
): Promise<void> => {
  try {
    // 모든 검색어를 가져옴
    const allSearches = await getRecentSearches(50);
    
    // 각 검색어를 개별적으로 삭제
    const deletePromises = allSearches.map(searchItem => 
      deleteRecentSearch(searchItem.id)
    );
    
    await Promise.all(deletePromises);
  } catch (error: any) {
    console.error('전체 최근 검색어 삭제 실패:', error);
    throw error;
  }
};