// 검색 페이지 컴포넌트 (프로젝트 + 계정 검색)
import React, { useState } from 'react';
import ProjectFeedContainer from '../components/ProjectFeed/ProjectFeedContainer';
import AccountSearchContainer from '../components/AccountSearch/AccountSearchContainer';

const ProjectFeedPage: React.FC = () => {
  const [searchType, setSearchType] = useState<'PORTFOLIO' | 'ACCOUNT'>('PORTFOLIO');

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 검색 컨텐츠 */}
      {searchType === 'PORTFOLIO' ? (
        <ProjectFeedContainer 
          searchType={searchType}
          onSearchTypeChange={setSearchType}
        />
      ) : (
        <AccountSearchContainer 
          searchType={searchType}
          onSearchTypeChange={setSearchType}
        />
      )}
    </div>
  );
};

export default ProjectFeedPage;
