// 빈 상태 표시 컴포넌트
import React from 'react';

interface EmptyStateProps {
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  icon?: React.ReactNode;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title,
  description,
  actionLabel,
  onAction,
  icon
}) => {
  return (
    <div className="flex flex-col items-center justify-center py-12 md:py-20 text-center px-4">
      {/* 아이콘 */}
      {icon && (
        <div className="mb-3 md:mb-4 text-gray-400 dark:text-white/70">
          {icon}
        </div>
      )}

      {/* 제목 */}
      <h3 className="text-base md:text-xl font-semibold text-gray-900 dark:text-white mb-2">
        {title}
      </h3>

      {/* 설명 */}
      <p className="text-xs md:text-base text-gray-600 dark:text-white/70 mb-4 md:mb-6 max-w-md">
        {description}
      </p>

      {/* 액션 버튼 */}
      {actionLabel && onAction && (
        <button
          onClick={onAction}
          className="px-4 md:px-6 py-2 md:py-3 text-sm md:text-base bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
};

export default EmptyState;
