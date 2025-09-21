import React from 'react';
import AccountCardGrid from './AccountCardGrid';
import { useAccountSearch } from '../../hooks/useAccountSearch';
import { ProjectPagination } from '../ProjectFeed/ProjectPagination';
import { Search } from 'lucide-react';
import { SearchTypeDropdown } from '../ProjectFeed/SearchTypeDropdown';

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
  const {
    accounts,
    loading,
    error,
    searchTerm,
    currentPage,
    totalPages,
    handleSearch,
    handlePageChange
  } = useAccountSearch();

  // 초기 검색어 설정
  React.useEffect(() => {
    if (initialSearchTerm) {
      handleSearch(initialSearchTerm);
    }
  }, [initialSearchTerm, handleSearch]);

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
                value={searchTerm}
                onChange={(e) => handleSearch(e.target.value)}
                placeholder="계정 검색 (닉네임, 소개, 스킬, 포지션, 관심사)"
                className="w-full px-4 py-3 pl-12 pr-12 rounded-lg outline-none border-0 ring-1 ring-gray-300 focus:ring-2 focus:ring-green-500 focus:ring-offset-0"
              />
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              {/* X 버튼 */}
              {searchTerm && (
                <button
                  onClick={() => handleSearch('')}
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                  type="button"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 검색 결과 */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* 검색 결과 영역 */}
        <AccountCardGrid
          accounts={accounts}
          searchTerm={searchTerm}
          loading={loading}
          error={error}
        />

        {/* 페이지네이션 */}
        {totalPages > 1 && (
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
