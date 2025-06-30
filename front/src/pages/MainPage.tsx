import React from 'react';
import Header from '../components/Main/Header';
import MainHeroSection from '../components/Main/MainHeroSection';
import MainCategoryFilter from '../components/Main/MainCategoryFilter';
import MainProjectGrid from '../components/Main/MainProjectGrid';
import MainDeveloperHighlight from '../components/Main/MainDeveloperHighlight';

const MainPage = () => {
    return (
        <div className="bg-gray-100 min-h-screen">
          <Header />
          <main className="px-8 py-6">
            <MainHeroSection
              projects={[
                { id: 1, title: '프로젝트 1', author: '홍길동', likes: 5, views: 100, comments: 2 },
                { id: 2, title: '프로젝트 2', author: '이영웅', likes: 3, views: 45, comments: 1 },
                { id: 3, title: '프로젝트 3', author: '이영웅', likes: 3, views: 45, comments: 1 },
                { id: 4, title: '프로젝트 4', author: '이영웅', likes: 3, views: 45, comments: 1 },
                { id: 5, title: '프로젝트 5', author: '이영웅', likes: 3, views: 45, comments: 1 },
              ]}
            />
            <MainCategoryFilter />
            <MainProjectGrid
              title="이번 주 인기 프로젝트"
              projects={[
                {
                  id: 1,
                  title: '프로젝트 1',
                  author: '홍길동',
                  likes: 10,
                  views: 123,
                  comments: 3,
                },
                {
                  id: 2,
                  title: '프로젝트 2',
                  author: '이몽룡',
                  likes: 5,
                  views: 98,
                  comments: 1,
                },
              ]}
            />
            <MainDeveloperHighlight />
          </main>
        </div>
      );      
};

export default MainPage;
