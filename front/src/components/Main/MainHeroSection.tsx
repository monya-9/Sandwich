//헤더 바로 아래 인기 프로젝트
//MainHeroSection.tsx
import React, { useRef, useState, useEffect } from 'react';
import { Project } from '../../types/Project';

const MainHeroSection = ({ projects }: { projects: Project[] }) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [scrollPosition, setScrollPosition] = useState(0);
  const [showFakeScroll, setShowFakeScroll] = useState(false);
  const [isAtStart, setIsAtStart] = useState(true);
  const [isAtEnd, setIsAtEnd] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const scrollLeft = () => {
    scrollRef.current?.scrollBy({ left: -300, behavior: 'smooth' });
  };

  const scrollRight = () => {
    scrollRef.current?.scrollBy({ left: 300, behavior: 'smooth' });
  };

  const handleScroll = () => {
    if (!scrollRef.current) return;
    const scrollLeft = scrollRef.current.scrollLeft;
    const maxScrollLeft = scrollRef.current.scrollWidth - scrollRef.current.clientWidth;
    const percent = (scrollLeft / maxScrollLeft) * 100;
    setScrollPosition(percent);

    setIsAtStart(scrollLeft === 0);
    setIsAtEnd(scrollLeft >= maxScrollLeft);

    if (!showFakeScroll) setShowFakeScroll(true);

    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => {
      setShowFakeScroll(false);
    }, 5000);
  };

  useEffect(() => {
    const current = scrollRef.current;
    if (current) {
      current.addEventListener('scroll', handleScroll);
      return () => current.removeEventListener('scroll', handleScroll);
    }
  }, []);

  return (
    <section className="w-full relative mb-10 py-[20px]">
      <h1 className="text-2xl font-bold mb-4 text-left ml-[15px]">이번 주 인기 프로젝트</h1>

      {/* 좌우 화살표 */}
      <button
        onClick={scrollLeft}
        className="absolute left-0 w-[50px] h-[50px] rounded-full shadow-md flex items-center justify-center z-10 mt-[15px]"
        style={{ top: '140px', backgroundColor: 'white' }}
      >
        <span
          className="text-xl rotate-180"
          style={{ color: isAtStart ? '#A2A2A2' : 'black' }}
        >
          {'>'}
        </span>
      </button>

      <button
        onClick={scrollRight}
        className="absolute right-0 w-[50px] h-[50px] rounded-full shadow-md flex items-center justify-center z-10 mt-[15px]"
        style={{ top: '140px', backgroundColor: 'white' }}
      >
        <span
          className="text-xl"
          style={{ color: isAtEnd ? '#A2A2A2' : 'black' }}
        >
          {'>'}
        </span>
      </button>

      {/* 프로젝트 카드 리스트 */}
      <div
        ref={scrollRef}
        className="custom-scrollbar flex gap-4 px-4 py-2 mt-[10px] relative"
        style={{
          scrollSnapType: 'x mandatory',
          overflowX: 'auto',
          scrollbarWidth: 'none',
          msOverflowStyle: 'none',
        }}
      >
        {projects.map((project) => (
          <div
            key={project.id}
            className="min-w-[300px] h-[220px] bg-gray-200 rounded-2xl flex-shrink-0 scroll-snap-align-start"
          >
            <p className="p-4 font-semibold">{project.title}</p>
          </div>
        ))}
      </div>

      {/* 가짜 스크롤바 */}
      <div
        className="w-[60%] h-[6px] bg-transparent rounded-full mx-auto mt-3 relative overflow-hidden"
        style={{ opacity: showFakeScroll ? 1 : 0, transition: 'opacity 0.3s ease-in-out' }}
      >
        <div
          className="h-full rounded-full transition-all duration-300 ease-out"
          style={{
            width: `${scrollPosition}%`,
            backgroundColor: showFakeScroll ? 'rgba(65, 65, 65, 0.74)' : 'transparent',
          }}
        ></div>
      </div>
    </section>
  );
};

export default MainHeroSection;