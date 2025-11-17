// 프로젝트 카드 그리드 컴포넌트
import React from 'react';
import ProjectCard from '../Main/ProjectCard';
import { Project } from '../../types/Project';
import LoadingSpinner from '../common/LoadingSpinner';
import EmptyState from '../common/EmptyState';

interface ProjectCardGridProps {
  projects: Project[];
  isLoading: boolean;
  isInitialLoading: boolean;
  error: string | null;
  onRefresh: () => void;
  onClearSearch?: () => void;
  currentSearchTerm?: string; // 현재 검색어 추가
}

export const ProjectCardGrid: React.FC<ProjectCardGridProps> = ({
  projects,
  isLoading,
  isInitialLoading,
  error,
  onRefresh,
  onClearSearch,
  currentSearchTerm
}) => {
  // 초기 로딩 상태
  if (isInitialLoading) {
    return (
      <div className="flex flex-col justify-center items-center py-20">
        <LoadingSpinner size="large" />
        <p className="mt-4 text-gray-600 text-lg">회원수 10만명 포트폴리오 가져오는 중입니다...</p>
      </div>
    );
  }

  // 로딩 상태 (검색 중일 때는 이전 결과 숨김)
  if (isLoading) {
    const loadingMessage = currentSearchTerm 
      ? `'${currentSearchTerm}'에 대한 검색 중입니다...`
      : '검색중입니다...';
    
    return (
      <div className="flex flex-col justify-center items-center py-20">
        <LoadingSpinner size="large" />
        <p className="mt-4 text-gray-600 text-lg">{loadingMessage}</p>
      </div>
    );
  }

  // 에러 상태
  if (error && projects.length === 0) {
    return (
      <EmptyState
        title="프로젝트를 불러올 수 없습니다"
        description={error}
        actionLabel="다시 시도"
        onAction={onRefresh}
      />
    );
  }

  // 빈 상태
  if (projects.length === 0) {
    return (
      <EmptyState
        title="프로젝트가 없습니다"
        description="검색 조건을 변경하거나 다른 키워드로 검색해보세요."
        actionLabel="전체 프로젝트 보기"
        onAction={onClearSearch || onRefresh}
      />
    );
  }

  return (
    <div className="space-y-4 md:space-y-8">
      {/* 프로젝트 그리드 - 모바일 2개, 태블릿 3개, 데스크톱 4개 */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3 md:gap-6">
        {projects.map((project, index) => (
          <ProjectCard key={project.id} project={project} indexInList={index} />
        ))}
      </div>

      {/* 더 로딩 중일 때 */}
      {isLoading && projects.length > 0 && (
        <div className="flex justify-center py-4 md:py-8">
          <LoadingSpinner size="medium" />
        </div>
      )}
    </div>
  );
};

export default ProjectCardGrid;
