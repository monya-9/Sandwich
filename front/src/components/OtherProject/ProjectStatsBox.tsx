import React, { useEffect, useState } from "react";
import { FaHeart } from "react-icons/fa";
import { FaFolderMinus } from "react-icons/fa6";
import { FaEye, FaCommentDots } from "react-icons/fa";

type Props = {
  likes: number;
  views: number;
  comments: number;
  projectName: string;
  date: string;
  category?: string;
  badge?: string;
  hasCollected?: boolean;
};

export default function ProjectStatsBox({ likes, views, comments, projectName, date, category, badge, hasCollected = false, }: Props) {
  const displayName = (projectName || "").trim();
  const hasCategory = !!(category && category.trim().length > 0);
  const [collected, setCollected] = useState<boolean>(hasCollected);

  useEffect(() => setCollected(hasCollected), [hasCollected]);
  useEffect(() => {
    const handler = (e: any) => { try { setCollected(!!e?.detail?.hasCollected); } catch {} };
    window.addEventListener("collection:membership", handler as any);
    return () => window.removeEventListener("collection:membership", handler as any);
  }, []);

  const openCollectionPicker = () => {
    try {
      window.dispatchEvent(new CustomEvent("collection:open"));
    } catch {}
  };
  return (
    <div className="-mx-8 bg-black text-white w-auto mb-8">
      <div className="max-w-[1800px] mx-auto py-10 px-6 flex flex-col items-center">
        {/* 버튼 영역 (가로 넓은 타원형 + 세로정렬 아이콘/텍스트) */}
        <div className="flex justify-center gap-8 mb-8">
          <button className="
            flex flex-col items-center justify-center
            bg-[#ff668a] text-white
            w-[300px] py-7 rounded-full
            text-2xl font-bold shadow
            hover:bg-[#ff4e79] transition
          ">
            <FaHeart className="w-8 h-8 mb-2" />
            작업 좋아요
          </button>
          <button onClick={openCollectionPicker} className={`
            flex flex-col items-center justify-center
            w-[300px] py-7 rounded-full text-2xl font-bold shadow transition
            ${collected ? "bg-[#068334] text-white hover:bg-[#05702C]" : "bg-white border-2 border-black text-black hover:bg-gray-100"}
          `}>
            <FaFolderMinus className="w-8 h-8 mb-2" />
            컬렉션 저장
          </button>
        </div>

        {/* (선택) 배지 */}
        {badge && (
          <div className="flex items-center gap-2 mb-4">
            <span className="inline-block bg-cyan-700 text-xs font-semibold px-3 py-1 rounded text-cyan-100">
              {badge}
            </span>
          </div>
        )}

        {/* 프로젝트명, 날짜, 통계 */}
        {displayName && <div className="text-2xl font-bold mb-2 text-center">{displayName}</div>}
        <div className="mb-6 text-center text-gray-300">
          {hasCategory ? (<>{date} | {category}</>) : date}
        </div>
        <div className="flex justify-center gap-8 text-gray-200 text-lg">
          <div className="inline-flex items-center gap-2 h-5 align-middle">
            <FaEye className="w-5 h-5" />
            <span className="leading-none relative top-[1px]">{views}</span>
          </div>
          <div className="inline-flex items-center gap-2 h-5 align-middle">
            <FaHeart className="w-5 h-5" />
            <span className="leading-none relative top-[1px]">{likes}</span>
          </div>
          <div className="inline-flex items-center gap-2 h-5 align-middle">
            <FaCommentDots className="w-5 h-5" />
            <span className="leading-none relative top-[1px]">{comments}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
