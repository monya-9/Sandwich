// 프로젝트 피드 상태 관리 훅
import { useState, useEffect, useCallback, useRef } from 'react';
import { fetchProjectFeed, fetchProjectsMeta, ProjectFeedParams } from '../api/projects';
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
      
      // ✅ 필터 상태도 함께 업데이트
      setFilters(params);
      
      const response = await fetchProjectFeed(params);
      const projects = response.content || [];

      // ✅ 프로젝트 메타 정보 가져오기 (좋아요, 댓글, 조회수) - 안전하게 처리
      if (projects.length > 0) {
        try {
          const projectIds = projects.map(p => p.id);
          const metaData = await fetchProjectsMeta(projectIds);
          
          // 메타 정보를 프로젝트에 병합
          const projectsWithMeta = projects.map(project => ({
            ...project,
            likes: metaData[project.id]?.likes || 0,
            comments: metaData[project.id]?.comments || 0,
            views: metaData[project.id]?.views || 0,
          }));

          setProjects(projectsWithMeta);
        } catch (metaError) {
          // ✅ 메타 API 실패 시 기본값으로 표시
          console.warn('프로젝트 메타 정보 조회 실패, 기본값 사용:', metaError);
          const projectsWithDefaults = projects.map(project => ({
            ...project,
            likes: project.likes || 0,
            comments: project.comments || 0,
            views: project.views || 0,
          }));
          setProjects(projectsWithDefaults);
        }
      } else {
        setProjects([]);
      }
      
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
  }, [setFilters]);

  // 더 많은 프로젝트 로드 (무한 스크롤용)
  const loadMore = useCallback(async () => {
    if (isLoading || currentPage >= totalPages - 1) return;
    
    try {
      setIsLoading(true);
      const nextPage = currentPage + 1;
      const response = await fetchProjectFeed({
        ...filters,
        page: nextPage,
        size: 20 // ✅ 사이즈를 20으로 변경
      });
      
      const newProjects = response.content || [];
      
      // ✅ 새 프로젝트들의 메타 정보 가져오기 - 안전하게 처리
      if (newProjects.length > 0) {
        try {
          const projectIds = newProjects.map(p => p.id);
          const metaData = await fetchProjectsMeta(projectIds);
          
          // 메타 정보를 프로젝트에 병합
          const newProjectsWithMeta = newProjects.map(project => ({
            ...project,
            likes: metaData[project.id]?.likes || 0,
            comments: metaData[project.id]?.comments || 0,
            views: metaData[project.id]?.views || 0,
          }));

          setProjects(prev => [...prev, ...newProjectsWithMeta]);
        } catch (metaError) {
          // ✅ 메타 API 실패 시 기본값으로 표시
          console.warn('추가 프로젝트 메타 정보 조회 실패, 기본값 사용:', metaError);
          const newProjectsWithDefaults = newProjects.map(project => ({
            ...project,
            likes: project.likes || 0,
            comments: project.comments || 0,
            views: project.views || 0,
          }));
          setProjects(prev => [...prev, ...newProjectsWithDefaults]);
        }
      } else {
        setProjects(prev => [...prev, ...newProjects]);
      }
      
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
    
    // ✅ loadProjects만 호출 (setFilters는 loadProjects 내부에서 처리)
    await loadProjects(searchParams);
  }, [filters, loadProjects]);

  // 필터 변경
  const handleSetFilters = useCallback((newFilters: ProjectFeedParams) => {
    const updatedFilters = { ...filters, ...newFilters }; // ✅ page: 0 강제 설정 제거
    
    // q 필드가 undefined이면 완전히 제거
    if (newFilters.q === undefined) {
      delete updatedFilters.q;
    }
    
    // ✅ loadProjects만 호출 (setFilters는 loadProjects 내부에서 처리)
    loadProjects(updatedFilters);
  }, [filters, loadProjects]);

  // 필터 초기화
  const clearFilters = useCallback(() => {
    const clearedFilters = { page: 0, size: 20 }; // ✅ size를 20으로 변경
    // ✅ loadProjects만 호출 (setFilters는 loadProjects 내부에서 처리)
    loadProjects(clearedFilters);
  }, [loadProjects]);

  // 초기 검색어 처리 및 초기 로딩
  useEffect(() => {
    if (initialSearchTerm && initialSearchTerm.trim()) {
      // 초기 검색어가 있으면 검색 실행
      const searchParams = { page: 0, size: 20, q: initialSearchTerm };
      loadProjects(searchParams);
    } else if (!hasInitialized.current) {
      // 초기 검색어가 없고 아직 초기화되지 않았으면 전체 프로젝트 로드
      hasInitialized.current = true;
      const defaultParams = { page: 0, size: 20 };
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
