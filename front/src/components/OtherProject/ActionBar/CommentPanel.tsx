import React from "react";
import { FaHeart, FaFolderMinus, FaShareAlt } from "react-icons/fa";

interface CommentPanelProps {
  onClose: () => void;
  projectName: string;
  category: string;
  width?: number | string;  // width prop 추가!
}

interface CommentPanelProps {
  onClose: () => void;
  projectName: string;
  category: string;
  width?: number | string;
  height?: number | string;
}

export default function CommentPanel({
  onClose,
  projectName,
  category,
  width = 560,
  height = "100%", // <- height 동기화
}: CommentPanelProps) {
  return (
    <aside
      className="
        bg-white shadow-2xl border border-gray-200 flex flex-col z-40 transition-all
        rounded-2xl
      "
      style={{
        width,
        minWidth: 320,
        maxWidth: 560,
        height, // <- 이 부분!
        borderRadius: "16px",
        boxShadow: "0 8px 32px 0 rgba(34,34,34,.16)",
        background: "#fff",
        border: "none",
      }}
    >
      {/* 상단 영역 */}
      <div className="relative pt-8 pb-3 px-8 bg-white rounded-t-2xl border-b border-gray-100">
        {/* 닫기 버튼 */}
        <button
          className="absolute right-6 top-7 text-2xl text-gray-400 hover:text-black transition"
          aria-label="닫기"
          onClick={onClose}
        >
          ×
        </button>
        <div className="text-base font-bold text-gray-900 mb-0.5">{projectName}</div>
        <div className="text-xs text-gray-500">{category}</div>
      </div>
      {/* 아이콘 버튼 영역 */}
      <div className="flex flex-row items-center justify-start gap-3 px-8 py-3 border-b border-gray-100">
        <button className="flex items-center justify-center rounded-full hover:bg-gray-100 w-9 h-9 group transition">
          <FaHeart className="text-lg text-gray-400 group-hover:text-pink-500 transition" />
        </button>
        <button className="flex items-center justify-center rounded-full hover:bg-gray-100 w-9 h-9 group transition">
          <FaFolderMinus className="text-lg text-gray-400 group-hover:text-yellow-500 transition" />
        </button>
        <button className="flex items-center justify-center rounded-full hover:bg-gray-100 w-9 h-9 group transition">
          <FaShareAlt className="text-lg text-gray-400 group-hover:text-blue-500 transition" />
        </button>
      </div>
      {/* 댓글 입력 폼 */}
      <div className="flex-1 flex flex-col px-8 pt-6 pb-7 bg-white">
        <div className="mb-3 text-base font-bold">댓글(0)</div>
        <textarea
          className="w-full h-24 p-4 mb-4 border border-gray-200 rounded-xl focus:outline-[#19c37d] resize-none bg-gray-50 text-sm"
          placeholder="이 작업에 대한 댓글을 남겨주세요."
        />
        <div className="flex gap-3 justify-end mb-3">
          <button className="px-5 py-2 bg-black text-white rounded-full font-bold text-sm">댓글 작성</button>
          <button className="px-5 py-2 bg-gray-200 text-black rounded-full font-bold text-sm" onClick={onClose}>취소</button>
        </div>
      </div>
    </aside>
  );
}
