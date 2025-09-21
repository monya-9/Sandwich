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
    // 빈 검색어일 때는 더미 데이터로 모든 계정 표시
    if (!params.q.trim()) {
      // 더미 데이터로 모든 계정 표시 (백엔드 API 수정 전까지 임시)
      const dummyAccounts = [
        { 
          id: 1, 
          nickname: '이병건', 
          email: 'lee@example.com', 
          avatarUrl: null, 
          isVerified: true, 
          position: '백엔드 개발자',
          projects: [
            { id: 1, title: 'Spring Boot API', description: 'REST API 개발', thumbnailUrl: null },
            { id: 2, title: 'Database 설계', description: 'PostgreSQL 설계', thumbnailUrl: null },
            { id: 3, title: 'Microservice', description: '마이크로서비스 아키텍처', thumbnailUrl: null }
          ]
        },
        { 
          id: 2, 
          nickname: '이병건', 
          email: 'lee2@example.com', 
          avatarUrl: null, 
          isVerified: true, 
          position: '프런트엔드 개발자',
          projects: [
            { id: 4, title: 'React App', description: 'React 웹앱', thumbnailUrl: null },
            { id: 5, title: 'Vue.js 프로젝트', description: 'Vue.js 개발', thumbnailUrl: null },
            { id: 6, title: 'TypeScript', description: 'TS 프로젝트', thumbnailUrl: null }
          ]
        },
        { 
          id: 3, 
          nickname: '이병건', 
          email: 'lee3@example.com', 
          avatarUrl: null, 
          isVerified: true, 
          position: '인공지능 개발자',
          projects: [
            { id: 7, title: 'ML 모델', description: '머신러닝 모델', thumbnailUrl: null },
            { id: 8, title: 'Deep Learning', description: '딥러닝 프로젝트', thumbnailUrl: null }
          ]
        },
        { 
          id: 4, 
          nickname: '김개발', 
          email: 'kim@example.com', 
          avatarUrl: null, 
          isVerified: true, 
          position: '데이터 사이언티스트',
          projects: [
            { id: 9, title: '데이터 분석', description: 'Python 분석', thumbnailUrl: null },
            { id: 10, title: '시각화', description: '차트 생성', thumbnailUrl: null },
            { id: 11, title: '통계 모델', description: '통계 분석', thumbnailUrl: null }
          ]
        }
      ];
      
      setAccounts(dummyAccounts);
      setTotalElements(dummyAccounts.length);
      setTotalPages(1);
      setCurrentPage(0);
      return;
    }

    const searchParams = params;

    setLoading(true);
    setError(null);

    try {
      console.log('계정 검색 API 호출:', searchParams);
      const response = await searchAccounts(searchParams);
      console.log('계정 검색 응답:', response);
      
      setAccounts(response.content);
      setTotalElements(response.totalElements);
      setTotalPages(response.totalPages);
      setCurrentPage(response.pageable.pageNumber);
      
      showToast('success', `${response.totalElements}개의 계정을 찾았습니다.`);
    } catch (err) {
      console.error('계정 검색 오류:', err);
      const errorMessage = err instanceof Error ? err.message : '검색 중 오류가 발생했습니다.';
      setError(errorMessage);
      setAccounts([]);
      setTotalElements(0);
      setTotalPages(0);
      
      showToast('error', errorMessage);
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

  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 500);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  useEffect(() => {
    if (debouncedSearchTerm.trim()) {
      performSearch({ q: debouncedSearchTerm, page: 0, size: 20 });
    } else {
      // 검색어가 없을 때는 더미 데이터로 모든 계정 표시
      performSearch({ q: '', page: 0, size: 20 });
    }
  }, [debouncedSearchTerm, performSearch]);

  // 초기 로딩 시 더미 데이터 표시
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
