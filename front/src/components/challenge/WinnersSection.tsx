import React, { useState, useEffect } from "react";
import { SectionCard } from "./common";
import { Medal } from "lucide-react";
import { WinnerEntry } from "../../data/Challenge/winnersDummy";
import { 
    fetchChallenges, 
    fetchPortfolioLeaderboard,
    type ChallengeListItem,
    type LeaderboardEntry 
} from "../../api/challengeApi";

/** 메달 색상 */
const rankColor = (rank: 1 | 2 | 3) =>
    rank === 1 ? "text-amber-500" : rank === 2 ? "text-slate-400" : "text-orange-500";

/** 1·2·3등 카드(포디움 바 완전 제거) */
function WinnerCard({ data }: { data: WinnerEntry | LeaderboardEntry }) {
    // WinnerEntry와 LeaderboardEntry 모두 호환되도록 처리
    const rank = data.rank as 1 | 2 | 3;
    const userInitial = 'userInitial' in data ? data.userInitial : (data as LeaderboardEntry).userInitial;
    const name = 'name' in data ? data.name : (data as LeaderboardEntry).userName;
    const teamName = 'teamName' in data ? data.teamName : undefined;
    const credits = 'credits' in data ? data.credits : (data as LeaderboardEntry).credits || 0;

    return (
        <div className="flex flex-col items-center gap-2">
            <Medal className={`h-6 w-6 ${rankColor(rank)}`} />

            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-neutral-100 text-[13px] font-bold">
                {userInitial}
            </div>

            <div className="text-center leading-tight">
                <div className="text-[13px] font-semibold text-neutral-900">{name}</div>
                {teamName && <div className="text-[12px] text-neutral-500">{teamName}</div>}
            </div>

            <div className="rounded-xl bg-neutral-900/90 px-3 py-1 text-[12px] font-semibold text-white shadow-sm">
                {credits?.toLocaleString() || '0'} 크레딧
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
            <SectionCard
                bordered
                className="!px-5 !py-5 h-full min-h-[220px]"
            >
                <div className="flex items-center justify-center h-full">
                    <div className="text-center">
                        <div className="h-6 w-6 animate-spin rounded-full border-2 border-neutral-300 border-t-emerald-500 mx-auto mb-2"></div>
                        <div className="text-sm text-neutral-500">우승자 정보 로딩 중...</div>
                    </div>
                </div>
            </SectionCard>
        );
    }

    if (error || items.length === 0) {
        return (
            <SectionCard
                bordered
                className="!px-5 !py-5 h-full min-h-[220px]"
            >
                <div className="flex items-center justify-center h-full">
                    <div className="text-sm text-neutral-500 text-center">
                        {error || "아직 우승자 정보가 없습니다."}
                    </div>
                </div>
            </SectionCard>
        );
    }

    // 가운데 1등 보이도록 2-1-3 순서
    const byOrder = [
        items.find((w) => w.rank === 2),
        items.find((w) => w.rank === 1),
        items.find((w) => w.rank === 3)
    ].filter(Boolean) as (WinnerEntry | LeaderboardEntry)[];

    return (
        <SectionCard
            bordered
            className="!px-5 !py-5 h-full min-h-[220px]"
        >
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
                {byOrder.map((w) => (
                    <WinnerCard key={w.rank} data={w} />
                ))}
            </div>
        </SectionCard>
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
                setWinners(leaderboardData.entries.slice(0, 3)); // 상위 3명만
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
