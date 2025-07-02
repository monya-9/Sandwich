import React from 'react';
import ProjectCard from './ProjectCard';
import { Project } from '../../types/Project';

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
