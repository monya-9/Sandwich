// 프로젝트 피드 메인 컨테이너 컴포넌트
import React from 'react';
import ProjectSearchBar from './ProjectSearchBar';
import ProjectFilterOptions from './ProjectFilterOptions';
import ProjectCardGrid from './ProjectCardGrid';
import ProjectPagination from './ProjectPagination';
import { useProjectFeed } from '../../hooks/useProjectFeed';
import { useState } from 'react';

interface ProjectFeedContainerProps {
  searchType: 'PORTFOLIO' | 'ACCOUNT';
  onSearchTypeChange: (type: 'PORTFOLIO' | 'ACCOUNT') => void;
  initialSearchTerm?: string;
}

const ProjectFeedContainer: React.FC<ProjectFeedContainerProps> = ({ 
  searchType, 
  onSearchTypeChange,
  initialSearchTerm = ''
}) => {
  const {
    projects,
    totalElements,
    isLoading,
    isInitialLoading,
    error,
    filters,
    setFilters,
    clearFilters,
    searchProjects,
    refresh,
    loadProjects
  } = useProjectFeed({}, initialSearchTerm);

  // 정렬 타입 상태
  const [sortType, setSortType] = useState<'latest' | 'popular' | 'recommended'>('recommended');

  // 검색어 초기화 함수
  const handleClearSearch = () => {
    const clearedFilters = { ...filters, page: 0 };
    delete clearedFilters.q; // q 필드 완전 제거
    setFilters(clearedFilters);
    loadProjects(clearedFilters); // 전체 프로젝트 로드
    // URL도 업데이트
    window.history.pushState({}, '', '/search');
  };

  return (
    <div className="min-h-screen bg-white">
      {/* 검색바와 필터 옵션 */}
      <div className="bg-white border-b border-gray-200 px-4 py-6">
        <div className="max-w-7xl mx-auto">
          <ProjectSearchBar 
            onSearch={searchProjects}
            currentQuery={filters.q || initialSearchTerm}
            isLoading={isLoading}
            searchType={searchType}
            onSearchTypeChange={onSearchTypeChange}
            sortType={sortType}
            onSortChange={setSortType}
          />
          <ProjectFilterOptions 
            filters={filters}
            onFiltersChange={setFilters}
            onClearFilters={clearFilters}
            totalElements={totalElements}
          />
        </div>
      </div>

      {/* 메인 콘텐츠 */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* 검색 결과 텍스트 - 로딩 중이 아닐 때만 표시 */}
        {filters.q && !isLoading && !isInitialLoading && (
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              '{filters.q}'에 대한 검색 결과
            </h1>
            <p className="text-gray-600">
              {totalElements.toLocaleString()}개의 포트폴리오를 발견했습니다.
            </p>
          </div>
        )}
        
        <ProjectCardGrid 
          projects={projects}
          isLoading={isLoading}
          isInitialLoading={isInitialLoading}
          error={error}
          onRefresh={refresh}
          onClearSearch={handleClearSearch}
          currentSearchTerm={filters.q}
        />
        
        {/* 페이지네이션 - 로딩 중이 아닐 때만 표시 */}
        {projects.length > 0 && !isLoading && !isInitialLoading && (
          <ProjectPagination 
            currentPage={filters.page || 0}
            totalPages={Math.ceil(totalElements / (filters.size || 20))}
            onPageChange={(page: number) => setFilters({ ...filters, page })}
          />
        )}
      </div>
    </div>
  );
};

export default ProjectFeedContainer;
