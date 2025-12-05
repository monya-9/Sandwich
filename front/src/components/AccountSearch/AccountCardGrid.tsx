import React from 'react';
import AccountCard from './AccountCard';
import { AccountSearchResult } from '../../api/accounts';
import { LoadingSpinner } from '../common/LoadingSpinner';
import { EmptyState } from '../common/EmptyState';

interface AccountCardGridProps {
  accounts: AccountSearchResult[];
  searchTerm: string;
  loading: boolean;
  error: string | null;
  currentPage: number; // ✅ 현재 페이지 추가
  totalElements: number; // ✅ 전체 계정 수 추가
}

const AccountCardGrid: React.FC<AccountCardGridProps> = ({ 
  accounts, 
  searchTerm, 
  loading,
  error,
  currentPage,
  totalElements
}) => {
  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <LoadingSpinner />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <div className="text-red-600 mb-2">검색 중 오류가 발생했습니다</div>
        <div className="text-gray-500 text-sm">{error}</div>
      </div>
    );
  }

  if (accounts.length === 0) {
    return (
      <EmptyState
        title="검색 결과가 없습니다"
        description={`'${searchTerm}'에 대한 계정을 찾을 수 없습니다.`}
        icon="👤"
      />
    );
  }

  return (
    <div className="space-y-4 md:space-y-8">
      {/* 검색 결과 헤더 - 스크린샷과 동일한 스타일 */}
      <div className="text-center px-4">
        <h2 className="text-sm md:text-2xl font-bold text-gray-900 dark:text-white mb-1 md:mb-2">
          {searchTerm ? 
            `'${searchTerm}'에 대한 검색 결과` : 
            currentPage === 0 ? '전체 계정' : null
          }
        </h2>
        <p className="text-xs md:text-lg text-gray-600 dark:text-white/70">
          {searchTerm ? 
            `${accounts.length}명의 계정을 발견하였습니다.` : 
            currentPage === 0 ? 
              `총 ${totalElements}명의 계정이 있습니다.` : 
              null
          }
        </p>
      </div>

      {/* 계정 카드 그리드 - 모바일 반응형: 1개 → 2개 → 3개 → 4개 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3 md:gap-6 w-full max-w-none">
        {accounts.map((account) => (
          <AccountCard
            key={account.id}
            account={account}
            searchTerm={searchTerm}
          />
        ))}
      </div>
    </div>
  );
};

export default AccountCardGrid;
