//MainPage.tsx
import React, { useEffect, useMemo, useState, useContext } from 'react';
import MainHeroSection from '../components/Main/MainHeroSection';
import MainProjectGrid from '../components/Main/MainProjectGrid';
import MainDeveloperHighlight from '../components/Main/MainDeveloperHighlight';
import SortModal from '../components/Main/SortModal';
import { Project, Category } from '../types/Project';
import { fetchUserRecommendations } from '../api/reco';
import { fetchProjectFeed, fetchProjectsMeta } from '../api/projects';
import { AuthContext } from '../context/AuthContext';

const MainPage = () => {
  // 로그인 상태 (가장 먼저 가져오기)
  const { isLoggedIn } = useContext(AuthContext);
  
  // 정렬 옵션을 sessionStorage에서 불러오기 (페이지 이동 시에도 유지)
  const selectedCategory: Category | '전체' = '전체'; // 카테고리 필터 제거로 고정
  const [isSortModalOpen, setIsSortModalOpen] = useState(false);
  const [selectedSort, setSelectedSort] = useState(() => {
    try {
      return sessionStorage.getItem('mainPage:selectedSort') || '샌드위치 픽';
    } catch {
      return '샌드위치 픽';
    }
  });
  const [selectedUploadTime, setSelectedUploadTime] = useState(() => {
    try {
      return sessionStorage.getItem('mainPage:selectedUploadTime') || '전체기간';
    } catch {
      return '전체기간';
    }
  });

  const [tempSelectedSort, setTempSelectedSort] = useState(selectedSort);
  const [tempSelectedUploadTime, setTempSelectedUploadTime] = useState(selectedUploadTime);

  // 추천 상태
  const [recoProjects, setRecoProjects] = useState<Project[] | null>(null);
  const [loadingReco, setLoadingReco] = useState(false);
  const [recoError, setRecoError] = useState<string | null>(null);
  const [isNewUser, setIsNewUser] = useState(false); // 신규 유저 여부 (total === 0)

  // 실제 프로젝트 데이터 상태
  const [actualProjects, setActualProjects] = useState<Project[]>([]);
  const [loadingProjects, setLoadingProjects] = useState(false);
  const [isInitialLoad, setIsInitialLoad] = useState(true); // 초기 로딩 여부

  // 로그인 사용자 ID (스토리지 저장 규칙 준수)
  const userId = useMemo(() => {
    const idStr = (typeof window !== 'undefined') && (localStorage.getItem('userId') || sessionStorage.getItem('userId'));
    return idStr ? Number(idStr) : undefined;
  }, [isLoggedIn]);

  const cacheKey = useMemo(() => (isLoggedIn && userId ? `reco:projects:${userId}` : null), [isLoggedIn, userId]);

  // 세션 캐시 즉시 복원 (깜빡임 방지)
  useEffect(() => {
    if (!cacheKey) return;
    try {
      const raw = sessionStorage.getItem(cacheKey);
      if (raw) {
        const parsed = JSON.parse(raw) as Project[];
        if (Array.isArray(parsed) && parsed.length > 0) {
          setRecoProjects(parsed);
        }
      }
    } catch {}
  }, [cacheKey]);

  // 카테고리 선택 저장
  useEffect(() => {
    try {
      sessionStorage.setItem('mainPage:selectedCategory', selectedCategory);
    } catch {
      // sessionStorage 사용 불가 시 무시
    }
  }, [selectedCategory]);

  // 실제 프로젝트 데이터 가져오기 (업로드 시간 필터 변경 시)
  useEffect(() => {
    // 경쟁 상태 방지를 위한 취소 플래그
    let isCancelled = false;
    
    const loadProjects = async () => {
      setLoadingProjects(true);
      
      // 캐시 키 생성
      const cacheKey = `projects:${selectedUploadTime}`;
      
      // 캐시에서 먼저 복원 (즉시 표시) - 초기 로드 시에만
      try {
        const cached = sessionStorage.getItem(cacheKey);
        if (cached && isInitialLoad) {
          const parsedCache = JSON.parse(cached) as Project[];
          if (Array.isArray(parsedCache) && parsedCache.length > 0 && !isCancelled) {
            setActualProjects(parsedCache);
          }
        }
      } catch (e) {
        // 캐시 복원 실패 시 무시
      }
      
      try {
        // 업로드 시간을 API 파라미터로 변환
        let uploadedWithin: '24h' | '7d' | '1m' | '3m' | undefined;
        if (selectedUploadTime === '최근 24시간') {
          uploadedWithin = '24h';
        } else if (selectedUploadTime === '최근 일주일') {
          uploadedWithin = '7d';
        } else if (selectedUploadTime === '최근 한달') {
          uploadedWithin = '1m';
        } else if (selectedUploadTime === '최근 세달') {
          uploadedWithin = '3m';
        }

        // 최적화: 필요한 만큼만 로드 (100개로 제한)
        const response = await fetchProjectFeed({
          page: 0,
          size: 100,
          uploadedWithin,
        });

        // ✅ API 응답 받았지만 이미 취소된 경우 무시
        if (isCancelled) return;

        const projects = response.content || [];

        // 프로젝트 메타 정보 가져오기 (좋아요, 댓글, 조회수)
        // ✅ 메타 API 실패해도 프로젝트는 정상 표시
        if (projects.length > 0) {
          try {
            const projectIds = projects.map(p => p.id);
            const metaData = await fetchProjectsMeta(projectIds);
            
            // ✅ 메타 정보 받았지만 이미 취소된 경우 무시
            if (isCancelled) return;
            
            // 메타 정보를 프로젝트에 병합
            const projectsWithMeta = projects.map(project => ({
              ...project,
              likes: metaData[project.id]?.likes || 0,
              comments: metaData[project.id]?.comments || 0,
              views: metaData[project.id]?.views || 0,
            }));

            setActualProjects(projectsWithMeta);
            
            // 캐시에 저장
            try {
              sessionStorage.setItem(cacheKey, JSON.stringify(projectsWithMeta));
            } catch (e) {
              // sessionStorage 저장 실패 시 무시
            }
          } catch (metaError) {
            // ✅ 메타 API 실패 시 기본값으로 표시
            if (isCancelled) return;
            
            console.warn('프로젝트 메타 정보 조회 실패, 기본값 사용:', metaError);
            const projectsWithDefaults = projects.map(project => ({
              ...project,
              likes: project.likes || 0,
              comments: project.comments || 0,
              views: project.views || 0,
            }));
            setActualProjects(projectsWithDefaults);
            
            // 캐시에 기본값 저장
            try {
              sessionStorage.setItem(cacheKey, JSON.stringify(projectsWithDefaults));
            } catch (e) {}
          }
          setIsInitialLoad(false);
        } else {
          if (!isCancelled) {
            setActualProjects([]);
            setIsInitialLoad(false);
          }
        }
      } catch (error) {
        if (isCancelled) return;
        
        console.error('프로젝트 로딩 실패:', error);
        // 에러 발생 시 기존 데이터 유지 (초기 로딩이 아닌 경우)
        if (isInitialLoad) {
          setActualProjects([]);
        }
        setIsInitialLoad(false);
      } finally {
        if (!isCancelled) {
          setLoadingProjects(false);
        }
      }
    };

    loadProjects();
    
    // ✅ Cleanup: 컴포넌트 언마운트 또는 의존성 변경 시 이전 요청 취소
    return () => {
      isCancelled = true;
    };
  }, [selectedUploadTime, isInitialLoad]);

  // 로그인 시 자동으로 샌드위치 픽으로 전환
  useEffect(() => {
    if (isLoggedIn && selectedSort !== '샌드위치 픽') {
      setSelectedSort('샌드위치 픽');
      setTempSelectedSort('샌드위치 픽');
      try {
        sessionStorage.setItem('mainPage:selectedSort', '샌드위치 픽');
      } catch {}
    }
  }, [isLoggedIn]);

  // ✅ 모달이 닫힐 때마다 temp 상태를 실제 상태로 동기화
  useEffect(() => {
    if (!isSortModalOpen) {
      setTempSelectedSort(selectedSort);
      setTempSelectedUploadTime(selectedUploadTime);
    }
  }, [isSortModalOpen]); // ✅ 오직 모달 열림/닫힘만 감지

  useEffect(() => {
    if (!userId || Number.isNaN(userId) || !isLoggedIn) return; // 로그인 사용자 없으면 스킵
    
    const loadRecommendations = async () => {
      setLoadingReco(true);
      setRecoError(null);
      setIsNewUser(false);
      
      try {
        // 상위 50개 AI 추천 프로젝트 가져오기
        const response = await fetchUserRecommendations(userId, 50);
        
        // total이 0이면 신규 유저로 판단하여 기본 최신순 프로젝트 사용
        if (response.total === 0) {
          setIsNewUser(true);
          setRecoProjects(null);
          if (cacheKey) {
            try { sessionStorage.removeItem(cacheKey); } catch {}
          }
          return;
        }

        const sortedByScore = [...response.data].sort((a, b) => b.score - a.score);
        
        try {
          // 최적화: 필요한 만큼만 로드 (100개로 제한)
          const feed = await fetchProjectFeed({ page: 0, size: 100, sort: 'latest' });
          const byId = new Map<number, Project>((feed.content || []).map((p: Project) => [p.id, p]));
          const mapped: Project[] = sortedByScore.map(i => byId.get(i.project_id)).filter((p): p is Project => !!p);
          
          // ✅ AI 추천 프로젝트에도 메타 정보 가져오기 (좋아요, 댓글, 조회수)
          if (mapped.length > 0) {
            try {
              const projectIds = mapped.map(p => p.id);
              const metaData = await fetchProjectsMeta(projectIds);
              
              // 메타 정보를 프로젝트에 병합
              const mappedWithMeta = mapped.map(project => ({
                ...project,
                likes: metaData[project.id]?.likes || 0,
                comments: metaData[project.id]?.comments || 0,
                views: metaData[project.id]?.views || 0,
              }));
              
              setRecoProjects(mappedWithMeta);
              
              // 캐시에 메타 정보 포함된 데이터 저장
              if (cacheKey) {
                try { 
                  sessionStorage.setItem(cacheKey, JSON.stringify(mappedWithMeta)); 
                } catch {
                  // sessionStorage 저장 실패 시 무시
                }
              }
            } catch (metaError) {
              // ✅ 메타 API 실패 시 기본값으로 표시
              console.warn('AI 추천 프로젝트 메타 정보 조회 실패, 기본값 사용:', metaError);
              const mappedWithDefaults = mapped.map(project => ({
                ...project,
                likes: project.likes || 0,
                comments: project.comments || 0,
                views: project.views || 0,
              }));
              setRecoProjects(mappedWithDefaults);
              
              // 캐시에 기본값 저장
              if (cacheKey) {
                try { 
                  sessionStorage.setItem(cacheKey, JSON.stringify(mappedWithDefaults)); 
                } catch {}
              }
            }
          } else {
            setRecoProjects(mapped);
            
            // 캐시에 저장
            if (cacheKey) {
              try { 
                sessionStorage.setItem(cacheKey, JSON.stringify(mapped)); 
              } catch {
                // sessionStorage 저장 실패 시 무시
              }
            }
          }
        } catch (feedError) {
          // ✅ 추천 API는 성공했지만 프로젝트 피드 조회 실패 시
          console.warn('추천 피드 조회 실패:', feedError);
          setRecoProjects(null);
        }
      } catch (error) {
        // ✅ 추천 API 전체 실패 시 일반 프로젝트는 정상 표시
        console.error('추천 프로젝트 로딩 실패:', error);
        setRecoError('AI 추천을 불러오는 중 오류가 발생했습니다.');
        setRecoProjects(null); // 추천 프로젝트는 null로, 일반 프로젝트는 계속 표시
      } finally {
        setLoadingReco(false);
      }
    };
    
    loadRecommendations();
  }, [userId, isLoggedIn, cacheKey]);

  const handleOpenSortModal = () => {
    // ✅ 모달 열 때마다 현재 값으로 동기화
    setTempSelectedSort(selectedSort);
    setTempSelectedUploadTime(selectedUploadTime);
    setIsSortModalOpen(true);
  };

  const handleCloseSortModal = () => {
    // ✅ 취소 시 temp 값을 원래 값으로 되돌림 (다음 열기를 위해)
    setTempSelectedSort(selectedSort);
    setTempSelectedUploadTime(selectedUploadTime);
    setIsSortModalOpen(false);
  };

  const handleApplySortModal = () => {
    // ✅ 상태 업데이트를 먼저 처리
    const newSort = tempSelectedSort;
    let newTime = tempSelectedUploadTime;
    
    // ✅ 샌드위치 픽 선택 시 업로드 시간을 전체기간으로 리셋
    if (newSort === '샌드위치 픽') {
      newTime = '전체기간';
    }
    
    // 선택한 정렬 옵션을 sessionStorage에 저장
    try {
      sessionStorage.setItem('mainPage:selectedSort', newSort);
      sessionStorage.setItem('mainPage:selectedUploadTime', newTime);
    } catch {
      // sessionStorage 사용 불가 시 무시
    }
    
    // ✅ 모달 먼저 닫기
    setIsSortModalOpen(false);
    
    // ✅ 모달이 완전히 닫힌 후 상태 업데이트 (useEffect 충돌 방지)
    setTimeout(() => {
      setSelectedSort(newSort);
      setSelectedUploadTime(newTime);
    }, 0);
  };

  const handleQuickSortToSandwichPick = () => {
    setSelectedSort('샌드위치 픽');
    setSelectedUploadTime('전체기간');
    try {
      sessionStorage.setItem('mainPage:selectedSort', '샌드위치 픽');
      sessionStorage.setItem('mainPage:selectedUploadTime', '전체기간');
    } catch {
      // sessionStorage 사용 불가 시 무시
    }
  };

  // 카테고리 필터 적용 (실제 데이터 사용)
  // TODO: 백엔드에서 categories 데이터가 추가되면 필터링 활성화
  // 현재는 categories 데이터가 없어서 '전체'와 동일하게 모든 프로젝트 표시
  const filteredProjects: Project[] = useMemo(() => {
    return actualProjects.filter((project) => {
      // 임시: 카테고리 필터 무시하고 모든 프로젝트 표시
      return true;
      // const matchesCategory =
      //   selectedCategory === '전체' || project.categories?.includes(selectedCategory);
      // return matchesCategory;
    });
  }, [actualProjects, selectedCategory]);

  // 클라이언트 사이드 정렬 적용
  const sortedProjects = useMemo(() => {
    return [...filteredProjects].sort((a, b) => {
      if (selectedSort === '최신순') {
        // 최신순: 생성일 기준 내림차순 (uploadDate가 없으면 id로 정렬)
        if (a.uploadDate && b.uploadDate) {
          return new Date(b.uploadDate).getTime() - new Date(a.uploadDate).getTime();
        }
        return b.id - a.id; // fallback: id 기준 정렬
      } else if (selectedSort === '추천순') {
        // 추천순: 좋아요 수 기준 내림차순
        return (b.likes || 0) - (a.likes || 0);
      } else if (selectedSort === '샌드위치 픽') {
        // 샌드위치 픽: 좋아요, 댓글, 조회수를 가중치로 계산
        const scoreA = (a.likes || 0) * 2 + (a.comments || 0) * 1.5 + (a.views || 0) * 0.5;
        const scoreB = (b.likes || 0) * 2 + (b.comments || 0) * 1.5 + (b.views || 0) * 0.5;
        return scoreB - scoreA;
      }
      return 0;
    });
  }, [filteredProjects, selectedSort]);

  // 정렬 옵션에 따라 AI 추천 적용 여부 결정 (신규 유저는 제외)
  const useReco = useMemo(() => 
    isLoggedIn && selectedSort === '샌드위치 픽' && !isNewUser,
    [isLoggedIn, selectedSort, isNewUser]
  );
  
  const hasReco = useMemo(() => 
    useReco && !!(recoProjects && recoProjects.length > 0),
    [useReco, recoProjects]
  );

  // 카테고리 필터를 추천 프로젝트에도 적용
  // TODO: 백엔드에서 categories 데이터가 추가되면 필터링 활성화
  const filteredRecoProjects = useMemo(() => 
    (recoProjects || []).filter((project) => {
      // 임시: 카테고리 필터 무시하고 모든 프로젝트 표시
      return true;
      // const matchesCategory =
      //   selectedCategory === '전체' || project.categories?.includes(selectedCategory);
      // return matchesCategory;
    }),
    [recoProjects, selectedCategory]
  );

  // 화면 크기에 따른 메인 그리드 개수
  const [mainGridCount, setMainGridCount] = useState(10);
  
  useEffect(() => {
    const updateMainGridCount = () => {
      const width = window.innerWidth;
      if (width < 640) {
        setMainGridCount(4); // 모바일: 2개 × 2줄
      } else if (width < 768) {
        setMainGridCount(4); // sm: 2개 × 2줄
      } else if (width < 1024) {
        setMainGridCount(6); // md: 3개 × 2줄
      } else {
        setMainGridCount(10); // lg/xl: 5개 × 2줄
      }
    };

    updateMainGridCount();
    window.addEventListener('resize', updateMainGridCount);
    return () => window.removeEventListener('resize', updateMainGridCount);
  }, []);

  // 렌더 소스 선택 (정렬된 데이터 사용)
  const gridPrimary = useMemo(() => 
    hasReco ? filteredRecoProjects.slice(0, mainGridCount) : sortedProjects.slice(0, mainGridCount),
    [hasReco, filteredRecoProjects, sortedProjects, mainGridCount]
  );
  
  const heroProjects = useMemo(() => 
    hasReco ? filteredRecoProjects.slice(0, 7) : sortedProjects.slice(0, 7),
    [hasReco, filteredRecoProjects, sortedProjects]
  );
  
  const gridMore = useMemo(() => 
    hasReco
      ? (filteredRecoProjects.length > mainGridCount ? filteredRecoProjects.slice(mainGridCount) : sortedProjects.slice(mainGridCount))
      : sortedProjects.slice(mainGridCount),
    [hasReco, filteredRecoProjects, sortedProjects, mainGridCount]
  );

  // 그리드 제목: 정렬 방식에 따라 변경
  const gridTitle = useMemo(() => {
    if (useReco) {
      return 'AI 추천 프로젝트';
    }
    
    switch (selectedSort) {
      case '최신순':
        return '최신 프로젝트';
      case '추천순':
        return '추천 프로젝트';
      case '샌드위치 픽':
        return '샌드위치 PICK 프로젝트';
      default:
        return '전체 프로젝트';
    }
  }, [useReco, selectedSort]);

  return (
    <div className="min-h-screen">
      <main className="px-4 py-4 md:px-6 md:py-5 lg:px-8 lg:py-6">
        <MainHeroSection projects={heroProjects} />

        {/* 메인 그리드 */}
        {useReco ? (
          hasReco ? (
            gridPrimary.length > 0 ? (
              <MainProjectGrid title={gridTitle} projects={gridPrimary} onOpenSortModal={handleOpenSortModal} />
            ) : (
              <div className="px-3 py-8 md:py-12 lg:py-[50px]">
                <div className="flex justify-between items-center mb-3 md:mb-4">
                  <h2 className="text-lg md:text-xl lg:text-2xl font-bold text-black dark:text-gray-100">{gridTitle}</h2>
                  <button
                    onClick={handleOpenSortModal}
                    className="text-xs md:text-sm lg:text-base font-semibold px-2 md:px-3 lg:px-4 py-1 transition-all duration-200 text-black dark:text-gray-200 hover:text-green-600 dark:hover:text-green-400 whitespace-nowrap flex-shrink-0"
                  >
                    ↕ 정렬
                  </button>
                </div>
                <div className="flex flex-col items-center justify-center py-12 md:py-16 lg:py-20 text-center">
                  <p className="text-gray-500 dark:text-gray-400 text-sm md:text-base lg:text-lg mb-4">
                    선택한 조건에 맞는 프로젝트가 없습니다.
                  </p>
                  <p className="text-gray-400 dark:text-gray-500 text-xs md:text-sm mb-6">
                    다른 정렬 방식으로 변경해보세요.
                  </p>
                  <button
                    onClick={handleQuickSortToSandwichPick}
                    className="bg-green-600 hover:bg-green-700 text-white px-6 py-2.5 rounded-lg text-sm md:text-base font-medium transition-colors"
                  >
                    샌드위치 픽으로 보기
                  </button>
                </div>
              </div>
            )
          ) : (
            <div className="text-center text-gray-500 py-8 md:py-12 lg:py-[50px] text-sm md:text-base lg:text-lg">
              {recoError ? recoError : 'AI 추천을 불러오는 중입니다…'}
            </div>
          )
        ) : (
          gridPrimary.length > 0 ? (
            <MainProjectGrid title={gridTitle} projects={gridPrimary} onOpenSortModal={handleOpenSortModal} />
          ) : (
            <div className="px-3 py-8 md:py-12 lg:py-[50px]">
              <div className="flex justify-between items-center mb-3 md:mb-4">
                <h2 className="text-lg md:text-xl lg:text-2xl font-bold text-black dark:text-gray-100">{gridTitle}</h2>
                <button
                  onClick={handleOpenSortModal}
                  className="text-xs md:text-sm lg:text-base font-semibold px-2 md:px-3 lg:px-4 py-1 transition-all duration-200 text-black dark:text-gray-200 hover:text-green-600 dark:hover:text-green-400 whitespace-nowrap flex-shrink-0"
                >
                  ↕ 정렬
                </button>
              </div>
              <div className="flex flex-col items-center justify-center py-12 md:py-16 lg:py-20 text-center">
                <p className="text-gray-500 dark:text-gray-400 text-sm md:text-base lg:text-lg mb-4">
                  선택한 조건에 맞는 프로젝트가 없습니다.
                </p>
                <p className="text-gray-400 dark:text-gray-500 text-xs md:text-sm mb-6">
                  다른 정렬 방식으로 변경해보세요.
                </p>
                <button
                  onClick={handleQuickSortToSandwichPick}
                  className="bg-green-600 hover:bg-green-700 text-white px-6 py-2.5 rounded-lg text-sm md:text-base font-medium transition-colors"
                >
                  샌드위치 픽으로 보기
                </button>
              </div>
            </div>
          )
        )}

        {/* 다른 섹션은 항상 표시 */}
        <MainDeveloperHighlight />

        {gridMore.length > 0 && (
          <MainProjectGrid title={`${gridTitle} 계속 보기`} projects={gridMore} />
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

