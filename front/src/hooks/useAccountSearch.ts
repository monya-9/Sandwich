import { useState, useEffect, useCallback } from 'react';
import { searchAccounts, AccountSearchResult, AccountSearchParams } from '../api/accounts';

export const useAccountSearch = () => {
  const [accounts, setAccounts] = useState<AccountSearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  const performSearch = useCallback(async (params: AccountSearchParams) => {
    setLoading(true);
    setError(null);

    try {
      const response = await searchAccounts(params);
      
      setAccounts(response.content);
      setTotalElements(response.totalElements);
      setTotalPages(response.totalPages);
      setCurrentPage(response.page);
    } catch (error: any) {
      console.error('계정 검색 실패:', error);
      setError(error.message || '계정 검색에 실패했습니다.');
      setAccounts([]);
      setTotalElements(0);
      setTotalPages(0);
      setCurrentPage(0);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleSearch = useCallback((term: string) => {
    setSearchTerm(term);
    setCurrentPage(0);
    performSearch({ q: term, page: 0, size: 20 }); // ✅ 사이즈를 20으로 변경
  }, [performSearch]);

  const handlePageChange = useCallback((page: number) => {
    setCurrentPage(page);
    performSearch({ q: searchTerm, page, size: 20 }); // ✅ 사이즈를 20으로 변경
  }, [searchTerm, performSearch]);

  // 초기 로딩만 수행 (디바운스 제거)
  useEffect(() => {
    performSearch({ q: '', page: 0, size: 20 }); // ✅ 사이즈를 20으로 변경
  }, [performSearch]);

  // 프로필 업데이트 이벤트 감지하여 검색 결과 새로고침
  useEffect(() => {
    const handleProfileUpdate = () => {
      // 현재 검색 조건으로 다시 검색
      performSearch({ q: searchTerm, page: currentPage, size: 20 });
    };

    window.addEventListener('profile-updated', handleProfileUpdate);
    return () => window.removeEventListener('profile-updated', handleProfileUpdate);
  }, [searchTerm, currentPage, performSearch]);

  return {
    accounts,
    loading,
    error,
    searchTerm,
    currentPage,
    totalElements,
    totalPages,
    handleSearch,
    handlePageChange,
    performSearch
  };
};
