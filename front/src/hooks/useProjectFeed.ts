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
      
      // 1단계: 검색/피드 API 호출
      const response = await fetchProjectFeed(params);
      const projects = response.content || [];

      // ✅ 2단계: 검색 결과를 먼저 표시 (메타 정보 없이도 즉시 보여줌)
      // 기본값으로 메타 정보 초기화 (이미 프로젝트에 포함되어 있을 수 있음)
      const projectsWithDefaults = projects.map(project => ({
        ...project,
        likes: project.likes || 0,
        comments: project.comments || 0,
        views: project.views || 0,
      }));
      
      setProjects(projectsWithDefaults);
      setTotalElements(response.totalElements || 0);
      setTotalPages(response.totalPages || 0);
      setCurrentPage(response.page || 0);
      
      // ✅ 로딩 완료 표시 (메타 정보를 기다리지 않음)
      setIsLoading(false);
      setIsInitialLoading(false);

      // ✅ 3단계: 백그라운드에서 메타 정보 비동기 로드 (사용자는 이미 결과를 보고 있음)
      if (projects.length > 0) {
        const projectIds = projects.map(p => p.id);
        fetchProjectsMeta(projectIds)
          .then(metaData => {
            // ✅ 현재 state의 프로젝트들을 기준으로 업데이트 (owner 정보 유지)
            setProjects(prevProjects => {
              // prevProjects와 projects의 순서/개수가 동일하다고 가정
              return prevProjects.map((prevProject, index) => {
                const originalProject = projects[index];
                // 원본 프로젝트의 owner 정보를 유지하면서 메타 정보만 업데이트
                return {
                  ...prevProject,
                  ...originalProject, // 원본의 owner 정보 등 모든 정보 보존
                  likes: metaData[originalProject.id]?.likes || prevProject.likes || 0,
                  comments: metaData[originalProject.id]?.comments || prevProject.comments || 0,
                  views: metaData[originalProject.id]?.views || prevProject.views || 0,
                };
              });
            });
          })
          .catch(metaError => {
            // 메타 API 실패해도 검색 결과는 이미 표시하고 있음
            console.warn('프로젝트 메타 정보 조회 실패, 기본값 유지:', metaError);
          });
      }
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '프로젝트를 불러오는데 실패했습니다.';
      setError(errorMessage);
      setIsLoading(false);
      setIsInitialLoading(false);
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
      
      // ✅ 새 프로젝트를 먼저 추가 (메타 정보 없이)
      const newProjectsWithDefaults = newProjects.map(project => ({
        ...project,
        likes: project.likes || 0,
        comments: project.comments || 0,
        views: project.views || 0,
      }));
      
      setProjects(prev => [...prev, ...newProjectsWithDefaults]);
      setCurrentPage(nextPage);
      setIsLoading(false);
      
      // ✅ 백그라운드에서 메타 정보 비동기 로드
      if (newProjects.length > 0) {
        const newProjectIds = newProjects.map(p => p.id);
        fetchProjectsMeta(newProjectIds)
          .then(metaData => {
            // ✅ 메타 정보가 도착하면 해당 프로젝트들만 업데이트 (owner 정보 유지)
            setProjects(prev => {
              return prev.map(project => {
                const meta = metaData[project.id];
                if (meta) {
                  // 원본 프로젝트 찾기 (owner 정보 보존을 위해)
                  const originalProject = newProjects.find(p => p.id === project.id);
                  return {
                    ...project,
                    ...originalProject, // 원본의 owner 정보 등 모든 정보 보존
                    likes: meta.likes || project.likes || 0,
                    comments: meta.comments || project.comments || 0,
                    views: meta.views || project.views || 0,
                  };
                }
                return project;
              });
            });
          })
          .catch(metaError => {
            // 메타 API 실패해도 이미 프로젝트는 추가되어 있음
            console.warn('추가 프로젝트 메타 정보 조회 실패, 기본값 유지:', metaError);
          });
      }
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '더 많은 프로젝트를 불러오는데 실패했습니다.';
      setError(errorMessage);
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
