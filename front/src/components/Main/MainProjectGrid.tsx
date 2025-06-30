import React from 'react';
import ProjectCard from './ProjectCard';

type Project = {
  id: number;
  title: string;
  author: string;
  likes: number;
  views: number;
  comments: number;
  // 필요 시 여기에 다른 필드 추가 가능
};

type MainProjectGridProps = {
  title: string;
  projects: Project[];
};

const MainProjectGrid: React.FC<MainProjectGridProps> = ({ title, projects }) => {
  return (
    <section className="px-8 py-6">
      <h2 className="text-xl font-bold mb-4">{title}</h2>
      <div className="grid grid-cols-5 gap-6">
        {projects.map((project) => (
          <ProjectCard key={project.id} {...project} />
        ))}
      </div>
    </section>
  );
};

export default MainProjectGrid;
