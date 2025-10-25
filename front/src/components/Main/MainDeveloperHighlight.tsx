//인기 개발자 추천 부분
//MainDeveloperHighlight.tsx
import React, { useState, useEffect } from 'react';
import { fetchHotDevelopers, HotDeveloper } from '../../api/discovery';
import { useNavigate } from 'react-router-dom';

type Props = {
  projects?: any[]; // 하위 호환성 유지 (사용하지 않음)
};

const MainDeveloperHighlight: React.FC<Props> = () => {
  const navigate = useNavigate();
  const [startIndex, setStartIndex] = useState(0);
  const [windowWidth, setWindowWidth] = useState(typeof window !== 'undefined' ? window.innerWidth : 1024);
  const [hotDevelopers, setHotDevelopers] = useState<HotDeveloper[]>([]);
  const [loading, setLoading] = useState(true);

  // 화면 크기에 따른 카드 개수 결정
  const cardsPerPage = windowWidth < 768 ? 2 : windowWidth < 1024 ? 4 : 6;

  // HOT 개발자 데이터 불러오기
  useEffect(() => {
    const loadHotDevelopers = async () => {
      try {
        setLoading(true);
        const developers = await fetchHotDevelopers(15, 0); // 상위 15명 조회
        setHotDevelopers(developers);
      } catch (error) {
        console.error('HOT 개발자 데이터 로딩 실패:', error);
        setHotDevelopers([]);
      } finally {
        setLoading(false);
      }
    };

    loadHotDevelopers();
  }, []);

  // 화면 크기에 따라 다른 개수씩 보여줌
  const topUsers = hotDevelopers.slice(startIndex, startIndex + cardsPerPage);

  const showPrev = startIndex > 0;
  const showNext = startIndex + cardsPerPage < hotDevelopers.length;
  
  // 전체 개발자 수가 화면에 표시되는 수보다 적거나 같으면 화살표를 숨김
  const needsCarousel = hotDevelopers.length > cardsPerPage;

  // 화면 크기 변경 감지
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // 화면 크기가 변경되면 startIndex 초기화
  useEffect(() => {
    setStartIndex(0);
  }, [cardsPerPage]);

  // 로딩 상태 처리
  if (loading) {
    return (
      <section className="bg-[#FFA724] dark:bg-[#FFA724] py-5 md:py-6 lg:py-8 relative overflow-hidden">
        <h2 className="text-white text-lg md:text-xl lg:text-2xl font-bold mb-3 md:mb-4 ml-3 md:ml-5 lg:ml-6">
          샌드위치 추천, HOT 개발자
        </h2>
        <div className="text-center text-white py-8">
          로딩 중...
        </div>
      </section>
    );
  }

  // 데이터가 없을 때
  if (hotDevelopers.length === 0) {
    return (
      <section className="bg-[#FFA724] dark:bg-[#FFA724] py-5 md:py-6 lg:py-8 relative overflow-hidden">
        <h2 className="text-white text-lg md:text-xl lg:text-2xl font-bold mb-3 md:mb-4 ml-3 md:ml-5 lg:ml-6">
          샌드위치 추천, HOT 개발자
        </h2>
        <div className="text-center text-white py-8">
          HOT 개발자 데이터를 불러올 수 없습니다.
        </div>
      </section>
    );
  }

  return (
    <section className="bg-[#FFA724] dark:bg-[#FFA724] py-5 md:py-6 lg:py-8 relative overflow-hidden">
      <h2 className="text-white text-lg md:text-xl lg:text-2xl font-bold mb-3 md:mb-4 px-4 md:px-6 lg:px-8">
        샌드위치 추천, HOT 개발자
      </h2>

      <div className="relative px-4 md:px-6 lg:px-8">
        {/* 왼쪽 버튼 - 캐러셀이 필요할 때만 표시 */}
        {needsCarousel && (
          <button
            className={`absolute left-2 md:left-3 lg:left-4 top-1/2 transform -translate-y-1/2 bg-white dark:bg-black text-black dark:text-white rounded-full shadow-md w-8 h-8 md:w-10 md:h-10 lg:w-12 lg:h-12 text-lg md:text-xl lg:text-2xl z-10 transition-all ${
              showPrev ? 'hover:scale-110 cursor-pointer opacity-100' : 'opacity-40 cursor-not-allowed'
            }`}
            onClick={() => showPrev && setStartIndex((prev) => Math.max(prev - cardsPerPage, 0))}
            disabled={!showPrev}
            aria-label="이전"
          >
            &lt;
          </button>
        )}

        {/* 카드 리스트 */}
        <div className="flex gap-3 md:gap-4 lg:gap-6 justify-center">
          {topUsers.map((developer) => (
            <div
              key={developer.userId}
              className="bg-white dark:bg-black rounded-xl md:rounded-2xl w-[160px] md:w-[200px] lg:w-[240px] px-4 md:px-5 lg:px-6 py-3 md:py-4 lg:py-5 flex flex-col items-center flex-shrink-0 shadow-[0_0_4px_rgba(0,0,0,0.25)] transition-transform duration-200 hover:-translate-y-1"
            >
              {/* 프로필 이미지 또는 이니셜 */}
              {developer.avatarUrl && developer.avatarUrl !== '' && !developer.avatarUrl.includes('cdn.example.com') ? (
                <img
                  src={developer.avatarUrl}
                  alt={developer.nickname || '사용자'}
                  className="w-8 h-8 md:w-10 md:h-10 lg:w-12 lg:h-12 rounded-full object-cover border border-gray-300 dark:border-transparent cursor-pointer hover:opacity-80 transition-opacity"
                  onClick={() => navigate(`/users/${developer.userId}`)}
                />
              ) : (
                <div 
                  className="w-8 h-8 md:w-10 md:h-10 lg:w-12 lg:h-12 rounded-full bg-gray-200 dark:bg-gray-700 border border-gray-300 dark:border-transparent flex items-center justify-center text-sm md:text-base lg:text-lg font-medium text-gray-800 dark:text-white cursor-pointer hover:opacity-80 transition-opacity"
                  onClick={() => navigate(`/users/${developer.userId}`)}
                >
                  {developer.nickname ? developer.nickname.charAt(0) : '?'}
                </div>
              )}

              {/* 이름/직무 */}
              <div className="mt-1.5 md:mt-2 text-center w-full">
                <p className="text-sm md:text-base font-semibold text-black dark:text-white truncate">
                  {developer.nickname || '알 수 없음'}
                </p>
                <p className="text-xs text-gray-600 dark:text-white/80 truncate">
                  {developer.position || '직무 미지정'}
                </p>
              </div>

              {/* 프로젝트 썸네일 (최대 3개) */}
              <div className="mt-2 md:mt-2.5 lg:mt-3 flex gap-1.5 md:gap-2">
                {developer.projects.slice(0, 3).map((project, idx) => (
                  <div
                    key={`${developer.userId}-${project.projectId}-${idx}`}
                    className="w-8 h-8 md:w-10 md:h-10 lg:w-12 lg:h-12 bg-gray-300 dark:bg-gray-600 rounded-md overflow-hidden cursor-pointer hover:opacity-80 transition-opacity"
                    onClick={(e) => {
                      e.stopPropagation(); // 부모 클릭 이벤트 방지
                      navigate(`/other-project/${developer.userId}/${project.projectId}`);
                    }}
                  >
                    {project.coverUrl && project.coverUrl !== 'null' && !project.coverUrl.includes('cdn.example.com') ? (
                      <img
                        src={project.coverUrl}
                        alt={`프로젝트 ${project.projectId}`}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-xs text-gray-500">
                        {/* 빈 이미지 */}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* 오른쪽 버튼 - 캐러셀이 필요할 때만 표시 */}
        {needsCarousel && (
          <button
            className={`absolute right-2 md:right-3 lg:right-4 top-1/2 transform -translate-y-1/2 bg-white dark:bg-black text-black dark:text-white rounded-full shadow-md w-8 h-8 md:w-10 md:h-10 lg:w-12 lg:h-12 text-lg md:text-xl lg:text-2xl z-10 transition-all ${
              showNext ? 'hover:scale-110 cursor-pointer opacity-100' : 'opacity-40 cursor-not-allowed'
            }`}
            onClick={() => showNext && setStartIndex((prev) => prev + cardsPerPage)}
            disabled={!showNext}
            aria-label="다음"
          >
            &gt;
          </button>
        )}
      </div>
    </section>
  );
};

export default MainDeveloperHighlight;


