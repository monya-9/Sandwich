import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { WinnerEntry, portfolioWinners } from "../../data/Challenge/winnersDummy";
import { fetchUserById } from "../../api/userMini";

/** 메달 아이콘 가져오기 */
const getMedalIcon = (rank: number) => {
    switch(rank) {
        case 1: return "🥇";
        case 2: return "🥈"; 
        case 3: return "🥉";
        default: return "🏅";
    }
};

/** 1·2·3등 카드 */
function WinnerCard({ data }: { data: WinnerEntry }) {
    const navigate = useNavigate();
    const [realName, setRealName] = useState(data.name || "사용자");
    const [realProfileImage, setRealProfileImage] = useState<string | undefined>(undefined);
    
    const { rank, teamName, userId, credits } = data;
    
    // 이니셜: userInitial이 있으면 사용, 없으면 realName의 첫 글자 사용
    const initial = data.userInitial || String(realName || "?").charAt(0).toUpperCase();

    // 실제 사용자 정보 가져오기
    useEffect(() => {
        if (userId) {
            fetchUserById(userId)
                .then(user => {
                    if (user) {
                        if (user.username) setRealName(user.username);
                        if (user.profileImageUrl) setRealProfileImage(user.profileImageUrl);
                    }
                })
                .catch(err => console.log('사용자 정보 로딩 실패:', err));
        }
    }, [userId]);

    // 팀명 제거 - 이름만 표시
    const displayName = realName;
    
    const handleProfileClick = () => {
        if (userId) {
            navigate(`/users/${userId}`);
        }
    };

    return (
        <div className="text-center">
            {/* 메달 아이콘 */}
            <div className="mb-2 text-3xl">
                {getMedalIcon(rank)}
            </div>
            
            {/* 프로필 이미지 또는 이니셜 - 클릭 가능 */}
            <div 
                className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mb-2 mx-auto overflow-hidden cursor-pointer hover:opacity-80 transition-opacity"
                onClick={handleProfileClick}
            >
                {realProfileImage ? (
                    <img 
                        src={realProfileImage} 
                        alt={realName}
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
            
            {/* 이름과 팀 이름 - 클릭 가능 */}
            <div 
                className="font-semibold text-gray-800 mb-1 break-words text-sm cursor-pointer hover:opacity-80 transition-opacity"
                onClick={handleProfileClick}
            >
                {displayName}
            </div>
            
            {/* 점수 또는 크레딧 */}
            <div className="bg-gray-800 text-white px-3 py-1 rounded-full text-sm">
                {data.score ? `${data.score.toFixed(2)}점` : credits ? `${credits.toLocaleString()}크레딧` : '0점'}
            </div>
        </div>
    );
}

/** 박스 본문 - 항상 데이터 표시 */
function WinnersBox({ items }: { items: WinnerEntry[] }) {
    return (
        <div className="bg-white rounded-2xl border border-gray-200 p-8 h-[240px] w-full box-border mx-auto flex items-center justify-center">
            <div className="grid grid-cols-3 items-center w-full">
                {[2, 1, 3].map((rank) => {
                    const w = items.find((x) => x.rank === rank);
                    return (
                        <div key={rank} className="flex-1 flex justify-center">
                            {w ? <WinnerCard data={w} /> : <div className="invisible"><div className="w-12 h-12" /></div>}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

/** 섹션 래퍼: 포트폴리오 챌린지 TOP Winners 표시 (더미 데이터 사용) */
export default function WinnersSectionDummy() {
    return (
        <div className="flex flex-col items-stretch">
            <h3 className="mb-3 text-2xl font-extrabold text-center">
                지난 포트폴리오 챌린지 TOP Winners
            </h3>
            <WinnersBox items={portfolioWinners} />
        </div>
    );
}

