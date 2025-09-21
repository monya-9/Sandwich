// 프로젝트 카드 그리드 컴포넌트
import React from 'react';
import ProjectCard from '../Main/ProjectCard';
import { Project } from '../../types/Project';
import LoadingSpinner from '../common/LoadingSpinner';
import EmptyState from '../common/EmptyState';

interface ProjectCardGridProps {
  projects: Project[];
  isLoading: boolean;
  error: string | null;
  onRefresh: () => void;
  onClearSearch?: () => void;
}

export const ProjectCardGrid: React.FC<ProjectCardGridProps> = ({
  projects,
  isLoading,
  error,
  onRefresh,
  onClearSearch
}) => {
  // 로딩 상태
  if (isLoading && projects.length === 0) {
    return (
      <div className="flex justify-center items-center py-20">
        <LoadingSpinner size="large" />
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
    <div className="space-y-8">
      {/* 프로젝트 그리드 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {projects.map((project, index) => (
          <ProjectCard key={project.id} project={project} indexInList={index} />
        ))}
      </div>

      {/* 더 로딩 중일 때 */}
      {isLoading && projects.length > 0 && (
        <div className="flex justify-center py-8">
          <LoadingSpinner size="medium" />
        </div>
      )}
    </div>
  );
};

export default ProjectCardGrid;
