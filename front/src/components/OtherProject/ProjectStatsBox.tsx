import React from "react";
import { FaHeart } from "react-icons/fa";
import { FaFolderMinus } from "react-icons/fa6";

type Props = {
  likes: number;
  collections: number;
  views: number;
  comments: number;
  projectName: string;
  date: string;
  category: string;
  badge?: string;
};

export default function ProjectStatsBox({
  likes,
  collections,
  views,
  comments,
  projectName,
  date,
  category,
  badge,
}: Props) {
  return (
    <div className="bg-black py-10 px-4 mb-8 text-white w-full flex flex-col items-center">
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
        <button className="
          flex flex-col items-center justify-center
          bg-white border-2 border-black text-black
          w-[300px] py-7 rounded-full
          text-2xl font-bold shadow
          hover:bg-gray-100 transition
        ">
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
      <div className="text-2xl font-bold mb-2 text-center">{projectName}</div>
      <div className="mb-4 text-center text-gray-300">
        {date} | {category}
      </div>
      <div className="flex justify-center gap-6 text-gray-300 text-lg">
        <span>👁️ {views}</span>
        <span>💬 {comments}</span>
        <span>🗂️ {collections}</span>
      </div>
    </div>
  );
}
