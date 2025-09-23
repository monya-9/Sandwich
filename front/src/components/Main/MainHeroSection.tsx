// src/components/home/MainHeroSection.tsx
import React, { useRef, useState, useEffect } from 'react';
import type { Project } from '../../types/Project';
import { resolveCover, swapJpgPng } from '../../utils/getProjectCover';
import { Link } from 'react-router-dom';

/** 이미지 컴포넌트: jpg 실패 시 png로 한번 더 시도 */
function CoverImage({ initialSrc, title }: { initialSrc: string; title: string }) {
    const [src, setSrc] = useState(initialSrc);
    const [triedAltExt, setTriedAltExt] = useState(false);

    return (
        <img
            src={src}
            alt={title}
            loading="lazy"
            className="absolute inset-0 w-full h-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
            onError={(e) => {
                if (!triedAltExt) {
                    setTriedAltExt(true);
                    setSrc(prev => swapJpgPng(prev));
                } else {
                    (e.currentTarget as HTMLImageElement).style.visibility = 'hidden';
                }
            }}
        />
    );
}

/** 첫 번째 카드 오버라이드 설정 */
const HERO_OVERRIDES = {
    0: { to: '/other-project/3/1', image: '/images/projects/19.jpg' }, // index 0 → 첫 카드
} as const;

const MainHeroSection = ({ projects }: { projects: Project[] }) => {
    const scrollRef = useRef<HTMLDivElement>(null);
    const [scrollPosition, setScrollPosition] = useState(0);
    const [showFakeScroll, setShowFakeScroll] = useState(false);
    const [isAtStart, setIsAtStart] = useState(true);
    const [isAtEnd, setIsAtEnd] = useState(false);
    const timeoutRef = useRef<NodeJS.Timeout | null>(null);

    const scrollLeft = () => scrollRef.current?.scrollBy({ left: -300, behavior: 'smooth' });
    const scrollRight = () => scrollRef.current?.scrollBy({ left: 300, behavior: 'smooth' });

    const handleScroll = () => {
        if (!scrollRef.current) return;
        const left = scrollRef.current.scrollLeft;
        const maxLeft = scrollRef.current.scrollWidth - scrollRef.current.clientWidth;
        const percent = maxLeft > 0 ? (left / maxLeft) * 100 : 0;
        setScrollPosition(percent);
        setIsAtStart(left === 0);
        setIsAtEnd(left >= maxLeft);
        if (!showFakeScroll) setShowFakeScroll(true);
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
        timeoutRef.current = setTimeout(() => setShowFakeScroll(false), 5000);
    };

    useEffect(() => {
        const el = scrollRef.current;
        if (!el) return;
        el.addEventListener('scroll', handleScroll);
        return () => el.removeEventListener('scroll', handleScroll);
    }, [handleScroll]);

    return (
        <section className="w-full relative mb-10 py-[20px]">
            <h1 className="text-2xl font-bold mb-4 text-left ml-[15px]">이번 주 인기 프로젝트</h1>

            <button
                onClick={scrollLeft}
                className="absolute left-0 w-[50px] h-[50px] rounded-full shadow-md flex items-center justify-center z-10 mt-[15px] bg-white"
                style={{ top: '140px' }}
                aria-label="왼쪽으로 스크롤"
            >
                <span className="text-xl rotate-180" style={{ color: isAtStart ? '#A2A2A2' : 'black' }}>{'>'}</span>
            </button>

            <button
                onClick={scrollRight}
                className="absolute right-0 w-[50px] h-[50px] rounded-full shadow-md flex items-center justify-center z-10 mt-[15px] bg-white"
                style={{ top: '140px' }}
                aria-label="오른쪽으로 스크롤"
            >
                <span className="text-xl" style={{ color: isAtEnd ? '#A2A2A2' : 'black' }}>{'>'}</span>
            </button>

            {/* 프로젝트 카드 리스트 */}
            <div
                ref={scrollRef}
                className="custom-scrollbar flex gap-4 px-4 py-2 mt-[10px] relative"
                style={{ scrollSnapType: 'x mandatory', overflowX: 'auto', scrollbarWidth: 'none', msOverflowStyle: 'none' }}
            >
                {projects.map((project, idx) => {
                    const override = (HERO_OVERRIDES as any)[idx] as { to?: string; image?: string } | undefined;
                    const initialSrc = override?.image ?? resolveCover(project, { position: idx });

                    // override가 있으면 카드 전체를 Link로 감싼다(스타일 동일)
                    const CardTag: any = override?.to ? Link : 'div';
                    const cardProps = override?.to ? { to: override.to } : {};

                    return (
                        <CardTag
                            key={project.id}
                            {...cardProps}
                            className="group relative min-w-[300px] h-[220px] rounded-2xl overflow-hidden flex-shrink-0 bg-gray-200 scroll-snap-align-start"
                        >
                            <CoverImage initialSrc={initialSrc} title={project.title} />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-black/10 to-transparent opacity-90 group-hover:opacity-100 transition-opacity" />
                            <p className="absolute bottom-0 left-0 right-0 p-4 text-white text-sm font-semibold line-clamp-1">
                                {project.title}
                            </p>
                        </CardTag>
                    );
                })}
            </div>

            {/* 가짜 스크롤바 */}
            <div
                className="w-[60%] h-[6px] bg-transparent rounded-full mx-auto mt-3 relative overflow-hidden"
                style={{ opacity: showFakeScroll ? 1 : 0, transition: 'opacity 0.3s ease-in-out' }}
                aria-hidden
            >
                <div
                    className="h-full rounded-full transition-all duration-300 ease-out"
                    style={{ width: `${scrollPosition}%`, backgroundColor: showFakeScroll ? 'rgba(65, 65, 65, 0.74)' : 'transparent' }}
                />
            </div>
        </section>
    );
};

export default MainHeroSection;
