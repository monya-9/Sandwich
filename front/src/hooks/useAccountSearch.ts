import { useState, useEffect, useCallback } from 'react';
import { searchAccounts, AccountSearchResult, AccountSearchParams } from '../api/accounts';

const showToast = (type: 'success' | 'error' | 'warning', message: string) => {
  console.log(`[${type.toUpperCase()}] ${message}`);
};

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
      console.log('계정 검색 API 호출:', params);
      const response = await searchAccounts(params);
      
      setAccounts(response.content);
      setTotalElements(response.totalElements);
      setTotalPages(response.totalPages);
      setCurrentPage(response.page);
      
      showToast('success', `${response.content.length}개의 계정을 찾았습니다.`);
    } catch (error: any) {
      console.error('계정 검색 실패:', error);
      setError(error.message || '계정 검색에 실패했습니다.');
      setAccounts([]);
      setTotalElements(0);
      setTotalPages(0);
      setCurrentPage(0);
      
      showToast('error', '계정 검색에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  }, []);

  const handleSearch = useCallback((term: string) => {
    setSearchTerm(term);
    setCurrentPage(0);
    performSearch({ q: term, page: 0, size: 20 });
  }, [performSearch]);

  const handlePageChange = useCallback((page: number) => {
    if (searchTerm.trim()) {
      setCurrentPage(page);
      performSearch({ q: searchTerm, page, size: 20 });
    }
  }, [searchTerm, performSearch]);

  // 초기 로딩만 수행 (디바운스 제거)
  useEffect(() => {
    performSearch({ q: '', page: 0, size: 20 });
  }, [performSearch]);

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
