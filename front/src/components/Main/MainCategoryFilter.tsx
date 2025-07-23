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
    <div className="flex justify-center items-center gap-4 px-4 py-2">
      <div className="flex items-center gap-12">
        {categories.map((category) => (
          <button
            key={category}
            onClick={() => onSelectCategory(category)}
            className={`text-base font-semibold px-4 pb-1 transition-all duration-200 ${
              selectedCategory === category
                ? 'text-green-600 border-b-2 border-green-600 font-bold'
                : 'text-black border-b-2 border-transparent'
            }`}
          >
            {category}
          </button>
        ))}

        {/* 구분선 */}
        <div className="w-px h-5 bg-gray-300 mx-4" />

        {/* 정렬 버튼도 동일한 스타일 적용 */}
        <button
          onClick={onOpenSortModal}
          className="text-base font-semibold px-4 pb-1 transition-all duration-200 text-black hover:text-green-600"
        >
          ↕ 정렬
        </button>
      </div>
    </div>
  );
};

export default MainCategoryFilter;
