import { useState, useEffect, useCallback, useContext } from 'react';
import { 
  getRecentSearches, 
  saveRecentSearch, 
  deleteRecentSearch, 
  clearAllRecentSearches,
  RecentSearchItem 
} from '../api/recentSearch';
import { AuthContext } from '../context/AuthContext';

interface UseRecentSearchesReturn {
  recentSearches: RecentSearchItem[];
  isLoading: boolean;
  error: string | null;
  loadRecentSearches: () => Promise<void>;
  saveSearch: (term: string, type: 'PORTFOLIO' | 'ACCOUNT') => Promise<void>;
  deleteSearch: (id: number) => Promise<void>;
  clearAllSearches: (type?: 'PORTFOLIO' | 'ACCOUNT') => Promise<void>;
  refreshSearches: () => Promise<void>;
}

export const useRecentSearches = (): UseRecentSearchesReturn => {
  const [recentSearches, setRecentSearches] = useState<RecentSearchItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastLoadTime, setLastLoadTime] = useState<number>(0);
  
  // ✅ 로그인 상태 확인
  const { isLoggedIn } = useContext(AuthContext);

  // 최근 검색어 로드 (캐시 적용)
  const loadRecentSearches = useCallback(async (forceRefresh = false) => {
    // ✅ 로그인하지 않은 사용자는 API 호출하지 않음
    if (!isLoggedIn) {
      setRecentSearches([]);
      setIsLoading(false);
      return;
    }
    
    const now = Date.now();
    const CACHE_DURATION = 30000; // 30초 캐시

    // 캐시가 유효하고 강제 새로고침이 아닌 경우 스킵
    if (!forceRefresh && now - lastLoadTime < CACHE_DURATION && recentSearches.length > 0) {
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const searches = await getRecentSearches();
      setRecentSearches(searches);
      setLastLoadTime(now);
    } catch (err) {
      console.error('최근 검색어 로드 실패:', err);
      setError(err instanceof Error ? err.message : '최근 검색어를 불러오는데 실패했습니다.');
      setRecentSearches([]);
    } finally {
      setIsLoading(false);
    }
  }, [isLoggedIn, recentSearches.length, lastLoadTime]);

  // 검색어 저장
  const saveSearch = useCallback(async (term: string, type: 'PORTFOLIO' | 'ACCOUNT') => {
    if (!term.trim()) return;
    
    // ✅ 로그인하지 않은 사용자는 저장하지 않음
    if (!isLoggedIn) return;

    try {
      await saveRecentSearch(term, type);
      // 저장 후 즉시 새로고침
      await loadRecentSearches(true);
    } catch (err) {
      console.error('최근 검색어 저장 실패:', err);
      setError(err instanceof Error ? err.message : '최근 검색어 저장에 실패했습니다.');
    }
  }, [isLoggedIn, loadRecentSearches]);

  // 검색어 삭제 (낙관적 업데이트)
  const deleteSearch = useCallback(async (id: number) => {
    // ✅ 로그인하지 않은 사용자는 삭제하지 않음
    if (!isLoggedIn) return;
    
    // 낙관적 업데이트: UI에서 먼저 제거
    setRecentSearches(prev => prev.filter(item => item.id !== id));

    try {
      await deleteRecentSearch(id);
    } catch (err) {
      console.error('최근 검색어 삭제 실패:', err);
      // 실패 시 원래 상태로 복원
      await loadRecentSearches(true);
      setError(err instanceof Error ? err.message : '최근 검색어 삭제에 실패했습니다.');
    }
  }, [isLoggedIn, loadRecentSearches]);

  // 전체 삭제 (낙관적 업데이트)
  const clearAllSearches = useCallback(async (type: 'PORTFOLIO' | 'ACCOUNT' = 'PORTFOLIO') => {
    // ✅ 로그인하지 않은 사용자는 삭제하지 않음
    if (!isLoggedIn) return;
    
    // 낙관적 업데이트: UI에서 먼저 제거
    setRecentSearches([]);

    try {
      await clearAllRecentSearches(type);
    } catch (err) {
      console.error('전체 최근 검색어 삭제 실패:', err);
      // 실패 시 원래 상태로 복원
      await loadRecentSearches(true);
      setError(err instanceof Error ? err.message : '전체 최근 검색어 삭제에 실패했습니다.');
    }
  }, [isLoggedIn, loadRecentSearches]);

  // 새로고침 (강제 로드)
  const refreshSearches = useCallback(async () => {
    await loadRecentSearches(true);
  }, [loadRecentSearches]);

  // 컴포넌트 마운트 시 로드
  useEffect(() => {
    loadRecentSearches();
  }, [loadRecentSearches]);

  return {
    recentSearches,
    isLoading,
    error,
    loadRecentSearches,
    saveSearch,
    deleteSearch,
    clearAllSearches,
    refreshSearches
  };
};
