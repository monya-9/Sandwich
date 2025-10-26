// MainProjectGrid.tsx
// 카드 형태로 프로젝트 리스트 보여주는 영역 (재사용 가능하게 title props로 제목 받기)
import React, { memo } from 'react';
import ProjectCard from './ProjectCard';
import { Project } from '../../types/Project';

type MainProjectGridProps = {
  title: string;
  projects: Project[];
  onOpenSortModal?: () => void;
};

const MainProjectGrid: React.FC<MainProjectGridProps> = memo(({ title, projects, onOpenSortModal }) => {
  return (
    <section className="px-3 py-4 md:px-5 md:py-5 lg:px-6 lg:py-6">
      <div className="flex justify-between items-center mb-3 md:mb-4">
        <h2 className="text-lg md:text-xl lg:text-2xl font-bold text-black dark:text-gray-100">{title}</h2>
        {onOpenSortModal && (
          <button
            onClick={onOpenSortModal}
            className="text-xs md:text-sm lg:text-base font-semibold px-2 md:px-3 lg:px-4 py-1 transition-all duration-200 text-black dark:text-gray-200 hover:text-green-600 dark:hover:text-green-400 whitespace-nowrap flex-shrink-0"
          >
            ↕ 정렬
          </button>
        )}
      </div>

      {/* 반응형 grid: 최소 2개부터 최대 5개까지 자동 조절, 간격은 적당히 압축 */}
      <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-x-3 gap-y-4 md:gap-x-4 md:gap-y-5">
        {projects.map((project) => (
          <ProjectCard key={project.id} project={project} />
        ))}
      </div>
    </section>
  );
}, (prevProps, nextProps) => {
  // title이나 projects 배열이 동일하면 리렌더링 방지
  return prevProps.title === nextProps.title &&
         prevProps.projects.length === nextProps.projects.length &&
         prevProps.projects.every((p, i) => p.id === nextProps.projects[i]?.id);
});

MainProjectGrid.displayName = 'MainProjectGrid';

export default MainProjectGrid;
