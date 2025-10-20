// src/components/home/MainHeroSection.tsx
import React, { useRef, useState, useEffect } from 'react';
import type { Project } from '../../types/Project';
import { resolveCover, swapJpgPng } from '../../utils/getProjectCover';
import { Link } from 'react-router-dom';
import { fetchWeeklyTop } from '../../api/reco';
import { fetchProjectFeed } from '../../api/projects';
import { fetchProjectDetail } from '../../api/projectApi';

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
    0: { to: '/other-project/25/128'}, // index 0 → 첫 카드
} as const;

const WEEKLY_CACHE_KEY = 'cache:weeklyTopProjects:v1';
const OVERRIDE_META_CACHE_KEY = 'cache:heroOverrideMeta:v1';

const MainHeroSection = ({ projects }: { projects: Project[] }) => {
    const scrollRef = useRef<HTMLDivElement>(null);
    const [scrollPosition, setScrollPosition] = useState(0);
    const [showFakeScroll, setShowFakeScroll] = useState(false);
    const [isAtStart, setIsAtStart] = useState(true);
    const [isAtEnd, setIsAtEnd] = useState(false);
    const timeoutRef = useRef<NodeJS.Timeout | null>(null);

    // 주간 TOP 프로젝트 (로그인 여부 무관, 준비되면 우선 사용)
    const [weeklyTopProjects, setWeeklyTopProjects] = useState<Project[] | null>(() => {
        try {
            const raw = sessionStorage.getItem(WEEKLY_CACHE_KEY);
            if (!raw) return null;
            const arr = JSON.parse(raw);
            return Array.isArray(arr) && arr.length > 0 ? arr as Project[] : null;
        } catch { return null; }
    });

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
    };

    useEffect(() => {
        const el = scrollRef.current;
        if (!el) return;
        el.addEventListener('scroll', handleScroll);
        return () => el.removeEventListener('scroll', handleScroll);
    }, [handleScroll]);

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
                const items = await fetchWeeklyTop();
                if (!items || items.length === 0) return;

                // 점수 높은 순으로 정렬 후 상단 N개만 선택
                const sorted = [...items].sort((a, b) => b.score - a.score);
                const topIds = sorted.map(i => i.project_id).slice(0, 50);

                // 피드에서 스캔하여 해당 ID들에 매칭되는 프로젝트 회수
                const mapped = await findProjectsByIdsViaFeed(topIds, 10, 100);

                if (isMounted && mapped.length > 0) {
                    setWeeklyTopProjects(mapped);
                    try { sessionStorage.setItem(WEEKLY_CACHE_KEY, JSON.stringify(mapped)); } catch {}
                }
            } catch {
                // 실패 시 무시하고 기존 캐시/props 사용
            }
        })();
        return () => { isMounted = false; };
    }, []);

    // 오버라이드 카드 상세 정보 불러오기: /other-project/{ownerId}/{projectId} (결과 캐시)
    useEffect(() => {
        const entries = Object.entries(HERO_OVERRIDES as any) as Array<[string, { to?: string }]>;
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
        ? weeklyTopProjects.slice(0, 7)
        : projects.slice(0, 7);

    return (
        <section className="w-full relative mb-10 py-[20px]">
            <h1 className="text-2xl font-bold mb-4 text-left ml-[15px] text-black dark:text-white">이번 주 인기 프로젝트</h1>

            <button
                onClick={scrollLeft}
                className="absolute left-0 w-[50px] h-[50px] rounded-full shadow-md flex items-center justify-center z-10 mt-[15px] bg-white dark:bg-black"
                style={{ top: '140px' }}
                aria-label="왼쪽으로 스크롤"
            >
                <span className="text-xl rotate-180 text-black dark:text-white" style={{ opacity: isAtStart ? 0.4 : 1 }}>{'>'}</span>
            </button>

            <button
                onClick={scrollRight}
                className="absolute right-0 w-[50px] h-[50px] rounded-full shadow-md flex items-center justify-center z-10 mt-[15px] bg-white dark:bg-black"
                style={{ top: '140px' }}
                aria-label="오른쪽으로 스크롤"
            >
                <span className="text-xl text-black dark:text-white" style={{ opacity: isAtEnd ? 0.4 : 1 }}>{'>'}</span>
            </button>

            {/* 프로젝트 카드 리스트 */}
            <div
                ref={scrollRef}
                className="custom-scrollbar flex gap-4 px-4 py-2 mt-[10px] relative"
                style={{ scrollSnapType: 'x mandatory', overflowX: 'auto', scrollbarWidth: 'none', msOverflowStyle: 'none' }}
            >
                {displayProjects.map((project, idx) => {
                    const override = (HERO_OVERRIDES as any)[idx] as { to?: string; image?: string } | undefined;
                    const meta = overrideMeta[idx] || {};
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
                            className="group relative min-w-[300px] h-[220px] rounded-2xl overflow-hidden flex-shrink-0 bg-gray-200 scroll-snap-align-start cursor-pointer"
                        >
                            <CoverImage initialSrc={initialSrc} title={displayTitle} />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-black/10 to-transparent opacity-90 group-hover:opacity-100 transition-opacity" />
                            <p className="absolute bottom-0 left-0 right-0 p-4 text-white text-sm font-semibold line-clamp-1">
                                {displayTitle}
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
