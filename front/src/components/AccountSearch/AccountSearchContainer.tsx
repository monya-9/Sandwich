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
    totalElements,
    handleSearch: originalHandleSearch,
    handlePageChange
  } = useAccountSearch();

  // 최근 검색어 저장을 포함한 검색 핸들러
  const handleSearch = useCallback(async (term: string) => {
    originalHandleSearch(term);
    
    // URL 업데이트 (계정 검색 전용 라우트)
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
    <div className="min-h-screen bg-white dark:bg-[var(--bg)]">
      {/* 검색바와 타입 전환 */}
      <div className="bg-white dark:bg-[var(--surface)] border-b border-gray-200 dark:border-[var(--border-color)] px-3 md:px-4 py-3 md:py-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-3 md:mb-6">
            <h1 className="text-base md:text-2xl font-bold text-gray-900 dark:text-white">계정 검색</h1>
            <div className="hidden md:block">
              <SearchTypeDropdown
                value={searchType}
                onChange={onSearchTypeChange}
              />
            </div>
          </div>
          
          {/* 검색바 */}
          <div className="flex flex-col md:flex-row items-stretch md:items-center gap-2 md:gap-4">
            {/* 검색 입력창 + 검색 버튼 (모바일에서 같은 줄) */}
            <div className="flex md:flex-1 items-center gap-2">
              <div className="flex-1 relative">
                <input
                  type="text"
                  value={inputValue}
                  onChange={handleInputChange}
                  onKeyPress={handleKeyPress}
                  placeholder="계정을 검색해주세요"
                  className="w-full px-3 md:px-4 py-2 md:py-3 pl-8 md:pl-12 pr-8 md:pr-12 h-[38px] md:h-auto text-xs md:text-base rounded-lg outline-none border-0 ring-1 ring-gray-300 dark:ring-white/20 bg-white dark:bg-black text-black dark:text-white placeholder:text-gray-400 dark:placeholder:text-white/70 focus:ring-2 focus:ring-green-500 focus:ring-offset-0"
                />
                <Search className="absolute left-2 md:left-4 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-white/70 w-4 h-4 md:w-5 md:h-5" />
                {/* X 버튼 */}
                {inputValue && (
                  <button
                    onClick={() => {
                      setInputValue('');
                      handleSearch('');
                    }}
                    className="absolute right-2 md:right-4 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-white/70 hover:text-gray-600 dark:hover:text-white transition-colors"
                    type="button"
                  >
                    <svg className="w-4 h-4 md:w-5 md:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                )}
              </div>
              {/* 검색 버튼 */}
              <button
                onClick={() => handleSearch(inputValue.trim())}
                disabled={!inputValue.trim()}
                className="h-[38px] md:h-[48px] min-w-[70px] md:min-w-[120px] px-2.5 md:px-4 text-xs md:text-base rounded-lg bg-green-500 text-white hover:bg-green-600 transition-colors whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-1 md:gap-2"
              >
                <span className="leading-none">검색</span>
                <Search className="w-3 h-3 md:w-4 md:h-4 flex-shrink-0" />
              </button>
            </div>
            
            {/* 모바일: 드롭다운 + 초기화 한 줄 */}
            <div className="flex md:hidden items-center gap-2">
              <div className="flex-1">
                <SearchTypeDropdown
                  value={searchType}
                  onChange={onSearchTypeChange}
                />
              </div>
              <button
                onClick={handleClearAll}
                className="h-[34px] px-2 py-1.5 rounded-md border border-gray-300 dark:border-[var(--border-color)] bg-white dark:bg-[var(--surface)] text-gray-700 dark:text-white hover:bg-gray-50 dark:hover:bg-white/10 transition-colors whitespace-nowrap flex items-center justify-center gap-0.5 text-[10px]"
              >
                <RotateCcw className="w-2.5 h-2.5 flex-shrink-0" />
                <span className="leading-none">초기화</span>
              </button>
            </div>
            
            {/* 데스크톱: 초기화 버튼 */}
            <button
              onClick={handleClearAll}
              className="hidden md:flex h-[48px] min-w-[120px] px-4 rounded-lg border border-gray-300 dark:border-[var(--border-color)] bg-white dark:bg-[var(--surface)] text-gray-700 dark:text-white hover:bg-gray-50 dark:hover:bg-white/10 transition-colors whitespace-nowrap items-center justify-center gap-2"
            >
              <span className="leading-none">초기화</span>
              <RotateCcw className="w-4 h-4 flex-shrink-0" />
            </button>
          </div>
        </div>
      </div>

      {/* 검색 결과 */}
      <div className="max-w-7xl mx-auto px-3 md:px-4 py-4 md:py-8 pb-24 md:pb-32">
        {/* 검색 결과 영역 */}
        <AccountCardGrid
          accounts={accounts}
          searchTerm={searchTerm}
          loading={loading}
          error={error}
          currentPage={currentPage}
          totalElements={totalElements}
        />

        {/* 페이지네이션 - 로딩 중이 아닐 때만 표시 */}
        {!loading && totalPages > 1 && (
          <div className="mt-8">
            <ProjectPagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={(page: number) => {
                handlePageChange(page);
                // ✅ URL 파라미터 업데이트 (page는 0-based이므로 +1)
                const params = new URLSearchParams();
                if (searchTerm) params.set('q', searchTerm);
                if (page > 0) params.set('page', (page + 1).toString()); // ✅ UI 페이지 번호로 변환
                window.history.pushState({}, '', `/search?${params.toString()}`);
              }}
            />
          </div>
        )}

      </div>
    </div>
  );
};

export default AccountSearchContainer;
