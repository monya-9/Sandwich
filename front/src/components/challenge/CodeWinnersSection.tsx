// src/components/challenge/CodeWinnersSection.tsx
import React from "react";
import { fetchChallenges, fetchChallengeDetail } from "../../api/challengeApi";
import { fetchAiLeaderboard } from "../../api/aiJudgeApi";
import { fetchUserNameById } from "../../api/userMini";

type SimpleWinner = { rank: number; name: string };

const getMedalIcon = (rank: number) => {
  switch (rank) {
    case 1: return "🥇";
    case 2: return "🥈";
    case 3: return "🥉";
    default: return "🏅";
  }
};

function WinnerCard({ w }: { w: SimpleWinner }) {
  const initial = String(w.name || "?").charAt(0).toUpperCase();
  return (
    <div className="text-center">
      <div className="mb-2 text-3xl">{getMedalIcon(w.rank)}</div>
      <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mb-2 mx-auto">
        <span className="font-bold text-lg text-gray-700">{initial}</span>
      </div>
      <div className="font-semibold text-gray-800 mb-1 break-words text-sm">{w.name}</div>
      <div className="bg-gray-800 text-white px-3 py-1 rounded-full text-sm">{w.rank}위</div>
    </div>
  );
}

export default function CodeWinnersSection() {
  const [winners, setWinners] = React.useState<SimpleWinner[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    const run = async () => {
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
        const nameMap = new Map<number, string | null>();
        await Promise.all(idArr.map(async (id) => {
          const name = await fetchUserNameById(id);
          nameMap.set(id, name);
        }));

        const winnersMapped: SimpleWinner[] = top3.map(e => {
          const n = Number(String(e.user));
          const fallback = `user ${e.user}`;
          const name = Number.isFinite(n) && nameMap.has(n) ? (nameMap.get(n) || fallback) : fallback;
          return { rank: e.rank, name };
        });
        setWinners(winnersMapped);
      } catch (e) {
        setError("코드 리더보드를 불러오지 못했습니다.");
        setWinners([]);
      } finally {
        setLoading(false);
      }
    };
    run();
  }, []);

  // 데이터가 전혀 없고 에러도 아닌 경우에는 섹션 자체를 숨겨 미관 유지
  if (!loading && !error && winners.length === 0) return null;

  return (
    <div className="mx-auto mt-5 max-w-screen-xl px-4 md:px-6">
      <div className="flex justify-center w-full">
        <div className="flex flex-col w-full items-stretch">
          <h3 className="mb-3 text-[16px] font-extrabold tracking-[-0.01em] text-center">지난 코드 챌린지 TOP Winners</h3>
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


