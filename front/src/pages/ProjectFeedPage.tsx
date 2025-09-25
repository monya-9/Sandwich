// 검색 페이지 컴포넌트 (프로젝트 + 계정 검색)
import React, { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import ProjectFeedContainer from '../components/ProjectFeed/ProjectFeedContainer';
import AccountSearchContainer from '../components/AccountSearch/AccountSearchContainer';

const ProjectFeedPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const [searchType, setSearchType] = useState<'PORTFOLIO' | 'ACCOUNT'>('PORTFOLIO');
  
  // URL에서 초기 검색어 가져오기 (검색 타입이 변경되면 초기화)
  const initialSearchTerm = searchParams.get('q') || '';

  // 검색 타입 변경 핸들러
  const handleSearchTypeChange = (type: 'PORTFOLIO' | 'ACCOUNT') => {
    setSearchType(type);
    // 검색 타입 변경 시 URL에서 검색어 제거
    window.history.pushState({}, '', '/search');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 검색 컨텐츠 */}
      {searchType === 'PORTFOLIO' ? (
        <ProjectFeedContainer 
          searchType={searchType}
          onSearchTypeChange={handleSearchTypeChange}
          initialSearchTerm={initialSearchTerm}
        />
      ) : (
        <AccountSearchContainer 
          searchType={searchType}
          onSearchTypeChange={handleSearchTypeChange}
          initialSearchTerm={initialSearchTerm}
        />
      )}
    </div>
  );
};

export default ProjectFeedPage;
