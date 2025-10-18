import React, { useState, useEffect } from "react";
import { WinnerEntry } from "../../data/Challenge/winnersDummy";
import { 
    fetchChallenges, 
    fetchPortfolioLeaderboard,
    type LeaderboardEntry 
} from "../../api/challengeApi";

/** 메달 아이콘 가져오기 */
const getMedalIcon = (rank: number) => {
    switch(rank) {
        case 1: return "🥇";
        case 2: return "🥈"; 
        case 3: return "🥉";
        default: return "🏅";
    }
};

/** 1·2·3등 카드(ChallengeDetailPage와 동일한 스타일) */
function WinnerCard({ data }: { data: WinnerEntry | LeaderboardEntry }) {
    // WinnerEntry와 LeaderboardEntry 모두 호환되도록 처리
    const rank = data.rank as 1 | 2 | 3;
    const userInitial = 'userInitial' in data ? data.userInitial : (data as LeaderboardEntry).userInitial;
    const name = 'name' in data ? data.name : (data as LeaderboardEntry).userName;
    const teamName = 'teamName' in data ? data.teamName : undefined;

    // 이름과 팀 이름을 "제출자 이름 • 팀 이름" 형식으로 표시
    const displayName = teamName ? `${name} • ${teamName}` : name;

    return (
        <div className="text-center">
            {/* 메달 아이콘 */}
            <div className="mb-2 text-4xl">
                {getMedalIcon(rank)}
            </div>
            
            {/* 이니셜 */}
            <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mb-2 mx-auto">
                <span className="font-bold text-lg text-gray-700">{userInitial}</span>
            </div>
            
            {/* 이름과 팀 이름 */}
            <div className="font-semibold text-gray-800 mb-1 break-words">
                {displayName}
            </div>
            
            {/* 크레딧 또는 점수 */}
            <div className="bg-gray-800 text-white px-3 py-1 rounded-full text-sm">
                {'totalScore' in data && data.totalScore ? `${data.totalScore.toFixed(2)}점` : 
                 data.credits ? `${data.credits.toLocaleString()} 크레딧` : 
                 'voteCount' in data ? `${data.voteCount || 0}표` : '0표'}
            </div>
        </div>
    );
}

/** 박스 본문(제목은 카드 밖으로 빼고, 카드 높이 동일화) */
function WinnersBox({ items, loading, error }: { 
    items: (WinnerEntry | LeaderboardEntry)[], 
    loading: boolean, 
    error: string | null 
}) {
    if (loading) {
        return (
            <div className="bg-white rounded-2xl border border-gray-200 p-6">
                <div className="flex items-center justify-center h-full">
                    <div className="text-center">
                        <div className="h-6 w-6 animate-spin rounded-full border-2 border-neutral-300 border-t-emerald-500 mx-auto mb-2"></div>
                        <div className="text-sm text-neutral-500">우승자 정보 로딩 중...</div>
                    </div>
                </div>
            </div>
        );
    }

    if (error || items.length === 0) {
        return (
            <div className="bg-white rounded-2xl border border-gray-200 p-6">
                <div className="flex items-center justify-center h-full">
                    <div className="text-sm text-neutral-500 text-center">
                        {error || "아직 우승자 정보가 없습니다."}
                    </div>
                </div>
            </div>
        );
    }

    // 가운데 1등 보이도록 2-1-3 순서
    const byOrder = [
        items.find((w) => w.rank === 2),
        items.find((w) => w.rank === 1),
        items.find((w) => w.rank === 3)
    ].filter(Boolean) as (WinnerEntry | LeaderboardEntry)[];

    return (
        <div className="bg-white rounded-2xl border border-gray-200 p-6">
            <div className="flex justify-between items-start w-full">
                {byOrder.map((w) => (
                    <div key={w.rank} className="flex-1 flex justify-center">
                        <WinnerCard data={w} />
                    </div>
                ))}
            </div>
        </div>
    );
}

/** 섹션 래퍼: 포트폴리오 TOP Winners만 표시 */
export default function WinnersSection() {
    const [winners, setWinners] = useState<LeaderboardEntry[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchWinnersData = async () => {
            try {
                setLoading(true);
                
                // 1. 종료된 포트폴리오 챌린지 목록 가져오기
                const challengesResponse = await fetchChallenges(0, 10, "PORTFOLIO", "ENDED");
                const endedPortfolioChallenges = challengesResponse.content;
                
                if (endedPortfolioChallenges.length === 0) {
                    setWinners([]);
                    setError(null);
                    return;
                }

                // 2. 가장 최근 종료된 포트폴리오 챌린지 선택
                const latestChallenge = endedPortfolioChallenges[0]; // 이미 날짜순 정렬되어 있음
                
                // 3. 해당 챌린지의 리더보드 가져오기
                const leaderboardData = await fetchPortfolioLeaderboard(latestChallenge.id, 3);
                
                console.log('리더보드 데이터:', leaderboardData.entries);
                
                setWinners(leaderboardData.entries.slice(0, 3));
                setError(null);
                
            } catch (err) {
                setError("우승자 정보를 불러올 수 없습니다.");
                setWinners([]);
            } finally {
                setLoading(false);
            }
        };

        fetchWinnersData();
    }, []);

    return (
        <div className="mx-auto mt-5 max-w-screen-xl px-4 md:px-6">
            <div className="flex justify-center">
                {/* 포트폴리오만 - 중앙 정렬 */}
                <div className="flex flex-col max-w-md w-full">
                    <h3 className="mb-3 text-[16px] font-extrabold tracking-[-0.01em] text-center">
                        지난 포트폴리오 챌린지 TOP Winners
                    </h3>
                    <WinnersBox items={winners} loading={loading} error={error} />
                </div>
            </div>
        </div>
    );
}
