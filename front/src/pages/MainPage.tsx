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

  // 로그인 상태
  const { isLoggedIn } = useContext(AuthContext);

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
    const loadProjects = async () => {
      setLoadingProjects(true);
      
      // 캐시 키 생성
      const cacheKey = `projects:${selectedUploadTime}`;
      
      // 캐시에서 먼저 복원 (즉시 표시)
      try {
        const cached = sessionStorage.getItem(cacheKey);
        if (cached && isInitialLoad) {
          const parsedCache = JSON.parse(cached) as Project[];
          if (Array.isArray(parsedCache) && parsedCache.length > 0) {
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

        const projects = response.content || [];

        // 프로젝트 메타 정보 가져오기 (좋아요, 댓글, 조회수)
        // ✅ 메타 API 실패해도 프로젝트는 정상 표시
        if (projects.length > 0) {
          try {
            const projectIds = projects.map(p => p.id);
            const metaData = await fetchProjectsMeta(projectIds);
            
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
          setActualProjects([]);
          setIsInitialLoad(false);
        }
      } catch (error) {
        console.error('프로젝트 로딩 실패:', error);
        // 에러 발생 시 기존 데이터 유지 (초기 로딩이 아닌 경우)
        if (isInitialLoad) {
          setActualProjects([]);
        }
        setIsInitialLoad(false);
      } finally {
        setLoadingProjects(false);
      }
    };

    loadProjects();
  }, [selectedUploadTime, isInitialLoad]);

  useEffect(() => {
    if (!userId || Number.isNaN(userId) || !isLoggedIn) return; // 로그인 사용자 없으면 스킵
    
    const loadRecommendations = async () => {
      setLoadingReco(true);
      setRecoError(null);
      setIsNewUser(false);
      
      try {
        const response = await fetchUserRecommendations(userId);
        
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
          
          setRecoProjects(mapped);
          
          // 캐시에 저장
          if (cacheKey) {
            try { 
              sessionStorage.setItem(cacheKey, JSON.stringify(mapped)); 
            } catch {
              // sessionStorage 저장 실패 시 무시
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
    setTempSelectedSort(selectedSort);
    setTempSelectedUploadTime(selectedUploadTime);
    setIsSortModalOpen(true);
  };

  const handleCloseSortModal = () => setIsSortModalOpen(false);

  const handleApplySortModal = () => {
    setSelectedSort(tempSelectedSort);
    setSelectedUploadTime(tempSelectedUploadTime);
    setIsSortModalOpen(false);
    
    // 선택한 정렬 옵션을 sessionStorage에 저장
    try {
      sessionStorage.setItem('mainPage:selectedSort', tempSelectedSort);
      sessionStorage.setItem('mainPage:selectedUploadTime', tempSelectedUploadTime);
    } catch {
      // sessionStorage 사용 불가 시 무시
    }
  };

  // 카테고리 필터 적용 (실제 데이터 사용)
  // TODO: 백엔드에서 categories 데이터가 추가되면 필터링 활성화
  // 현재는 categories 데이터가 없어서 '전체'와 동일하게 모든 프로젝트 표시
  const filteredProjects: Project[] = actualProjects.filter((project) => {
    // 임시: 카테고리 필터 무시하고 모든 프로젝트 표시
    return true;
    // const matchesCategory =
    //   selectedCategory === '전체' || project.categories?.includes(selectedCategory);
    // return matchesCategory;
  });

  // 클라이언트 사이드 정렬 적용
  const sortedProjects = [...filteredProjects].sort((a, b) => {
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

  // 정렬 옵션에 따라 AI 추천 적용 여부 결정 (신규 유저는 제외)
  const useReco = isLoggedIn && selectedSort === '샌드위치 픽' && !isNewUser;
  const hasReco = useReco && !!(recoProjects && recoProjects.length > 0);

  // 카테고리 필터를 추천 프로젝트에도 적용
  // TODO: 백엔드에서 categories 데이터가 추가되면 필터링 활성화
  const filteredRecoProjects = (recoProjects || []).filter((project) => {
    // 임시: 카테고리 필터 무시하고 모든 프로젝트 표시
    return true;
    // const matchesCategory =
    //   selectedCategory === '전체' || project.categories?.includes(selectedCategory);
    // return matchesCategory;
  });

  // 렌더 소스 선택 (정렬된 데이터 사용)
  const gridPrimary = hasReco ? filteredRecoProjects.slice(0, 10) : sortedProjects.slice(0, 10);
  const heroProjects = hasReco
    ? filteredRecoProjects.slice(0, 7)
    : sortedProjects.slice(0, 7);
  const gridMore = hasReco
    ? (filteredRecoProjects.length > 10 ? filteredRecoProjects.slice(10) : sortedProjects.slice(10))
    : sortedProjects.slice(10);

  // 그리드 제목: '샌드위치 픽'일 때만 AI 추천으로 표기
  const gridTitle = useReco ? 'AI 추천 프로젝트' : '전체 프로젝트';

  return (
    <div className="min-h-screen">
      <main className="px-4 py-4 md:px-6 md:py-5 lg:px-8 lg:py-6">
        <MainHeroSection projects={heroProjects} />

        {/* 메인 그리드 */}
        {useReco ? (
          hasReco ? (
            <MainProjectGrid title={gridTitle} projects={gridPrimary} onOpenSortModal={handleOpenSortModal} />
          ) : (
            <div className="text-center text-gray-500 py-8 md:py-12 lg:py-[50px] text-sm md:text-base lg:text-lg">
              {recoError ? recoError : 'AI 추천을 불러오는 중입니다…'}
            </div>
          )
        ) : (
          <MainProjectGrid title={gridTitle} projects={gridPrimary} onOpenSortModal={handleOpenSortModal} />
        )}

        {/* 다른 섹션은 항상 표시 */}
        <MainDeveloperHighlight />

        {gridMore.length > 0 && (
          <MainProjectGrid title={useReco ? 'AI 추천 프로젝트 계속 보기' : '계속해서 프로젝트를 살펴보세요!'} projects={gridMore} />
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

