//전체, Web, App, Game... 필터 버튼 모음
import React, { useState } from 'react';
import { Category } from '../../types/Project';

interface Props {
  selectedCategory: Category | '전체';
  onSelectCategory: (category: Category | '전체') => void;
  onOpenSortModal: () => void;
}

const categories: (Category | '전체')[] = [
  '전체',
  'Web',
  'App',
  'Game',
  'Blockchain',
  'UI/UX',
  'AI/ML',
];

const MainCategoryFilter: React.FC<Props> = ({
  selectedCategory,
  onSelectCategory,
  onOpenSortModal,
}) => {
  return (
    <div className="flex justify-center items-center px-2 md:px-4 py-2">
      <div className="flex items-center gap-3 md:gap-6 lg:gap-12 overflow-x-auto scrollbar-hide">
        {categories.map((category) => (
          <button
            key={category}
            onClick={() => onSelectCategory(category)}
            className={`text-xs md:text-sm lg:text-base font-semibold px-2 md:px-3 lg:px-4 pb-1 transition-all duration-200 whitespace-nowrap ${
              selectedCategory === category
                ? 'text-green-600 dark:text-green-400 border-b-2 border-green-600 dark:border-green-400 font-bold'
                : 'text-black dark:text-gray-200 border-b-2 border-transparent'
            }`}
          >
            {category}
          </button>
        ))}

        {/* 구분선 */}
        <div className="w-px h-4 md:h-5 bg-gray-300 dark:bg-gray-600 mx-2 md:mx-4 flex-shrink-0" />

        {/* 정렬 버튼도 동일한 스타일 적용 */}
        <button
          onClick={onOpenSortModal}
          className="text-xs md:text-sm lg:text-base font-semibold px-2 md:px-3 lg:px-4 pb-1 transition-all duration-200 text-black dark:text-gray-200 hover:text-green-600 dark:hover:text-green-400 whitespace-nowrap flex-shrink-0"
        >
          ↕ 정렬
        </button>
      </div>
      <style>{`
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </div>
  );
};



export default MainCategoryFilter;


