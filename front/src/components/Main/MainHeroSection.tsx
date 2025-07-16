// 캐러셀 슬라이드 가장 상단 영역 (이번 주 인기 프로젝트와 좌우 화살표 포함)
import React, { useRef } from 'react';
import { Project } from '../../types/Project';

const MainHeroSection = ({ projects }: { projects: Project[] }) => {
  const scrollRef = useRef<HTMLDivElement>(null);

  const scrollLeft = () => {
    scrollRef.current?.scrollBy({ left: -300, behavior: 'smooth' });
  };

  const scrollRight = () => {
    scrollRef.current?.scrollBy({ left: 300, behavior: 'smooth' });
  };

  return (
    <section className="w-full relative mb-10 py-[20px]">
    <h1 className="text-2xl font-bold mb-4 text-left ml-[15px]">이번 주 인기 프로젝트</h1>

      <button
        onClick={scrollLeft}
        className="absolute left-0 top-1/2 transform -translate-y-1/2 w-[50px] h-[50px] bg-white rounded-full shadow-md flex items-center justify-center z-10 mt-[30px]"
      >
        <span className="text-black text-xl rotate-180">{'>'}</span>
      </button>

      <button
        onClick={scrollRight}
        className="absolute right-0 top-1/2 transform -translate-y-1/2 w-[50px] h-[50px] bg-white rounded-full shadow-md flex items-center justify-center z-10 mt-[30px]"
      >
        <span className="text-black text-xl">{'>'}</span>
      </button>

      <div
        ref={scrollRef}
        className="flex overflow-x-auto no-scrollbar gap-4 px-4 py-2 mt-[8px]"
        style={{ scrollSnapType: 'x mandatory' }}
      >
        {projects.map((project) => (
          <div
            key={project.id}
            className="min-w-[300px] h-[220px] bg-gray-300 rounded-2xl flex-shrink-0 scroll-snap-align-start"
          >
            <p className="p-4 font-semibold">{project.title}</p>
          </div>
        ))}
      </div>
    </section>
  );
};

export default MainHeroSection;
