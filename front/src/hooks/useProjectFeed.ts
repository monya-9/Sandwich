// 프로젝트 피드 상태 관리 훅
import { useState, useEffect, useCallback, useRef } from 'react';
import { fetchProjectFeed, ProjectFeedParams } from '../api/projects';
import { Project } from '../types/Project';

interface UseProjectFeedReturn {
  // 데이터
  projects: Project[];
  totalElements: number;
  totalPages: number;
  currentPage: number;
  isLoading: boolean;
  isInitialLoading: boolean;
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
  const [isInitialLoading, setIsInitialLoading] = useState(true); // 초기 로딩 상태 추가
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<ProjectFeedParams>(initialParams);
  const hasInitialized = useRef(false); // 초기화 완료 여부
  
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
    } finally {
      setIsLoading(false);
      setIsInitialLoading(false); // 초기 로딩 완료
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
    const searchParams = { ...filters, page: 0 };
    
    // 빈 검색어인 경우 q 필드를 명시적으로 제거
    if (query.trim()) {
      searchParams.q = query;
    } else {
      delete searchParams.q; // q 필드 완전 제거
    }
    
    // 검색 시작 시 이전 프로젝트들 초기화
    setProjects([]);
    setTotalElements(0);
    setTotalPages(0);
    setCurrentPage(0);
    
    setFilters(searchParams);
    await loadProjects(searchParams);
  }, [filters, loadProjects]);

  // 필터 변경
  const handleSetFilters = useCallback((newFilters: ProjectFeedParams) => {
    const updatedFilters = { ...filters, ...newFilters, page: 0 };
    
    // q 필드가 undefined이면 완전히 제거
    if (newFilters.q === undefined) {
      delete updatedFilters.q;
    }
    
    setFilters(updatedFilters);
    loadProjects(updatedFilters);
  }, [filters, loadProjects]);

  // 필터 초기화
  const clearFilters = useCallback(() => {
    const clearedFilters = { page: 0, size: 20 };
    setFilters(clearedFilters);
    loadProjects(clearedFilters);
  }, [loadProjects]);

  // 초기 검색어 처리 및 초기 로딩 (한 번만 실행)
  useEffect(() => {
    if (hasInitialized.current) return; // 이미 초기화되었으면 무시
    
    hasInitialized.current = true;
    
    if (initialSearchTerm && initialSearchTerm.trim()) {
      // 초기 검색어가 있으면 검색 실행
      const searchParams = { page: 0, size: 20, q: initialSearchTerm };
      setFilters(searchParams);
      loadProjects(searchParams);
    } else {
      // 초기 검색어가 없으면 전체 프로젝트 로드
      const defaultParams = { page: 0, size: 20 };
      setFilters(defaultParams);
      loadProjects(defaultParams);
    }
  }, [initialSearchTerm, loadProjects]);

  // 필터 변경 시 프로젝트 로드 (초기화 제외)
  useEffect(() => {
    if (hasInitialized.current) {
      loadProjects(filters);
    }
  }, [filters, loadProjects]);

  return {
    // 데이터
    projects,
    totalElements,
    totalPages,
    currentPage,
    isLoading,
    isInitialLoading,
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
