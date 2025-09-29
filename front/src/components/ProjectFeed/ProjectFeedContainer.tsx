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
  
  // 검색어 상태 (초기화를 위해 별도 관리)
  const [currentSearchQuery, setCurrentSearchQuery] = useState(filters.q || initialSearchTerm);

  // 검색 함수 (검색어 상태도 함께 업데이트)
  const handleSearch = (query: string) => {
    setCurrentSearchQuery(query);
    searchProjects(query);
  };

  // 검색어 초기화 함수
  const handleClearSearch = () => {
    const clearedFilters = { page: 0, size: 20, q: undefined }; // ✅ 사이즈를 20으로 변경
    setFilters(clearedFilters);
    setCurrentSearchQuery(''); // 검색어 입력창 초기화
    // loadProjects는 useEffect에서 자동으로 호출됨
    // URL도 업데이트
    window.history.pushState({}, '', '/search');
  };

  return (
    <div className="min-h-screen bg-white">
      {/* 검색바와 필터 옵션 */}
      <div className="bg-white border-b border-gray-200 px-4 py-6">
        <div className="max-w-7xl mx-auto">
          <ProjectSearchBar 
            onSearch={handleSearch}
            currentQuery={currentSearchQuery}
            isLoading={isLoading}
            searchType={searchType}
            onSearchTypeChange={onSearchTypeChange}
            sortType={sortType}
            onSortChange={setSortType}
            onClearSearch={handleClearSearch}
          />
          <ProjectFilterOptions 
            filters={filters}
            onFiltersChange={setFilters}
            onClearFilters={clearFilters}
            onClearSearch={handleClearSearch}
            totalElements={totalElements}
          />
        </div>
      </div>

      {/* 메인 콘텐츠 */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* 검색 결과 텍스트 - 로딩 중이 아닐 때만 표시 */}
        {filters.q && filters.q.trim() && !isLoading && !isInitialLoading && (
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
        {projects.length > 0 && !isLoading && !isInitialLoading && totalElements > 20 && (
          <ProjectPagination 
            currentPage={filters.page || 0}
            totalPages={Math.ceil(totalElements / (filters.size || 20))}
            onPageChange={(page: number) => {
              const newFilters = { ...filters, page };
              // ✅ URL 파라미터 업데이트
              const params = new URLSearchParams();
              if (newFilters.q) params.set('q', newFilters.q);
              if (page > 0) params.set('page', page.toString());
              window.history.pushState({}, '', `/search?${params.toString()}`);
              // ✅ 직접 loadProjects 호출 (상태 업데이트와 API 호출 분리)
              loadProjects(newFilters);
            }}
          />
        )}
      </div>
    </div>
  );
};

export default ProjectFeedContainer;
