import React from 'react';
import { Project } from '../../types/Project';

type ProjectCardProps = Project;

const ProjectCard: React.FC<ProjectCardProps> = ({
  title,
  author,
  likes,
  views,
  comments,
}) => {
  return (
    <div className="w-full h-[200px] bg-gray-100 rounded-md shadow-sm p-4">
      <h3 className="text-lg font-semibold mb-2">{title}</h3>
      <p className="text-sm text-gray-600 mb-1">작성자: {author}</p>
      <div className="text-xs text-gray-500 flex gap-3">
        <span>♥ {likes}</span>
        <span>👁 {views}</span>
        <span>💬 {comments}</span>
      </div>
    </div>
  );
};

export default ProjectCard;
