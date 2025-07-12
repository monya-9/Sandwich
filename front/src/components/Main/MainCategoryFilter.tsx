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

const MainCategoryFilter: React.FC<Props> = ({ selectedCategory, onSelectCategory, onOpenSortModal }) => {
  return (
    <div className="flex justify-center items-center gap-4 px-4 py-2">
      <div className="flex items-center gap-4">
        {categories.map((category) => (
          <button
            key={category}
            onClick={() => onSelectCategory(category)}
            className={`text-base font-semibold px-10 ${
              selectedCategory === category ? 'text-green-600 underline' : 'text-black'
            }`}
          >
            {category}
          </button>
        ))}
        <div className="border-l h-4 mx-2" />
        <button
          onClick={onOpenSortModal}
          className="flex items-center gap-1 text-base text-black font-semibold"
        >
          <span>↕</span> 정렬
        </button>
      </div>
    </div>
  );
};


export default MainCategoryFilter;


