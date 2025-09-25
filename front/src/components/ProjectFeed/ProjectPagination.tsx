// 프로젝트 페이지네이션 컴포넌트
import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface ProjectPaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

export const ProjectPagination: React.FC<ProjectPaginationProps> = ({
  currentPage,
  totalPages,
  onPageChange
}) => {
  // 페이지 번호 생성 (1~5까지만 표시)
  const getPageNumbers = () => {
    const pages = [];
    const maxVisiblePages = 5;
    
    // 항상 1~5까지만 표시
    for (let i = 0; i < Math.min(maxVisiblePages, totalPages); i++) {
      pages.push(i);
    }
    
    return pages;
  };

  const pageNumbers = getPageNumbers();

  // 이전 페이지로 이동
  const handlePrevPage = () => {
    if (currentPage > 0) {
      onPageChange(currentPage - 1);
    }
  };

  // 다음 페이지로 이동
  const handleNextPage = () => {
    if (currentPage < totalPages - 1) {
      onPageChange(currentPage + 1);
    }
  };

  // 특정 페이지로 이동
  const handlePageClick = (page: number) => {
    onPageChange(page);
  };

  // 페이지네이션이 필요없는 경우
  if (totalPages <= 1) {
    return null;
  }

  return (
    <div className="flex items-center justify-center gap-2 mt-8">
      {/* 이전 버튼 */}
      <button
        onClick={handlePrevPage}
        disabled={currentPage === 0}
        className="flex items-center gap-1 px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        <ChevronLeft className="w-4 h-4" />
        <span>이전</span>
      </button>

      {/* 페이지 번호들 */}
      <div className="flex items-center gap-1">
        {pageNumbers.map((page) => (
          <button
            key={page}
            onClick={() => handlePageClick(page)}
            disabled={page > 0} // 2,3,4,5 페이지 비활성화
            className={`px-3 py-2 rounded-lg transition-colors ${
              currentPage === page
                ? 'bg-green-500 text-white rounded-full w-8 h-8 flex items-center justify-center' // 동그라미 모양
                : page > 0 
                  ? 'text-gray-400 cursor-not-allowed' // 비활성화된 페이지
                  : 'hover:bg-gray-50' // 활성화된 페이지 (1페이지만)
            }`}
          >
            {page + 1}
          </button>
        ))}
      </div>

      {/* 다음 버튼 */}
      <button
        onClick={handleNextPage}
        disabled={true} // 다음 버튼 비활성화
        className="flex items-center gap-1 px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        <span>다음</span>
        <ChevronRight className="w-4 h-4" />
      </button>
    </div>
  );
};

export default ProjectPagination;
