// src/components/challenge/CodeWinnersSection.tsx
import React from "react";
import { useNavigate } from "react-router-dom";
import { fetchChallenges } from "../../api/challengeApi";
import api from "../../api/axiosInstance";

type SimpleWinner = { rank: number; name: string; profileImageUrl?: string; userId?: number };

const getMedalIcon = (rank: number) => {
  switch (rank) {
    case 1: return "🥇";
    case 2: return "🥈";
    case 3: return "🥉";
    default: return "🏅";
  }
};

function WinnerCard({ w }: { w: SimpleWinner }) {
  const navigate = useNavigate();
  const initial = String(w.name || "?").charAt(0).toUpperCase();
  
  const handleProfileClick = () => {
    if (w.userId) {
      navigate(`/users/${w.userId}`);
    }
  };
  
  return (
    <div className="text-center">
      <div className="mb-2 text-3xl">{getMedalIcon(w.rank)}</div>
      <div 
        className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mb-2 mx-auto overflow-hidden cursor-pointer hover:opacity-80 transition-opacity"
        onClick={handleProfileClick}
      >
        {w.profileImageUrl ? (
          <img 
            src={w.profileImageUrl} 
            alt={w.name}
            className="w-full h-full object-cover"
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              target.style.display = 'none';
              target.parentElement!.innerHTML = `<span class="font-bold text-lg text-gray-700">${initial}</span>`;
            }}
          />
        ) : (
          <span className="font-bold text-lg text-gray-700">{initial}</span>
        )}
      </div>
      <div 
        className="font-semibold text-gray-800 mb-1 break-words text-sm cursor-pointer hover:opacity-80 transition-opacity"
        onClick={handleProfileClick}
      >
        {w.name}
      </div>
      <div className="bg-gray-800 text-white px-3 py-1 rounded-full text-sm">{w.rank}위</div>
    </div>
  );
}

export default function CodeWinnersSection() {
  const [winners, setWinners] = React.useState<SimpleWinner[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const fetchWinnersData = async () => {
    try {
      setLoading(true);
      setError(null);

      // 1) 최근 ENDED CODE 챌린지 조회 (종료일 기준 최신순)
      const list = await fetchChallenges(0, 20, "CODE", "ENDED", { sort: "endAt,desc" });
      const content = list?.content || [];
      if (!content.length) { setWinners([]); return; }
      // 이미 정렬되어 있으므로 첫 번째가 가장 최근 종료
      const latest = content[0];

      // 2) 백엔드 API를 통해 AI 리더보드 조회 (상위 3명)
      // 백엔드가 AI 서버 호출 + 유저 정보 매핑을 모두 처리해줌
      const res = await api.get(`/challenges/${latest.id}/leaderboard`, {
        params: { limit: 3 },
        withCredentials: true,
      });
      
      const data = res.data;
      if (!data?.found || !data?.items?.length) {
        setWinners([]);
        return;
      }

      // 3) 백엔드 응답을 SimpleWinner 형식으로 변환
      const winnersMapped: SimpleWinner[] = data.items.map((item: any) => {
        const owner = item.owner;
        const name = owner?.username || `user ${item.user}`;
        const profileImageUrl = owner?.profileImageUrl;
        const userId = owner?.userId;
        
        return {
          rank: item.rank,
          name,
          profileImageUrl,
          userId,
        };
      });
      
      setWinners(winnersMapped);
    } catch (e) {
      console.error("코드 리더보드 로딩 실패:", e);
      setError("코드 리더보드를 불러오지 못했습니다.");
      setWinners([]);
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    fetchWinnersData();
  }, []);

  // 페이지 가시성 변경 시 새로고침 (챌린지 상태 변경 감지)
  React.useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        console.log('🔄 코드 Winners 섹션 새로고침');
        fetchWinnersData();
      }
    };

    const handleChallengeStatusChange = () => {
      console.log('🔄 챌린지 상태 변경 감지 - 코드 Winners 섹션 새로고침');
      fetchWinnersData();
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('challengeStatusChanged', handleChallengeStatusChange);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('challengeStatusChanged', handleChallengeStatusChange);
    };
  }, []);

  // 데이터가 없어도 폼은 유지하되, 더미 데이터로 표시

  return (
    <div className="mx-auto mt-5 max-w-screen-xl px-4 md:px-6">
      <div className="flex justify-center w-full">
        <div className="flex flex-col w-full items-stretch">
          <h3 className="mb-3 text-2xl font-extrabold text-center">지난 코드 챌린지 TOP Winners</h3>
          {loading ? (
            <div className="bg-white rounded-2xl border border-gray-200 p-8 h-[240px] w-full box-border mx-auto">
              <div className="flex items-center justify-center h-full">
                <div className="text-center">
                  <div className="h-6 w-6 animate-spin rounded-full border-2 border-neutral-300 border-t-emerald-500 mx-auto mb-2"></div>
                  <div className="text-sm text-neutral-500">우승자 정보 로딩 중...</div>
                </div>
              </div>
            </div>
          ) : error ? (
            <div className="bg-white rounded-2xl border border-gray-200 p-8 h-[240px] w-full box-border mx-auto">
              <div className="flex items-center justify-center h-full text-sm text-neutral-500">{error}</div>
            </div>
          ) : winners.length === 0 ? (
            // 데이터가 없을 때 안내 메시지 표시
            <div className="bg-white rounded-2xl border border-gray-200 p-8 h-[240px] w-full box-border mx-auto flex items-center justify-center">
              <div className="text-base text-neutral-600 text-center font-medium">
                지난 코드 챌린지 우승자 정보가 없습니다.
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-gray-200 p-8 h-[240px] w-full box-border mx-auto flex items-center justify-center">
              <div className="grid grid-cols-3 items-center w-full">
                {[2, 1, 3].map((rank) => {
                  const w = winners.find((x) => x.rank === rank);
                  return (
                    <div key={rank} className="flex-1 flex justify-center">
                      {w ? <WinnerCard w={w} /> : <div className="invisible"><div className="w-12 h-12" /></div>}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}


