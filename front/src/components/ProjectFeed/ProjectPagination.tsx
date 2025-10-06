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
  // 페이지 번호 생성 (최대 10개까지 표시)
  const getPageNumbers = () => {
    const pages = [];
    const maxVisiblePages = 10; // ✅ 5에서 10으로 변경
    
    // 현재 페이지 기준으로 앞뒤 페이지 계산
    let startPage = Math.max(0, currentPage - Math.floor(maxVisiblePages / 2));
    let endPage = Math.min(totalPages - 1, startPage + maxVisiblePages - 1);
    
    // 끝 페이지가 조정되면 시작 페이지도 조정
    if (endPage - startPage < maxVisiblePages - 1) {
      startPage = Math.max(0, endPage - maxVisiblePages + 1);
    }
    
    // 페이지 번호 배열 생성
    for (let i = startPage; i <= endPage; i++) {
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
      <div className="flex items-center gap-1 flex-wrap justify-center">
        {pageNumbers.map((page) => (
          <button
            key={page}
            onClick={() => handlePageClick(page)}
            className={`px-2 py-1 text-sm rounded-lg transition-colors ${
              currentPage === page
                ? 'bg-green-500 text-white rounded-full w-7 h-7 flex items-center justify-center' // ✅ 더 작은 동그라미
                : 'hover:bg-gray-50' // 모든 페이지 활성화
            }`}
          >
            {page + 1}
          </button>
        ))}
      </div>

      {/* 다음 버튼 */}
      <button
        onClick={handleNextPage}
        disabled={currentPage >= totalPages - 1} // ✅ 마지막 페이지에서만 비활성화
        className="flex items-center gap-1 px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        <span>다음</span>
        <ChevronRight className="w-4 h-4" />
      </button>
    </div>
  );
};

export default ProjectPagination;
