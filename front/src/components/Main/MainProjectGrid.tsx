// MainProjectGrid.tsx
// 카드 형태로 프로젝트 리스트 보여주는 영역 (재사용 가능하게 title props로 제목 받기)

import React from 'react';
import ProjectCard from './ProjectCard';
import { Project } from '../../types/Project';

type MainProjectGridProps = {
  title: string;
  projects: Project[];
};

const MainProjectGrid: React.FC<MainProjectGridProps> = ({ title, projects }) => {
  return (
    <section className="px-6 py-6">
      <h2 className="text-2xl font-bold mb-4">{title}</h2>

      {/* 반응형 grid: 최소 2개부터 최대 5개까지 자동 조절, 간격은 적당히 압축 */}
      <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-x-4 gap-y-5">
        {projects.map((project) => (
          <ProjectCard key={project.id} project={project} />
        ))}
      </div>
    </section>
  );
};

export default MainProjectGrid;
