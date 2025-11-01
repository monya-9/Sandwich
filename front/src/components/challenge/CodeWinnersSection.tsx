// src/components/challenge/CodeWinnersSection.tsx
import React from "react";
import { useNavigate } from "react-router-dom";
import { fetchChallenges, fetchChallengeDetail } from "../../api/challengeApi";
import { fetchAiLeaderboard } from "../../api/aiJudgeApi";
import { fetchUserById } from "../../api/userMini";

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

      // 1) 최근 ENDED CODE 챌린지 조회
      const list = await fetchChallenges(0, 20, "CODE", "ENDED");
      const content = list?.content || [];
      if (!content.length) { setWinners([]); return; }
      // 종료일 기준 내림차순으로 가장 최근 종료 선택
      const latest = content.slice().sort((a: any, b: any) => new Date(b.endAt).getTime() - new Date(a.endAt).getTime())[0];

      // 2) week 추출 (ruleJson.week)
      let week: string | null = null;
      try {
        const detail = await fetchChallengeDetail(latest.id);
        // 1) 최우선: detail.aiWeek 컬럼
        week = (detail as any)?.aiWeek || null;
        if (!week) {
          // 2) ruleJson 안의 week
          const raw = (detail as any)?.ruleJson ?? latest.ruleJson;
          const parsed = typeof raw === 'string' ? JSON.parse(raw) : raw;
          week = parsed?.week || parsed?.aiWeek || null;
        }
      } catch {}
      if (!week) { setWinners([]); return; }

      // 3) AI 리더보드 상위 3 조회 + 이름 매핑
      const lb = await fetchAiLeaderboard(week);
      const top3 = (lb?.leaderboard || []).slice(0, 3);

      const idSet = new Set<number>();
      top3.forEach(e => { const n = Number(String(e.user)); if (Number.isFinite(n)) idSet.add(n); });
      const idArr = Array.from(idSet);
      const userMap = new Map<number, { name: string | null; profileImageUrl?: string }>();
      await Promise.all(idArr.map(async (id) => {
        const user = await fetchUserById(id);
        const name = user?.nickname || user?.displayName || user?.username || user?.userName || null;
        const profileImageUrl = user?.profileImageUrl || user?.profileImage || user?.avatarUrl || user?.avatar;
        console.log(`👤 User ${id}:`, { name, profileImageUrl, rawUser: user });
        userMap.set(id, { name, profileImageUrl });
      }));

      const winnersMapped: SimpleWinner[] = top3.map(e => {
        const n = Number(String(e.user));
        const fallback = `user ${e.user}`;
        const userInfo = Number.isFinite(n) && userMap.has(n) ? userMap.get(n)! : { name: null, profileImageUrl: undefined };
        const name = userInfo.name || fallback;
        return { rank: e.rank, name, profileImageUrl: userInfo.profileImageUrl, userId: Number.isFinite(n) ? n : undefined };
      });
      setWinners(winnersMapped);
    } catch (e) {
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


