// src/components/challenge/CodeWinnersSectionDummy.tsx
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { codeWinners } from "../../data/Challenge/winnersDummy";
import { fetchUserById } from "../../api/userMini";

type SimpleWinner = { rank: number; name?: string; profileImageUrl?: string; userId?: number; credits?: number; score?: number };

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
  const [realName, setRealName] = useState(w.name || "사용자");
  const [realProfileImage, setRealProfileImage] = useState<string | undefined>(undefined);
  const initial = String(realName || "?").charAt(0).toUpperCase();
  
  // 실제 사용자 정보 가져오기
  useEffect(() => {
    if (w.userId) {
      fetchUserById(w.userId)
        .then(user => {
          if (user) {
            // 닉네임 우선, 없으면 username 사용
            if (user.nickname) setRealName(user.nickname);
            else if (user.username) setRealName(user.username);
            if (user.profileImageUrl) setRealProfileImage(user.profileImageUrl);
          }
        })
        .catch(err => console.log('사용자 정보 로딩 실패:', err));
    }
  }, [w.userId]);
  
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
      <div 
        className="font-semibold text-gray-800 mb-1 break-words text-sm cursor-pointer hover:opacity-80 transition-opacity"
        onClick={handleProfileClick}
      >
        {realName}
      </div>
      <div className="bg-gray-800 text-white px-3 py-1 rounded-full text-sm">
        {w.score ? `${w.score.toFixed(2)}점` : w.credits ? `${w.credits.toLocaleString()}크레딧` : `${w.rank}위`}
      </div>
    </div>
  );
}

export default function CodeWinnersSectionDummy() {
  // 더미 데이터를 SimpleWinner 형식으로 변환
  const winners: SimpleWinner[] = codeWinners.map(w => ({
    rank: w.rank,
    name: w.name,
    profileImageUrl: w.profileImageUrl,
    userId: w.userId,
    credits: w.credits,
    score: w.score
  }));

  return (
    <div className="flex flex-col items-stretch">
      <h3 className="mb-3 text-2xl font-extrabold text-center">지난 코드 챌린지 TOP Winners</h3>
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
    </div>
  );
}

