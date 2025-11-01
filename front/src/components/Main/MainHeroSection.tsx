// src/components/home/MainHeroSection.tsx
import React, { useRef, useState, useEffect, useCallback, memo } from 'react';
import type { Project } from '../../types/Project';
import { resolveCover, swapJpgPng } from '../../utils/getProjectCover';
import { Link } from 'react-router-dom';
import { fetchWeeklyTop } from '../../api/reco';
import { fetchProjectFeed } from '../../api/projects';
import { fetchProjectDetail } from '../../api/projectApi';

/** 이미지 컴포넌트: jpg 실패 시 png로 한번 더 시도 */
const CoverImage = memo(({ initialSrc, title }: { initialSrc: string; title: string }) => {
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
});

CoverImage.displayName = 'CoverImage';

/** 첫 번째 카드 오버라이드 설정 */
const HERO_OVERRIDES = {
    // 0: { to: '/other-project/25/128'}, // index 0 → 첫 카드 (고정 해제)
} as const;

const WEEKLY_CACHE_KEY = 'cache:weeklyTopProjects:v1';
const OVERRIDE_META_CACHE_KEY = 'cache:heroOverrideMeta:v1';

const MainHeroSection = memo(({ projects }: { projects: Project[] }) => {
    const scrollRef = useRef<HTMLDivElement>(null);
    const [scrollPosition, setScrollPosition] = useState(0);
    const [showFakeScroll, setShowFakeScroll] = useState(false);
    const [isAtStart, setIsAtStart] = useState(true);
    const [isAtEnd, setIsAtEnd] = useState(false);
    const timeoutRef = useRef<NodeJS.Timeout | null>(null);
    const autoScrollRef = useRef<NodeJS.Timeout | null>(null);
    const [windowWidth, setWindowWidth] = useState(typeof window !== 'undefined' ? window.innerWidth : 1024);
    const [isAutoScrolling, setIsAutoScrolling] = useState(false);
    const [isUserScrolling, setIsUserScrolling] = useState(false);

    // 개발자 도구에서 캐시 삭제를 위한 전역 함수 등록
    useEffect(() => {
        if (typeof window !== 'undefined') {
            (window as any).clearWeeklyTopCache = () => {
                try {
                    sessionStorage.removeItem(WEEKLY_CACHE_KEY);
                    sessionStorage.removeItem(OVERRIDE_META_CACHE_KEY);
                    console.log('✅ 주간 TOP 프로젝트 캐시가 삭제되었습니다. 페이지를 새로고침하세요.');
                } catch (e) {
                    console.error('❌ 캐시 삭제 실패:', e);
                }
            };
        }
    }, []);

    // 주간 TOP 프로젝트 (로그인 여부 무관, 준비되면 우선 사용)
    const [weeklyTopProjects, setWeeklyTopProjects] = useState<Project[] | null>(() => {
        try {
            const raw = sessionStorage.getItem(WEEKLY_CACHE_KEY);
            if (!raw) return null;
            const arr = JSON.parse(raw);
            return Array.isArray(arr) && arr.length > 0 ? arr as Project[] : null;
        } catch { 
            // 캐시 오류 시 캐시 삭제
            try { sessionStorage.removeItem(WEEKLY_CACHE_KEY); } catch {}
            return null; 
        }
    });
    const [isLoadingWeeklyTop, setIsLoadingWeeklyTop] = useState(false);

    // 오버라이드 카드에 표시할 제목/썸네일(cover) 동적 로딩 결과 저장: index -> { title, coverUrl }
    const [overrideMeta, setOverrideMeta] = useState<Record<number, { title?: string; coverUrl?: string }>>(() => {
        try {
            const raw = sessionStorage.getItem(OVERRIDE_META_CACHE_KEY);
            if (!raw) return {};
            const obj = JSON.parse(raw);
            return obj && typeof obj === 'object' ? obj : {};
        } catch { return {}; }
    });

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
        
        // 사용자 스크롤 감지
        if (!isAutoScrolling) {
            setIsUserScrolling(true);
            setTimeout(() => setIsUserScrolling(false), 3000); // 3초 후 자동 스크롤 재개
        }
    };

    useEffect(() => {
        const el = scrollRef.current;
        if (!el) return;
        el.addEventListener('scroll', handleScroll);
        return () => el.removeEventListener('scroll', handleScroll);
    }, [handleScroll]);

    // 화면 크기 변경 감지
    useEffect(() => {
        if (typeof window === 'undefined') return;
        
        const handleResize = () => setWindowWidth(window.innerWidth);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    // 자동 스크롤 애니메이션
    const startAutoScroll = useCallback(() => {
        if (autoScrollRef.current) clearInterval(autoScrollRef.current);
        
        autoScrollRef.current = setInterval(() => {
            const el = scrollRef.current;
            if (!el || isAutoScrolling || isUserScrolling) return;
            
            const cardWidth = windowWidth < 768 ? 280 : windowWidth < 1024 ? 350 : 450;
            const gap = windowWidth < 768 ? 8 : windowWidth < 1024 ? 12 : 16; // gap-2, gap-3, gap-4
            const scrollAmount = cardWidth + gap;
            
            setIsAutoScrolling(true);
            
            // 현재 스크롤 위치 확인
            const currentScroll = el.scrollLeft;
            const maxScroll = el.scrollWidth - el.clientWidth;
            
            // 끝에 도달했으면 처음으로 돌아가기
            if (currentScroll + scrollAmount >= maxScroll - 10) { // 10px 여유를 둠
                el.scrollTo({
                    left: 0,
                    behavior: 'smooth'
                });
            } else {
                el.scrollBy({
                    left: scrollAmount,
                    behavior: 'smooth'
                });
            }
            
            // 애니메이션 완료 후 상태 리셋
            setTimeout(() => {
                setIsAutoScrolling(false);
            }, 1500); // 애니메이션 시간을 조금 더 길게
        }, 4000); // 4초마다 자동 스크롤 (더 여유있게)
    }, [windowWidth, isAutoScrolling, isUserScrolling]);

    // 자동 스크롤 시작/중지
    useEffect(() => {
        const currentProjects = (weeklyTopProjects && weeklyTopProjects.length > 0)
            ? weeklyTopProjects.slice(0, 15)
            : projects.slice(0, 15);
            
        if (currentProjects.length > 1) {
            startAutoScroll();
        }
        
        return () => {
            if (autoScrollRef.current) {
                clearInterval(autoScrollRef.current);
            }
        };
    }, [projects.length, weeklyTopProjects, startAutoScroll]);

    // 피드 페이지를 스캔해서 특정 ID들의 프로젝트를 찾아오는 헬퍼
    async function findProjectsByIdsViaFeed(targetIds: number[], maxPages = 10, pageSize = 100): Promise<Project[]> {
        const found = new Map<number, Project>();
        let page = 0;
        while (page < maxPages && found.size < targetIds.length) {
            try {
                const feed = await fetchProjectFeed({ page, size: pageSize, sort: 'latest' });
                const content = feed.content || [];
                for (const p of content) {
                    if (targetIds.includes(p.id) && !found.has(p.id)) {
                        found.set(p.id, p);
                    }
                }
                if (feed.last) break;
                page += 1;
            } catch {
                break; // 피드 실패 시 중단하고 현재까지 수집분만 사용
            }
        }
        // 주어진 targetIds 순서대로 정렬
        return targetIds.map(id => found.get(id)).filter((p): p is Project => !!p);
    }

    // 주간 TOP 불러와서 실제 프로젝트로 매핑 (결과는 세션 캐시에 저장)
    useEffect(() => {
        let isMounted = true;
        (async () => {
            try {
                setIsLoadingWeeklyTop(true);
                const items = await fetchWeeklyTop();
                if (!items || items.length === 0) {
                    // 데이터가 없으면 캐시도 삭제
                    if (isMounted) {
                        setWeeklyTopProjects(null);
                        try { sessionStorage.removeItem(WEEKLY_CACHE_KEY); } catch {}
                    }
                    return;
                }

                // 점수 높은 순으로 정렬 후 상단 N개만 선택
                const sorted = [...items].sort((a, b) => b.score - a.score);
                const topIds = sorted.map(i => i.project_id).slice(0, 50);

                // 피드에서 스캔하여 해당 ID들에 매칭되는 프로젝트 회수
                const mapped = await findProjectsByIdsViaFeed(topIds, 10, 100);

                if (isMounted) {
                    if (mapped.length > 0) {
                        setWeeklyTopProjects(mapped);
                        try { sessionStorage.setItem(WEEKLY_CACHE_KEY, JSON.stringify(mapped)); } catch {}
                    } else {
                        // 매핑된 프로젝트가 없으면 캐시 삭제
                        setWeeklyTopProjects(null);
                        try { sessionStorage.removeItem(WEEKLY_CACHE_KEY); } catch {}
                    }
                }
            } catch {
                // 실패 시 캐시 삭제하고 일반 프로젝트 사용
                if (isMounted) {
                    setWeeklyTopProjects(null);
                    try { sessionStorage.removeItem(WEEKLY_CACHE_KEY); } catch {}
                }
            } finally {
                if (isMounted) {
                    setIsLoadingWeeklyTop(false);
                }
                isMounted = false;
            }
        })();
        return () => { isMounted = false; };
    }, []);

    // 오버라이드 카드 상세 정보 불러오기: /other-project/{ownerId}/{projectId} (결과 캐시)
    useEffect(() => {
        const entries = Object.entries(HERO_OVERRIDES as any) as Array<[string, { to?: string }]>;
        
        // HERO_OVERRIDES가 비어있으면 캐시 삭제
        if (entries.length === 0) {
            setOverrideMeta({});
            try { sessionStorage.removeItem(OVERRIDE_META_CACHE_KEY); } catch {}
            return;
        }
        
        entries.forEach(async ([idxStr, cfg]) => {
            if (!cfg?.to) return;
            const m = cfg.to.match(/^\/other-project\/(\d+)\/(\d+)$/);
            if (!m) return;
            const ownerId = Number(m[1]);
            const projectId = Number(m[2]);
            try {
                const detail = await fetchProjectDetail(ownerId, projectId);
                const meta = { title: detail?.title, coverUrl: detail?.coverUrl || detail?.qrImageUrl || detail?.image };
                setOverrideMeta(prev => {
                    const next = { ...prev, [Number(idxStr)]: meta };
                    try { sessionStorage.setItem(OVERRIDE_META_CACHE_KEY, JSON.stringify(next)); } catch {}
                    return next;
                });
            } catch {
                // ignore
            }
        });
    }, []);

    // 표시 소스 선택: 주간 TOP 데이터가 준비되면 그것을 우선 사용
    const displayProjects = (weeklyTopProjects && weeklyTopProjects.length > 0)
        ? weeklyTopProjects.slice(0, 15)
        : projects.slice(0, 15);

    // 버튼 위치 계산 (카드 컨테이너 중앙)
    const buttonTop = '50%';

    // 로딩 상태 처리
    if (isLoadingWeeklyTop && (!weeklyTopProjects || weeklyTopProjects.length === 0)) {
        return (
            <section className="w-full relative mb-6 md:mb-8 lg:mb-10 py-3 md:py-4 lg:py-5">
                <h1 className="text-lg md:text-xl lg:text-2xl font-bold mb-3 md:mb-4 text-left ml-3 md:ml-4 lg:ml-[15px] text-black dark:text-white">이번 주 인기 프로젝트</h1>
                <div className="text-center text-gray-500 py-8 md:py-12 lg:py-[50px] text-sm md:text-base lg:text-lg">
                    프로젝트를 불러오는 중입니다…
                </div>
            </section>
        );
    }

    // 데이터가 없을 때
    if (displayProjects.length === 0) {
        return (
            <section className="w-full relative mb-6 md:mb-8 lg:mb-10 py-3 md:py-4 lg:py-5">
                <h1 className="text-lg md:text-xl lg:text-2xl font-bold mb-3 md:mb-4 text-left ml-3 md:ml-4 lg:ml-[15px] text-black dark:text-white">이번 주 인기 프로젝트</h1>
                <div className="text-center text-gray-500 py-8 md:py-12 lg:py-[50px] text-sm md:text-base lg:text-lg">
                    프로젝트를 불러오는 중입니다…
                </div>
            </section>
        );
    }

    return (
        <section className="w-full relative mb-6 md:mb-8 lg:mb-10 py-3 md:py-4 lg:py-5">
            <h1 className="text-lg md:text-xl lg:text-2xl font-bold mb-3 md:mb-4 text-left ml-3 md:ml-4 lg:ml-[15px] text-black dark:text-white">이번 주 인기 프로젝트</h1>

            <button
                onClick={scrollLeft}
                className="absolute left-0 md:left-1 lg:left-0 w-8 h-8 md:w-10 md:h-10 lg:w-[50px] lg:h-[50px] rounded-full shadow-md flex items-center justify-center z-10 bg-white dark:bg-black transform -translate-y-1/2"
                style={{ top: buttonTop }}
                aria-label="왼쪽으로 스크롤"
            >
                <span className="text-base md:text-lg lg:text-xl rotate-180 text-black dark:text-white" style={{ opacity: isAtStart ? 0.4 : 1 }}>{'>'}</span>
            </button>

            <button
                onClick={scrollRight}
                className="absolute right-0 md:right-1 lg:right-0 w-8 h-8 md:w-10 md:h-10 lg:w-[50px] lg:h-[50px] rounded-full shadow-md flex items-center justify-center z-10 bg-white dark:bg-black transform -translate-y-1/2"
                style={{ top: buttonTop }}
                aria-label="오른쪽으로 스크롤"
            >
                <span className="text-base md:text-lg lg:text-xl text-black dark:text-white" style={{ opacity: isAtEnd ? 0.4 : 1 }}>{'>'}</span>
            </button>

            {/* 프로젝트 카드 리스트 */}
            <div
                ref={scrollRef}
                className="custom-scrollbar flex gap-2 md:gap-3 lg:gap-4 px-3 md:px-4 py-2 mt-2 md:mt-[10px] relative"
                style={{ scrollSnapType: 'x mandatory', overflowX: 'auto', scrollbarWidth: 'none', msOverflowStyle: 'none' }}
            >
                {displayProjects.map((project, idx) => {
                    const override = (HERO_OVERRIDES as any)[idx] as { to?: string; image?: string } | undefined;
                    const meta = override ? (overrideMeta[idx] || {}) : {}; // override가 있을 때만 meta 사용
                    const ownerId = (project as any)?.owner?.id || (project as any)?.authorId;
                    const to = override?.to || (ownerId ? `/other-project/${ownerId}/${project.id}` : undefined);
                    const initialSrc = meta.coverUrl || override?.image || (project as any).coverUrl || resolveCover(project, { position: idx });
                    const displayTitle = meta.title || project.title || '프로젝트';

                    const CardTag: any = to ? Link : 'div';
                    const cardProps = to ? { to } : {};

                    return (
                        <CardTag
                            key={project.id}
                            {...cardProps}
                            className="group relative min-w-[280px] md:min-w-[350px] lg:min-w-[450px] aspect-[4/3] rounded-lg md:rounded-xl lg:rounded-2xl overflow-hidden flex-shrink-0 bg-gray-200 scroll-snap-align-start cursor-pointer"
                        >
                            <CoverImage initialSrc={initialSrc} title={displayTitle} />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-black/10 to-transparent opacity-90 group-hover:opacity-100 transition-opacity" />
                            <p className="absolute bottom-0 left-0 right-0 p-2 md:p-3 lg:p-4 text-white text-sm md:text-base lg:text-lg font-semibold line-clamp-1">
                                {displayTitle}
                            </p>
                        </CardTag>
                    );
                })}
            </div>

            {/* 가짜 스크롤바 */}
            <div
                className="w-[70%] md:w-[65%] lg:w-[60%] h-[4px] md:h-[5px] lg:h-[6px] bg-transparent rounded-full mx-auto mt-2 md:mt-2.5 lg:mt-3 relative overflow-hidden"
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
}, (prevProps, nextProps) => {
    // projects 배열이 동일하면 리렌더링 방지
    return prevProps.projects.length === nextProps.projects.length &&
           prevProps.projects.every((p, i) => p.id === nextProps.projects[i]?.id);
});

MainHeroSection.displayName = 'MainHeroSection';

export default MainHeroSection;
