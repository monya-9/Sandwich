// 프로젝트 피드 메인 컨테이너 컴포넌트
import React from 'react';
import ProjectSearchBar from './ProjectSearchBar';
import ProjectFilterOptions from './ProjectFilterOptions';
import ProjectCardGrid from './ProjectCardGrid';
import ProjectPagination from './ProjectPagination';
import { useProjectFeed } from '../../hooks/useProjectFeed';
import { useState } from 'react';

const ProjectFeedContainer: React.FC = () => {
  const {
    projects,
    totalElements,
    isLoading,
    error,
    filters,
    setFilters,
    clearFilters,
    searchProjects,
    refresh
  } = useProjectFeed();

  // 검색 타입 상태
  const [searchType, setSearchType] = useState<'PORTFOLIO' | 'ACCOUNT'>('PORTFOLIO');
  
  // 정렬 타입 상태
  const [sortType, setSortType] = useState<'latest' | 'popular' | 'recommended'>('recommended');

  return (
    <div className="min-h-screen bg-white">
      {/* 검색바와 필터 옵션 */}
      <div className="bg-white border-b border-gray-200 px-4 py-6">
        <div className="max-w-7xl mx-auto">
          <ProjectSearchBar 
            onSearch={searchProjects}
            currentQuery={filters.q || ''}
            isLoading={isLoading}
            searchType={searchType}
            onSearchTypeChange={setSearchType}
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
        <ProjectCardGrid 
          projects={projects}
          isLoading={isLoading}
          error={error}
          onRefresh={refresh}
        />
        
        {/* 페이지네이션 */}
        {projects.length > 0 && (
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
