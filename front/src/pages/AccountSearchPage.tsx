// 계정 검색 전용 페이지 컴포넌트
import React, { useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import AccountSearchContainer from '../components/AccountSearch/AccountSearchContainer';

const AccountSearchPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  
  // URL에서 초기 검색어와 페이지 가져오기
  const initialSearchTerm = searchParams.get('q') || '';
  const initialPage = parseInt(searchParams.get('page') || '0', 10);

  // 검색 타입 변경 핸들러 (포트폴리오로 이동)
  const handleSearchTypeChange = (type: 'PORTFOLIO' | 'ACCOUNT') => {
    if (type === 'PORTFOLIO') {
      // 포트폴리오 검색으로 이동 (새로고침 없이, 검색어 없이)
      navigate('/search');
    }
    // ACCOUNT는 현재 페이지이므로 아무것도 하지 않음
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <AccountSearchContainer 
        searchType="ACCOUNT"
        onSearchTypeChange={handleSearchTypeChange}
        initialSearchTerm={initialSearchTerm}
      />
    </div>
  );
};

export default AccountSearchPage;
