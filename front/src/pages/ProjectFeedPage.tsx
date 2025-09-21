// 검색 페이지 컴포넌트 (프로젝트 + 계정 검색)
import React, { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import ProjectFeedContainer from '../components/ProjectFeed/ProjectFeedContainer';
import AccountSearchContainer from '../components/AccountSearch/AccountSearchContainer';

const ProjectFeedPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const [searchType, setSearchType] = useState<'PORTFOLIO' | 'ACCOUNT'>('PORTFOLIO');
  
  // URL에서 초기 검색어 가져오기
  const initialSearchTerm = searchParams.get('q') || '';

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 검색 컨텐츠 */}
      {searchType === 'PORTFOLIO' ? (
        <ProjectFeedContainer 
          searchType={searchType}
          onSearchTypeChange={setSearchType}
          initialSearchTerm={initialSearchTerm}
        />
      ) : (
        <AccountSearchContainer 
          searchType={searchType}
          onSearchTypeChange={setSearchType}
          initialSearchTerm={initialSearchTerm}
        />
      )}
    </div>
  );
};

export default ProjectFeedPage;
