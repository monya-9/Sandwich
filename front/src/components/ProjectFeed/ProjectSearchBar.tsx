// 프로젝트 검색바 컴포넌트
import React, { useState, useCallback, useEffect, useContext } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Search } from 'lucide-react';
import { SearchTypeDropdown } from './SearchTypeDropdown';
import { SortDropdown } from './SortDropdown';
import { useRecentSearches } from '../../hooks/useRecentSearches';
import { AuthContext } from '../../context/AuthContext';

interface ProjectSearchBarProps {
  onSearch: (query: string) => void;
  currentQuery: string;
  isLoading: boolean;
  searchType: 'PORTFOLIO' | 'ACCOUNT';
  onSearchTypeChange: (type: 'PORTFOLIO' | 'ACCOUNT') => void;
  sortType: 'latest' | 'popular' | 'recommended';
  onSortChange: (sort: 'latest' | 'popular' | 'recommended') => void;
  onClearSearch: () => void;
}

export const ProjectSearchBar: React.FC<ProjectSearchBarProps> = ({
  onSearch,
  currentQuery,
  isLoading,
  searchType,
  onSearchTypeChange,
  sortType,
  onSortChange,
  onClearSearch
}) => {
  const [searchParams] = useSearchParams();
  const [searchQuery, setSearchQuery] = useState(currentQuery);
  
  // ✅ 로그인 상태 확인
  const { isLoggedIn } = useContext(AuthContext);
  
  // 최근 검색어 훅 사용
  const { saveSearch } = useRecentSearches();

  // URL 파라미터에서 검색어 읽기
  useEffect(() => {
    const q = searchParams.get('q');
    if (q) {
      setSearchQuery(q);
    }
  }, [searchParams]);

  // currentQuery prop이 변경될 때 내부 상태 업데이트
  useEffect(() => {
    setSearchQuery(currentQuery);
  }, [currentQuery]);

  // Enter 키 처리 (검색 실행)
  const handleKeyPress = useCallback(async (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && searchQuery.trim()) {
      onSearch(searchQuery.trim());
      
      // URL 업데이트
      window.history.pushState({}, '', `/search?q=${encodeURIComponent(searchQuery.trim())}`);
      
      // ✅ 로그인한 사용자만 최근 검색어 저장
      if (isLoggedIn) {
        try {
          await saveSearch(searchQuery.trim(), 'PORTFOLIO');
        } catch (error) {
          console.error('최근 검색어 저장 실패:', error);
          // 에러가 발생해도 검색은 계속 진행
        }
      }
    }
  }, [searchQuery, onSearch, isLoggedIn, saveSearch]);

  // 검색어 변경
  const handleQueryChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  }, []);

  // 검색어 초기화
  const handleClearSearch = useCallback(() => {
    setSearchQuery('');
    onClearSearch(); // 부모 컴포넌트의 초기화 함수 호출
  }, [onClearSearch]);

  // 검색 타입 변경은 props로 받은 함수 사용

  return (
    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-4 mb-3 sm:mb-6">
      {/* 검색 입력창 */}
      <div className="flex-1 relative">
        <div className="relative">
          <Search className="absolute left-2 sm:left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-white/70 w-4 h-4 sm:w-5 sm:h-5" />
          <input
            type="text"
            value={searchQuery}
            onChange={handleQueryChange}
            onKeyPress={handleKeyPress}
            placeholder="프로젝트를 검색해보세요..."
            className="w-full pl-8 sm:pl-10 pr-10 sm:pr-12 py-2 sm:py-3 text-sm sm:text-base rounded-lg outline-none border-0 ring-1 ring-gray-300 dark:ring-white/20 bg-white dark:bg-black text-black dark:text-white placeholder:text-gray-400 dark:placeholder:text-white/70 focus:ring-2 focus:ring-green-500 focus:ring-offset-0"
            disabled={false}
          />
          {/* X 버튼 */}
          {searchQuery && (
            <button
              onClick={handleClearSearch}
              className="absolute right-2 sm:right-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-white/70 hover:text-gray-600 dark:hover:text-white transition-colors"
              type="button"
            >
              <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* 드롭다운 그룹 */}
      <div className="flex items-center gap-2 sm:gap-4">
        {/* 검색 타입 드롭다운 */}
        <div className="flex-1 sm:flex-initial">
          <SearchTypeDropdown
            value={searchType}
            onChange={onSearchTypeChange}
          />
        </div>

        {/* 정렬 드롭다운 */}
        <div className="flex-1 sm:flex-initial">
          <SortDropdown
            value={sortType}
            onChange={onSortChange}
          />
        </div>
      </div>
    </div>
  );
};

export default ProjectSearchBar;
