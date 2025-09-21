//MainPage.tsx
import React, { useState } from 'react';
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

  const [tempSelectedSort, setTempSelectedSort] = useState(selectedSort);
  const [tempSelectedUploadTime, setTempSelectedUploadTime] = useState(selectedUploadTime);

  const handleOpenSortModal = () => {
    setTempSelectedSort(selectedSort);
    setTempSelectedUploadTime(selectedUploadTime);
    setIsSortModalOpen(true);
  };

  const handleCloseSortModal = () => setIsSortModalOpen(false);

  const handleApplySortModal = () => {
    setSelectedSort(tempSelectedSort);
    setSelectedUploadTime(tempSelectedUploadTime);
    setIsSortModalOpen(false);
  };

  // 업로드 시간 필터 함수
  const filterByUploadTime = (project: Project) => {
    const now = new Date();
    const uploadDate = new Date(project.uploadDate || '2025-01-01');
    const diffHours = (now.getTime() - uploadDate.getTime()) / (1000 * 60 * 60);

    switch (selectedUploadTime) {
      case '최근 24시간':
        return diffHours <= 24;
      case '최근 일주일':
        return diffHours <= 24 * 7;
      case '최근 한달':
        return diffHours <= 24 * 30;
      case '최근 세달':
        return diffHours <= 24 * 90;
      default:
        return true;
    }
  };

  // 카테고리 + 업로드 시간 필터 적용
  const filteredProjects: Project[] = dummyProjects.filter((project) => {
    const matchesCategory =
      selectedCategory === '전체' || project.categories?.includes(selectedCategory);
    const matchesUploadTime = filterByUploadTime(project);
    return matchesCategory && matchesUploadTime;
  });

  // 정렬 로직 적용
  const sortedProjects = [...filteredProjects].sort((a, b) => {
    if (selectedSort === '최신순') {
      return new Date(b.uploadDate || '2025-01-01').getTime() - new Date(a.uploadDate || '2025-01-01').getTime();
    }
    if (selectedSort === '추천순') {
      return (b.likes || 0) - (a.likes || 0);
    }
    if (selectedSort === '샌드위치 픽') {
      const scoreA = (a.likes || 0) * 2 + (a.comments || 0) * 1.5 + (a.views || 0) * 0.5;
      const scoreB = (b.likes || 0) * 2 + (b.comments || 0) * 1.5 + (b.views || 0) * 0.5;
      return scoreB - scoreA;
    }
    return 0;
  });

  return (
    <div className="min-h-screen">
       <main className="px-8 py-6">
        <MainHeroSection projects={dummyProjects.slice(0, 7)} />

         <div className="mb-10">
            <MainCategoryFilter
              selectedCategory={selectedCategory}
              onSelectCategory={setSelectedCategory}
              onOpenSortModal={handleOpenSortModal}
            />
         </div>

        {sortedProjects.length === 0 ? (
          <div className="text-center text-gray-500 py-[50px] text-lg">
            해당 조건에 맞는 프로젝트가 없어요 😥<br />
            필터를 변경해 다시 시도해보세요!
          </div>
        ) : (
          <>
            <MainProjectGrid
              title={`"${selectedCategory}" 카테고리 프로젝트`}
              projects={sortedProjects.slice(0, 10)}
            />

            <MainDeveloperHighlight projects={sortedProjects} />

            {sortedProjects.length > 10 && (
              <MainProjectGrid
                title="계속해서 프로젝트를 살펴보세요!"
                projects={sortedProjects.slice(10)}
              />
            )}
          </>
        )}

        {isSortModalOpen && (
          <SortModal
            isOpen={isSortModalOpen}
            onClose={handleCloseSortModal}
            selectedSort={tempSelectedSort}
            setSelectedSort={setTempSelectedSort}
            selectedUploadTime={tempSelectedUploadTime}
            setSelectedUploadTime={setTempSelectedUploadTime}
            onApply={handleApplySortModal}
          />
        )}
      </main>
    </div>
  );
};

export default MainPage;

