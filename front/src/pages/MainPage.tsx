//MainPage.tsx
import React, { useEffect, useMemo, useState, useContext } from 'react';
import MainHeroSection from '../components/Main/MainHeroSection';
import MainCategoryFilter from '../components/Main/MainCategoryFilter';
import MainProjectGrid from '../components/Main/MainProjectGrid';
import MainDeveloperHighlight from '../components/Main/MainDeveloperHighlight';
import SortModal from '../components/Main/SortModal';
import { dummyProjects } from '../data/dummyProjects';
import { Project, Category } from '../types/Project';
import { fetchUserRecommendations } from '../api/reco';
import { fetchProjectFeed } from '../api/projects';
import { AuthContext } from '../context/AuthContext';

const MainPage = () => {
  const [selectedCategory, setSelectedCategory] = useState<Category | '전체'>('전체');
  const [isSortModalOpen, setIsSortModalOpen] = useState(false);
  const [selectedSort, setSelectedSort] = useState('샌드위치 픽');
  const [selectedUploadTime, setSelectedUploadTime] = useState('전체기간');

  const [tempSelectedSort, setTempSelectedSort] = useState(selectedSort);
  const [tempSelectedUploadTime, setTempSelectedUploadTime] = useState(selectedUploadTime);

  // 추천 상태
  const [recoProjects, setRecoProjects] = useState<Project[] | null>(null);
  const [loadingReco, setLoadingReco] = useState(false);
  const [recoError, setRecoError] = useState<string | null>(null);

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

  useEffect(() => {
    if (!userId || Number.isNaN(userId) || !isLoggedIn) return; // 로그인 사용자 없으면 스킵
    setLoadingReco(true);
    setRecoError(null);
    fetchUserRecommendations(userId)
      .then(async (items) => {
        const sortedByScore = [...items].sort((a, b) => b.score - a.score);
        const feed = await fetchProjectFeed({ page: 0, size: 500, sort: 'latest' });
        const byId = new Map<number, Project>((feed.content || []).map((p: Project) => [p.id, p]));
        const mapped: Project[] = sortedByScore.map(i => byId.get(i.project_id)).filter((p): p is Project => !!p);
        setRecoProjects(mapped);
        if (cacheKey) {
          try { sessionStorage.setItem(cacheKey, JSON.stringify(mapped)); } catch {}
        }
      })
      .catch(() => {
        // 실패 시 에러 메시지 표시
        setRecoError('AI 추천을 불러오는 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.');
      })
      .finally(() => setLoadingReco(false));
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

  // 카테고리 + 업로드 시간 필터 적용 (더미 전용)
  const filteredProjects: Project[] = dummyProjects.filter((project) => {
    const matchesCategory =
      selectedCategory === '전체' || project.categories?.includes(selectedCategory);
    const matchesUploadTime = filterByUploadTime(project);
    return matchesCategory && matchesUploadTime;
  });

  // 정렬 로직 적용 (더미 전용)
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

  // 정렬 옵션에 따라 AI 추천 적용 여부 결정
  const useReco = isLoggedIn && selectedSort === '샌드위치 픽';
  const hasReco = useReco && !!(recoProjects && recoProjects.length > 0);

  // 렌더 소스 선택
  const gridPrimary = hasReco ? recoProjects!.slice(0, 10) : sortedProjects.slice(0, 10);
  const heroProjects = hasReco
    ? recoProjects!.slice(0, 7)
    : (sortedProjects.length > 0 ? sortedProjects : dummyProjects).slice(0, 7);
  const gridMore = hasReco
    ? (recoProjects!.length > 10 ? recoProjects!.slice(10) : sortedProjects.slice(10))
    : sortedProjects.slice(10);

  // 그리드 제목: '샌드위치 픽'일 때만 AI 추천으로 표기
  const gridTitle = useReco ? 'AI 추천 프로젝트' : `"${selectedCategory}" 카테고리 프로젝트`;

  return (
    <div className="min-h-screen">
      <main className="px-8 py-6">
        <MainHeroSection projects={heroProjects.length > 0 ? heroProjects : dummyProjects.slice(0, 7)} />

        <div className="mb-10">
          <MainCategoryFilter
            selectedCategory={selectedCategory}
            onSelectCategory={setSelectedCategory}
            onOpenSortModal={handleOpenSortModal}
          />
        </div>

        {/* 메인 그리드 */}
        {useReco ? (
          hasReco ? (
            <MainProjectGrid title={gridTitle} projects={gridPrimary} />
          ) : (
            <div className="text-center text-gray-500 py-[50px] text-lg">
              {recoError ? recoError : 'AI 추천을 불러오는 중입니다…'}
            </div>
          )
        ) : (
          <MainProjectGrid title={gridTitle} projects={gridPrimary} />
        )}

        {/* 다른 섹션은 항상 표시 */}
        <MainDeveloperHighlight projects={hasReco ? (recoProjects || []) : sortedProjects} />

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

