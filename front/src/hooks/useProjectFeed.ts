// 프로젝트 피드 상태 관리 훅
import { useState, useEffect, useCallback } from 'react';
import { fetchProjectFeed, ProjectFeedParams } from '../api/projects';
import { Project } from '../types/Project';
// Toast 알림을 위한 간단한 함수 (임시)
const showToast = (type: 'success' | 'error' | 'warning', message: string) => {
  console.log(`[${type.toUpperCase()}] ${message}`);
  // TODO: 실제 Toast 컴포넌트와 연동
};

interface UseProjectFeedReturn {
  // 데이터
  projects: Project[];
  totalElements: number;
  totalPages: number;
  currentPage: number;
  isLoading: boolean;
  error: string | null;
  
  // 액션
  loadProjects: (params?: ProjectFeedParams) => Promise<void>;
  loadMore: () => Promise<void>;
  refresh: () => Promise<void>;
  searchProjects: (query: string) => Promise<void>;
  
  // 필터 상태
  filters: ProjectFeedParams;
  setFilters: (filters: ProjectFeedParams) => void;
  clearFilters: () => void;
}

export const useProjectFeed = (initialParams: ProjectFeedParams = {}, initialSearchTerm?: string): UseProjectFeedReturn => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [totalElements, setTotalElements] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [currentPage, setCurrentPage] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<ProjectFeedParams>(initialParams);
  
  // showToast 함수는 위에서 정의됨

  // 프로젝트 로드 함수
  const loadProjects = useCallback(async (params: ProjectFeedParams = {}) => {
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await fetchProjectFeed(params);
      
      
      setProjects(response.content || []);
      setTotalElements(response.totalElements || 0);
      setTotalPages(response.totalPages || 0);
      setCurrentPage(response.page || 0);
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '프로젝트를 불러오는데 실패했습니다.';
      setError(errorMessage);
      showToast('error', errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // 더 많은 프로젝트 로드 (무한 스크롤용)
  const loadMore = useCallback(async () => {
    if (isLoading || currentPage >= totalPages - 1) return;
    
    try {
      setIsLoading(true);
      const nextPage = currentPage + 1;
      const response = await fetchProjectFeed({
        ...filters,
        page: nextPage,
        size: 20
      });
      
      setProjects(prev => [...prev, ...response.content]);
      setCurrentPage(nextPage);
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '더 많은 프로젝트를 불러오는데 실패했습니다.';
      setError(errorMessage);
      showToast('error', errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [isLoading, currentPage, totalPages, filters]);

  // 새로고침
  const refresh = useCallback(async () => {
    await loadProjects(filters);
  }, [loadProjects, filters]);

  // 프로젝트 검색
  const searchProjects = useCallback(async (query: string) => {
    const searchParams = { ...filters, q: query, page: 0 };
    setFilters(searchParams);
    await loadProjects(searchParams);
  }, [filters, loadProjects]);

  // 필터 변경
  const handleSetFilters = useCallback((newFilters: ProjectFeedParams) => {
    const updatedFilters = { ...filters, ...newFilters, page: 0 };
    setFilters(updatedFilters);
    loadProjects(updatedFilters);
  }, [filters, loadProjects]);

  // 필터 초기화
  const clearFilters = useCallback(() => {
    const clearedFilters = { page: 0, size: 20 };
    setFilters(clearedFilters);
    loadProjects(clearedFilters);
  }, [loadProjects]);

  // 초기 로드 및 검색어 처리
  useEffect(() => {
    console.log('useProjectFeed 초기화:', { initialSearchTerm, filters }); // 디버깅용 로그
    if (initialSearchTerm && initialSearchTerm.trim()) {
      // 초기 검색어가 있으면 검색 실행
      const searchParams = { ...filters, q: initialSearchTerm, page: 0 };
      console.log('검색 실행:', searchParams); // 디버깅용 로그
      setFilters(searchParams);
      loadProjects(searchParams);
    } else {
      // 초기 검색어가 없으면 일반 로드
      console.log('일반 로드:', filters); // 디버깅용 로그
      loadProjects(filters);
    }
  }, [initialSearchTerm]); // initialSearchTerm만 의존성으로 사용

  return {
    // 데이터
    projects,
    totalElements,
    totalPages,
    currentPage,
    isLoading,
    error,
    
    // 액션
    loadProjects,
    loadMore,
    refresh,
    searchProjects,
    
    // 필터 상태
    filters,
    setFilters: handleSetFilters,
    clearFilters
  };
};
