// 프로젝트 피드 페이지 컴포넌트
import React from 'react';
import ProjectFeedContainer from '../components/ProjectFeed/ProjectFeedContainer';

const ProjectFeedPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      <ProjectFeedContainer />
    </div>
  );
};

export default ProjectFeedPage;
