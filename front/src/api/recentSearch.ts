// 최근 검색어 API
import api from './axiosInstance';

export interface RecentSearchItem {
  id: number;
  keyword: string;        // 스웨거 응답과 일치
  type: string;          // PORTFOLIO 또는 ACCOUNT
  updatedAt: string;     // 스웨거 응답과 일치
}

export interface RecentSearchResponse {
  content: RecentSearchItem[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
  last: boolean;
}

export interface SaveRecentSearchRequest {
  keyword: string;       // 스웨거 요청과 일치
  type: string;         // PORTFOLIO 또는 ACCOUNT
}

/**
 * 최근 검색어 조회
 */
export const getRecentSearches = async (): Promise<RecentSearchItem[]> => {
  try {
    console.log('최근 검색어 API 호출 시작...');
    const response = await api.get<RecentSearchResponse>('/api/search/recent');
    console.log('최근 검색어 API 응답:', response.data);
    return response.data.content || [];
  } catch (error: any) {
    console.error('최근 검색어 조회 실패:', error);
    console.error('에러 상태:', error?.response?.status);
    console.error('에러 메시지:', error?.response?.data);
    return [];
  }
};

/**
 * 최근 검색어 저장
 */
export const saveRecentSearch = async (keyword: string, type: string = 'PORTFOLIO'): Promise<void> => {
  try {
    console.log('최근 검색어 저장 API 호출:', { keyword, type });
    const response = await api.post('/api/search/recent', { keyword, type });
    console.log('최근 검색어 저장 응답:', response.data);
  } catch (error: any) {
    console.error('최근 검색어 저장 실패:', error);
    console.error('에러 상태:', error?.response?.status);
    console.error('에러 메시지:', error?.response?.data);
  }
};

/**
 * 특정 최근 검색어 삭제
 */
export const deleteRecentSearch = async (id: number): Promise<void> => {
  try {
    await api.delete(`/api/search/recent/${id}`);
  } catch (error: any) {
    // 401 Unauthorized (인증 실패)는 조용히 처리
    if (error?.response?.status === 401) {
      console.log('로그인이 필요합니다. 최근 검색어를 삭제할 수 없습니다.');
      return;
    }
    // 다른 에러는 로그 출력
    console.error('최근 검색어 삭제 실패:', error);
  }
};

/**
 * 모든 최근 검색어 삭제
 */
export const clearAllRecentSearches = async (): Promise<void> => {
  try {
    await api.delete('/api/search/recent');
  } catch (error: any) {
    // 401 Unauthorized (인증 실패)는 조용히 처리
    if (error?.response?.status === 401) {
      console.log('로그인이 필요합니다. 최근 검색어를 삭제할 수 없습니다.');
      return;
    }
    // 다른 에러는 로그 출력
    console.error('모든 최근 검색어 삭제 실패:', error);
  }
};
