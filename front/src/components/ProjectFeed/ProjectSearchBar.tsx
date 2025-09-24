// 프로젝트 검색바 컴포넌트
import React, { useState, useCallback, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Search } from 'lucide-react';
import { SearchTypeDropdown } from './SearchTypeDropdown';
import { SortDropdown } from './SortDropdown';
import { saveRecentSearch } from '../../api/recentSearch';

interface ProjectSearchBarProps {
  onSearch: (query: string) => void;
  currentQuery: string;
  isLoading: boolean;
  searchType: 'PORTFOLIO' | 'ACCOUNT';
  onSearchTypeChange: (type: 'PORTFOLIO' | 'ACCOUNT') => void;
  sortType: 'latest' | 'popular' | 'recommended';
  onSortChange: (sort: 'latest' | 'popular' | 'recommended') => void;
}

export const ProjectSearchBar: React.FC<ProjectSearchBarProps> = ({
  onSearch,
  currentQuery,
  isLoading,
  searchType,
  onSearchTypeChange,
  sortType,
  onSortChange
}) => {
  const [searchParams] = useSearchParams();
  const [searchQuery, setSearchQuery] = useState(currentQuery);

  // URL 파라미터에서 검색어 읽기
  useEffect(() => {
    const q = searchParams.get('q');
    if (q) {
      setSearchQuery(q);
    }
  }, [searchParams]);

  // Enter 키 처리 (검색 실행)
  const handleKeyPress = useCallback(async (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && searchQuery.trim()) {
      onSearch(searchQuery.trim());
      
      // 최근 검색어 저장
      try {
        await saveRecentSearch(searchQuery.trim(), 'PORTFOLIO');
      } catch (error) {
        console.error('최근 검색어 저장 실패:', error);
        // 에러가 발생해도 검색은 계속 진행
      }
    }
  }, [searchQuery, onSearch]);

  // 검색어 변경
  const handleQueryChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  }, []);

  // 검색어 초기화
  const handleClearSearch = useCallback(() => {
    setSearchQuery('');
    onSearch('');
    // URL도 업데이트
    window.history.pushState({}, '', '/search');
  }, [onSearch]);

  // 검색 타입 변경은 props로 받은 함수 사용

  return (
    <div className="flex items-center gap-4 mb-6">
      {/* 검색 입력창 */}
      <div className="flex-1 relative">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            value={searchQuery}
            onChange={handleQueryChange}
            onKeyPress={handleKeyPress}
            placeholder="프로젝트를 검색해보세요..."
            className="w-full pl-10 pr-12 py-3 rounded-lg outline-none border-0 ring-1 ring-gray-300 focus:ring-2 focus:ring-green-500 focus:ring-offset-0"
            disabled={false}
          />
          {/* X 버튼 */}
          {searchQuery && (
            <button
              onClick={handleClearSearch}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
              type="button"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* 검색 타입 드롭다운 */}
      <SearchTypeDropdown
        value={searchType}
        onChange={onSearchTypeChange}
      />

      {/* 정렬 드롭다운 */}
      <SortDropdown
        value={sortType}
        onChange={onSortChange}
      />
    </div>
  );
};

export default ProjectSearchBar;
