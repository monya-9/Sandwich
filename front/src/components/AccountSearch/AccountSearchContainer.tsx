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
    totalElements,
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
                className="w-full px-4 py-3 pl-12 pr-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
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

        {/* 검색 결과 요약 */}
        {totalElements > 0 && (
          <div className="mt-6 text-center text-sm text-gray-600">
            총 {totalElements}개의 계정 중 {currentPage + 1}페이지 ({accounts.length}개 표시)
          </div>
        )}
      </div>
    </div>
  );
};

export default AccountSearchContainer;
