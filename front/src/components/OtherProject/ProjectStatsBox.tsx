import React from "react";
import { FaHeart } from "react-icons/fa";
import { FaEye, FaCommentDots } from "react-icons/fa";

type Props = {
  likes: number;
  views: number;
  comments: number;
  projectName: string;
  date: string;
  category?: string;
  badge?: string;
  // 액션 타겟 지정용 (지표 조회용으로만 유지)
  projectId?: number;
  // 상단 사용자 표시(아바타+닉네임)
  ownerName?: string;
  ownerEmail?: string;
  ownerImageUrl?: string | null;
  ownerId?: number;
};

export default function ProjectStatsBox({ likes, views, comments, projectName, date, category, badge, projectId, ownerName, ownerEmail, ownerImageUrl, ownerId, }: Props) {
  const displayName = (projectName || "").trim();
  const hasCategory = !!(category && category.trim().length > 0);

  return (
    <div className="-mx-8 bg-[#FFA724] text-white w-auto mb-8">
      <div className="max-w-[1800px] mx-auto py-6 px-6 flex flex-col items-center">
        {/* 사용자 아바타 + 닉네임 (요청 사항: 버튼 삭제, 중앙 배치) */}
        <div className="flex flex-col items-center gap-3 mb-4">
          <button
            type="button"
            className="w-16 h-16 rounded-full overflow-hidden bg-gray-200 text-gray-700 font-bold flex items-center justify-center"
            onClick={() => {
              try {
                if (ownerId) {
                  const myId = Number(localStorage.getItem('userId') || sessionStorage.getItem('userId') || '0');
                  const href = (myId && ownerId && myId === ownerId) ? '/profile' : `/users/${ownerId}`;
                  window.location.href = href;
                }
              } catch {}
            }}
            title="프로필 보기"
          >
            {ownerImageUrl ? (
              <img src={ownerImageUrl} alt="avatar" className="w-full h-full object-cover" />
            ) : (
              <span className="text-xl">{((ownerEmail?.[0] || ownerName?.[0] || '?') as string).toUpperCase()}</span>
            )}
          </button>
          <div className="text-[20px] text-[#1F2937]">{ownerName || ''}</div>
        </div>
        <div className="w-16 h-[2px] bg-white/60 mb-3 rounded" />

        {/* (선택) 배지 */}
        {badge && (
          <div className="flex items-center gap-2 mb-4">
            <span className="inline-block bg-cyan-700 text-xs font-semibold px-3 py-1 rounded text-cyan-100">
              {badge}
            </span>
          </div>
        )}

        {/* 프로젝트명, 날짜, 통계 */}
        {displayName && <div className="text-2xl font-bold mb-2 text-center text-[#1F2937]">{displayName}</div>}
        <div className="mb-6 text-center text-[#374151]">
          {hasCategory ? (<>{date} | {category}</>) : date}
        </div>
        <div className="flex justify-center gap-8 text-[#374151] text-lg">
          <div className="inline-flex items-center gap-2 h-5 align-middle">
            <FaEye className="w-5 h-5 text-[#374151]" />
            <span className="leading-none relative top-[1px]">{views}</span>
          </div>
          <div className="inline-flex items-center gap-2 h-5 align-middle">
            <FaHeart className="w-5 h-5 text-[#374151]" />
            <span className="leading-none relative top-[1px]">{likes}</span>
          </div>
          <div className="inline-flex items-center gap-2 h-5 align-middle">
            <FaCommentDots className="w-5 h-5 text-[#374151]" />
            <span className="leading-none relative top-[1px]">{comments}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
