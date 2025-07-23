import React, { useState } from 'react';
import { Project } from '../../types/Project';
import { dummyUsers } from '../../data/dummyUsers';

type Props = {
  project: Project;
};

const ProjectCard: React.FC<Props> = ({ project }) => {
  const [isHovered, setIsHovered] = useState(false);
  const author = dummyUsers.find((user) => user.id === project.authorId);
  const initial = author?.name.charAt(0).toUpperCase() || '?';

  return (
    <div className="relative w-full h-[240px] flex flex-col items-center">
      {/* 이미지 영역 */}
      <div
        className="w-full h-[300px] bg-gray-200 rounded-[20px] overflow-hidden relative cursor-pointer"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {isHovered && (
          <div className="absolute inset-0 bg-black bg-opacity-40 flex items-end justify-start p-4 transition-opacity duration-300">
            <p className="text-white text-sm font-medium truncate text-left w-full">
              {project.title}
            </p>
          </div>
        )}
      </div>

      {/* 작성자 + 정보 영역 */}
      <div className="w-full mt-1 flex justify-between items-center px-1">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-full bg-gray-300 text-xs font-semibold flex items-center justify-center text-black">
            {initial}
          </div>
          <span className="text-sm text-black">{author?.name || '알 수 없음'}</span>
        </div>
        <div className="text-xs text-gray-600 flex gap-3">
          <span>👁 {project.views}</span>
          <span>♥ {project.likes}</span>
          <span>💬 {project.comments}</span>
        </div>
      </div>
    </div>
  );
};

export default ProjectCard;
