import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
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
    const navigate = useNavigate();
    
    // WinnerEntry와 LeaderboardEntry 모두 호환되도록 처리
    const rank = data.rank as 1 | 2 | 3;
    const userInitial = 'userInitial' in data ? data.userInitial : (data as LeaderboardEntry).userInitial;
    const name = 'name' in data ? data.name : (data as LeaderboardEntry).userName;
    const teamName = 'teamName' in data ? data.teamName : undefined;
    const profileImageUrl = 'profileImageUrl' in data ? data.profileImageUrl : undefined;
    const userId = 'userId' in data ? data.userId : undefined;
    
    console.log('👤 WinnerCard:', { rank, name, profileImageUrl, userId, data });

    // 이름과 팀 이름을 "제출자 이름 • 팀 이름" 형식으로 표시
    const displayName = teamName ? `${name} • ${teamName}` : name;
    
    const handleProfileClick = () => {
        if (userId) {
            navigate(`/users/${userId}`);
        }
    };

    return (
        <div className="text-center px-2 sm:px-3">
            {/* 메달 아이콘 */}
            <div className="mb-2 text-2xl sm:text-3xl">
                {getMedalIcon(rank)}
            </div>
            
            {/* 프로필 이미지 또는 이니셜 - 클릭 가능 */}
            <div 
                className="w-10 h-10 sm:w-12 sm:h-12 bg-gray-100 rounded-full flex items-center justify-center mb-2 mx-auto overflow-hidden cursor-pointer hover:opacity-80 transition-opacity"
                onClick={handleProfileClick}
            >
                {profileImageUrl ? (
                    <img 
                        src={profileImageUrl} 
                        alt={name}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.style.display = 'none';
                            target.parentElement!.innerHTML = `<span class="font-bold text-base sm:text-lg text-gray-700">${userInitial}</span>`;
                        }}
                    />
                ) : (
                    <span className="font-bold text-base sm:text-lg text-gray-700">{userInitial}</span>
                )}
            </div>
            
            {/* 이름과 팀 이름 - 클릭 가능 */}
            <div 
                className="font-semibold text-gray-800 mb-2 break-words text-xs sm:text-sm cursor-pointer hover:opacity-80 transition-opacity px-1"
                onClick={handleProfileClick}
            >
                {displayName}
            </div>
            
            {/* 크레딧 또는 점수 */}
            <div className="bg-gray-800 text-white px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm w-16 sm:w-20 text-center mx-auto">
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
            <div className="bg-white rounded-2xl border border-gray-200 p-8 h-[240px] w-full">
                <div className="flex items-center justify-center h-full">
                    <div className="text-center">
                        <div className="h-6 w-6 animate-spin rounded-full border-2 border-neutral-300 border-t-emerald-500 mx-auto mb-2"></div>
                        <div className="text-sm text-neutral-500">우승자 정보 로딩 중...</div>
                    </div>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="bg-white rounded-2xl border border-gray-200 p-8 h-[240px] w-full">
                <div className="flex items-center justify-center h-full">
                    <div className="text-sm text-neutral-500 text-center">
                        {error}
                    </div>
                </div>
            </div>
        );
    }

    // 데이터가 없을 때 안내 메시지 표시
    if (items.length === 0) {
        return (
            <div className="bg-white rounded-2xl border border-gray-200 p-8 h-[240px] w-full">
                <div className="flex items-center justify-center h-full">
                    <div className="text-base text-neutral-600 text-center font-medium">
                        지난 포트폴리오 챌린지 우승자 정보가 없습니다.
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
        <div className="bg-white rounded-2xl border border-gray-200 p-4 sm:p-6 md:p-8 min-h-[240px] w-full box-border mx-auto flex items-center justify-center">
            <div className="grid grid-cols-3 gap-2 sm:gap-4 md:gap-6 items-center w-full max-w-2xl mx-auto">
                {[2, 1, 3].map((rank) => {
                    const w = items.find((x) => x.rank === rank);
                    return (
                        <div key={rank} className="flex justify-center">
                            {w ? <WinnerCard data={w} /> : <div className="invisible"><div className="w-10 h-10 sm:w-12 sm:h-12" /></div>}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

/** 섹션 래퍼: 포트폴리오 TOP Winners만 표시 */
export default function WinnersSection() {
    const [winners, setWinners] = useState<LeaderboardEntry[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchWinnersData = async () => {
        try {
            setLoading(true);
            
            // 1. 종료된 포트폴리오 챌린지 목록 가져오기 (종료일 기준 최신순)
            const challengesResponse = await fetchChallenges(0, 10, "PORTFOLIO", "ENDED", { sort: "endAt,desc" });
            const endedPortfolioChallenges = challengesResponse.content;
            
            console.log('🧩 ENDED 포트폴리오 챌린지 목록:', endedPortfolioChallenges.map(c => ({
                id: c.id,
                title: c.title,
                endAt: c.endAt,
            })));
            
            if (endedPortfolioChallenges.length === 0) {
                setWinners([]);
                setError(null);
                return;
            }

            // 2. 가장 최근 종료된 포트폴리오 챌린지 선택
            const latestChallenge = endedPortfolioChallenges[0]; // 이미 날짜순 정렬되어 있음
            console.log('✅ WinnersSection이 선택한 latestChallenge:', latestChallenge.id, latestChallenge.title);
            
            // 3. 해당 챌린지의 리더보드 가져오기
            const leaderboardData = await fetchPortfolioLeaderboard(latestChallenge.id, 3);
            console.log('🏆 리더보드 raw 응답:', leaderboardData);
            
            setWinners(leaderboardData.entries.slice(0, 3));
            setError(null);
            
        } catch (err) {
            setError("우승자 정보를 불러올 수 없습니다.");
            setWinners([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchWinnersData();
    }, []);

    // 페이지 가시성 변경 시 새로고침 (챌린지 상태 변경 감지)
    useEffect(() => {
        const handleVisibilityChange = () => {
            if (!document.hidden) {
                console.log('🔄 포트폴리오 Winners 섹션 새로고침');
                fetchWinnersData();
            }
        };

        const handleChallengeStatusChange = () => {
            console.log('🔄 챌린지 상태 변경 감지 - 포트폴리오 Winners 섹션 새로고침');
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
                {/* 포트폴리오만 - 더 넓게 표시 */}
                <div className="flex flex-col w-full items-stretch">
                    <h3 className="mb-3 text-xl sm:text-2xl font-extrabold text-center px-2">
                        지난 포트폴리오 챌린지 TOP Winners
                    </h3>
                    <WinnersBox items={winners} loading={loading} error={error} />
                </div>
            </div>
        </div>
    );
}
