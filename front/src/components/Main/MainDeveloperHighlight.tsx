//인기 개발자 추천 부분
//MainDeveloperHighlight.tsx
import React, { useState } from 'react';
import { dummyUsers } from '../../data/dummyUsers';
import { Project } from '../../types/Project';

type Props = {
  projects: Project[];
};

const MainDeveloperHighlight: React.FC<Props> = ({ projects }) => {
  const [startIndex, setStartIndex] = useState(0);

  // 사용자별 프로젝트 점수 계산
  const userScores = dummyUsers.map((user) => {
    const userProjects = projects.filter(p => p.authorId === user.id);
    const score = userProjects.reduce((acc, cur) => acc + cur.likes + cur.views, 0);
    return { ...user, score, projects: userProjects.slice(0, 3) };
  });

  // 상위 10명만 필터링
  const top10Users = userScores
    .sort((a, b) => b.score - a.score)
    .slice(0, 15);

  // 한 번에 6명씩 보여줌
  const topUsers = top10Users.slice(startIndex, startIndex + 6);

  const showPrev = startIndex > 0;
  const showNext = startIndex + 6 < top10Users.length;

  return (
    <section className="bg-[#FFA724] py-8 relative overflow-hidden">
    <h2 className="text-white text-2xl font-bold mb-4 ml-6">
      샌드위치 추천, HOT 개발자
    </h2>

    <div className="relative">
      {/* 왼쪽 버튼 */}
      {showPrev && (
        <button
          className="absolute left-2 top-1/2 transform -translate-y-1/2 bg-white rounded-full shadow-md w-12 h-12 text-2xl z-10"
          onClick={() => setStartIndex((prev) => Math.max(prev - 6, 0))}
        >
          &lt;
        </button>
      )}

      {/* 카드 리스트 */}
      <div className="flex gap-4 px-6 ml-[24px]">
        {topUsers.map((user) => (
          <div
            key={user.id}
            className="bg-white rounded-xl w-[200px] px-4 py-3 flex flex-col items-center flex-shrink-0 shadow-[0_0_4px_rgba(0,0,0,0.25)] transition-transform duration-200 hover:-translate-y-1"
          >
            {/* 이니셜 */}
            <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center text-lg font-medium text-gray-800">
              {user.name.charAt(0)}
            </div>

            {/* 이름/직무 */}
            <div className="mt-2 text-center">
              <p className="text-base font-semibold text-black">{user.name}</p>
              <p className="text-xs text-gray-600">{user.role}</p>
            </div>

            {/* 썸네일 */}
            <div className="mt-3 flex gap-2">
              {user.projects.map((_, idx) => (
                <div key={idx} className="w-12 h-12 bg-gray-300 rounded-md" />
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* 오른쪽 버튼 */}
      {showNext && (
        <button
          className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-white rounded-full shadow-md w-12 h-12 text-2xl z-10"
          onClick={() => setStartIndex((prev) => prev + 6)}
        >
          &gt;
        </button>
      )}
    </div>
  </section>

  );
};

export default MainDeveloperHighlight;
