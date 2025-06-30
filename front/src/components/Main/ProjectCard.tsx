//각각의 프로젝트 카드 (작성자, 좋아요, 조회수 등 포함)
import React from 'react';

type ProjectCardProps = {
  id: number;
  title: string;
  author: string;
  likes: number;
  views: number;
  comments: number;
  // 필요에 따라 다른 필드 추가 가능
};

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
