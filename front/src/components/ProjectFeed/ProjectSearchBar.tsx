// 프로젝트 검색바 컴포넌트
import React, { useState, useCallback } from 'react';
import { Search } from 'lucide-react';
import { SearchTypeDropdown } from './SearchTypeDropdown';
import { SortDropdown } from './SortDropdown';

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
  const [searchQuery, setSearchQuery] = useState(currentQuery);

  // Enter 키 처리 (검색 실행)
  const handleKeyPress = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && searchQuery.trim()) {
      onSearch(searchQuery.trim());
    }
  }, [searchQuery, onSearch]);

  // 검색어 변경
  const handleQueryChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  }, []);

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
            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
            disabled={isLoading}
          />
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
