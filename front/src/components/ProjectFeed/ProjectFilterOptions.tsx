// 프로젝트 필터 옵션 컴포넌트
import React from 'react';
import { ProjectFeedParams } from '../../api/projects';

interface ProjectFilterOptionsProps {
  filters: ProjectFeedParams;
  onFiltersChange: (filters: ProjectFeedParams) => void;
  onClearFilters: () => void;
  onClearSearch: () => void;
  totalElements: number;
}

export const ProjectFilterOptions: React.FC<ProjectFilterOptionsProps> = ({
  filters,
  onFiltersChange,
  onClearFilters,
  onClearSearch,
  totalElements
}) => {
  // 정렬 방식은 드롭다운으로 이동됨

  // 업로드 기간 옵션
  const timeOptions = [
    { value: undefined, label: '전체기간' },
    { value: '24h', label: '최근 24시간' },
    { value: '7d', label: '최근 일주일' },
    { value: '1m', label: '최근 한달' },
    { value: '3m', label: '최근 세달' }
  ];

  // 정렬 방식은 드롭다운으로 이동됨

  // 업로드 기간 변경
  const handleTimeChange = (uploadedWithin: string | undefined) => {
    onFiltersChange({ ...filters, uploadedWithin: uploadedWithin as any });
  };

  // 팔로우 회원만 토글
  const handleFollowingToggle = () => {
    onFiltersChange({ ...filters, followingOnly: !filters.followingOnly });
  };

  return (
    <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-3 sm:gap-4">
      {/* 팔로우 회원만 */}
      <button
        onClick={handleFollowingToggle}
        className={`px-3 py-1.5 sm:py-1 rounded-full text-xs sm:text-sm font-medium transition-colors ${
          filters.followingOnly
            ? 'bg-green-500 text-white'
            : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-white/10 dark:text-white dark:hover:bg-white/20'
        }`}
      >
        팔로우 회원만
      </button>

      {/* 업로드 시간 */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
        <span className="text-xs sm:text-sm font-medium text-gray-700 dark:text-white">업로드 시간:</span>
        <div className="flex flex-wrap gap-1.5 sm:gap-1">
          {timeOptions.map((option) => (
            <button
              key={option.value || 'all'}
              onClick={() => handleTimeChange(option.value)}
              className={`px-2 sm:px-3 py-1 rounded-full text-[11px] sm:text-sm font-medium transition-colors ${
                filters.uploadedWithin === option.value
                  ? 'bg-green-500 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-white/10 dark:text-white dark:hover:bg-white/20'
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      {/* 필터 초기화 */}
      <button
        onClick={onClearSearch}
        className="flex items-center justify-center gap-1 px-2 py-1.5 sm:py-1 text-xs border border-gray-300 dark:border-white/20 text-gray-600 dark:text-white/70 rounded-md hover:bg-gray-50 dark:hover:bg-white/10 transition-colors"
      >
        <svg 
          className="w-3 h-3" 
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            strokeWidth={2} 
            d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" 
          />
        </svg>
        초기화
      </button>
    </div>
  );
};

export default ProjectFilterOptions;
