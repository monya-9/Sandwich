import React, { useCallback, useState, useContext } from 'react';
import AccountCardGrid from './AccountCardGrid';
import { useAccountSearch } from '../../hooks/useAccountSearch';
import { ProjectPagination } from '../ProjectFeed/ProjectPagination';
import { Search, RotateCcw } from 'lucide-react';
import { SearchTypeDropdown } from '../ProjectFeed/SearchTypeDropdown';
import { saveRecentSearch } from '../../api/recentSearch';
import { useSearchParams } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';

interface AccountSearchContainerProps {
  initialSearchTerm?: string;
  searchType: 'PORTFOLIO' | 'ACCOUNT';
  onSearchTypeChange: (type: 'PORTFOLIO' | 'ACCOUNT') => void;
}

const AccountSearchContainer: React.FC<AccountSearchContainerProps> = ({ 
  initialSearchTerm = '',
  searchType,
  onSearchTypeChange
}) => {
  const [, setSearchParams] = useSearchParams();
  
  // ✅ 로그인 상태 확인
  const { isLoggedIn } = useContext(AuthContext);
  
  const {
    accounts,
    loading,
    error,
    searchTerm,
    currentPage,
    totalPages,
    handleSearch: originalHandleSearch,
    handlePageChange
  } = useAccountSearch();

  // 최근 검색어 저장을 포함한 검색 핸들러
  const handleSearch = useCallback(async (term: string) => {
    originalHandleSearch(term);
    
    // URL 업데이트
    if (term.trim()) {
      setSearchParams({ q: term });
    } else {
      setSearchParams({});
    }
    
    // ✅ 로그인한 사용자만 최근 검색어 저장
    if (term.trim() && isLoggedIn) {
      try {
        await saveRecentSearch(term, 'ACCOUNT');
      } catch (error) {
        console.error('최근 검색어 저장 실패:', error);
        // 에러가 발생해도 검색은 계속 진행
      }
    }
  }, [originalHandleSearch, setSearchParams, isLoggedIn]);

  // 검색어 입력 상태 관리
  const [inputValue, setInputValue] = useState(searchTerm);

  // 검색어가 변경될 때 입력값 동기화
  React.useEffect(() => {
    setInputValue(searchTerm);
  }, [searchTerm]);

  // 엔터키 검색 핸들러
  const handleKeyPress = useCallback(async (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && inputValue.trim()) {
      handleSearch(inputValue.trim());
    }
  }, [inputValue, handleSearch]);

  // 입력값 변경 핸들러 (검색하지 않음)
  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);
  }, []);

  // 초기화 버튼 핸들러
  const handleClearAll = useCallback(() => {
    setInputValue('');
    handleSearch('');
  }, [handleSearch]);

  // 초기 검색어 설정
  React.useEffect(() => {
    if (initialSearchTerm && initialSearchTerm !== searchTerm) {
      handleSearch(initialSearchTerm);
    }
  }, [initialSearchTerm, handleSearch, searchTerm]);

  return (
    <div className="min-h-screen bg-white">
      {/* 검색바와 타입 전환 */}
      <div className="bg-white border-b border-gray-200 px-4 py-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-2xl font-bold text-gray-900">계정 검색</h1>
            <SearchTypeDropdown
              value={searchType}
              onChange={onSearchTypeChange}
            />
          </div>
          
          {/* 검색바 */}
          <div className="flex items-center space-x-4">
            <div className="flex-1 relative">
              <input
                type="text"
                value={inputValue}
                onChange={handleInputChange}
                onKeyPress={handleKeyPress}
                placeholder="계정 검색 (닉네임, 소개, 스킬, 포지션, 관심사) - 엔터키로 검색"
                className="w-full px-4 py-3 pl-12 pr-12 rounded-lg outline-none border-0 ring-1 ring-gray-300 focus:ring-2 focus:ring-green-500 focus:ring-offset-0"
              />
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              {/* X 버튼 */}
              {inputValue && (
                <button
                  onClick={() => {
                    setInputValue('');
                    handleSearch('');
                  }}
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                  type="button"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>
            {/* 검색 버튼 - 검색바 바로 옆 */}
            <button
              onClick={() => handleSearch(inputValue.trim())}
              disabled={!inputValue.trim()}
              className="h-[48px] min-w-[120px] px-4 rounded-lg bg-green-500 text-white hover:bg-green-600 transition-colors whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              <span className="leading-none">검색</span>
              <Search className="w-4 h-4 flex-shrink-0" />
            </button>
            {/* 초기화 버튼 - 검색바 바로 옆 */}
            <button
              onClick={handleClearAll}
              className="h-[48px] min-w-[120px] px-4 rounded-lg border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 transition-colors whitespace-nowrap flex items-center justify-center gap-2"
            >
              <span className="leading-none">초기화</span>
              <RotateCcw className="w-4 h-4 flex-shrink-0" />
            </button>
          </div>
        </div>
      </div>

      {/* 검색 결과 */}
      <div className="max-w-7xl mx-auto px-4 py-8 pb-32">
        {/* 검색 결과 영역 */}
        <AccountCardGrid
          accounts={accounts}
          searchTerm={searchTerm}
          loading={loading}
          error={error}
        />

        {/* 페이지네이션 - 로딩 중이 아닐 때만 표시 */}
        {!loading && totalPages > 1 && (
          <div className="mt-8">
            <ProjectPagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={handlePageChange}
            />
          </div>
        )}

      </div>
    </div>
  );
};

export default AccountSearchContainer;
