import React, { useState } from 'react';
import Header from '../components/Main/Header';
import MainHeroSection from '../components/Main/MainHeroSection';
import MainCategoryFilter from '../components/Main/MainCategoryFilter';
import MainProjectGrid from '../components/Main/MainProjectGrid';
import MainDeveloperHighlight from '../components/Main/MainDeveloperHighlight';
import SortModal from '../components/Main/SortModal';
import { dummyProjects } from '../data/dummyProjects';
import { Project, Category } from '../types/Project';

const MainPage = () => {
  const [selectedCategory, setSelectedCategory] = useState<Category | '전체'>('전체');
  const [isSortModalOpen, setIsSortModalOpen] = useState(false);
  const [selectedSort, setSelectedSort] = useState('샌드위치 픽');
  const [selectedUploadTime, setSelectedUploadTime] = useState('전체기간');

  const handleOpenSortModal = () => setIsSortModalOpen(true);
  const handleCloseSortModal = () => setIsSortModalOpen(false);

  const filteredProjects: Project[] =
    selectedCategory === '전체'
      ? dummyProjects
      : dummyProjects.filter((p) => p.categories.includes(selectedCategory));

  return (
    <div className="min-h-screen">
      <Header />
      <main className="px-8 py-6">
        <MainHeroSection projects={dummyProjects.slice(0, 5)} />
        <MainCategoryFilter
          selectedCategory={selectedCategory}
          onSelectCategory={setSelectedCategory}
          onOpenSortModal={handleOpenSortModal}
        />
        <MainProjectGrid
          title={`"${selectedCategory}" 카테고리 인기 프로젝트`}
          projects={filteredProjects.slice(0, 10)}
        />
        <MainDeveloperHighlight />
        {isSortModalOpen && (
          <SortModal
            isOpen={isSortModalOpen}
            onClose={handleCloseSortModal}
            selectedSort={selectedSort}
            setSelectedSort={setSelectedSort}
            selectedUploadTime={selectedUploadTime}
            setSelectedUploadTime={setSelectedUploadTime}
          />
        )}
      </main>
    </div>
  );
};

export default MainPage;
