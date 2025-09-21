import React from "react";

export default function PublicLikesGrid() {
  return (
    <div className="min-h-[360px] flex flex-col items-center justify-center text-center">
      <div className="mt-6 text-[16px] md:text-[18px] text-black/80">아직 좋아요한 작업이 없습니다.</div>
      <button className="mt-4 h-[42px] px-5 rounded-[21px] border border-black/20 text-[14px] flex items-center text-black bg-white" disabled>
        크리에이터를 발견하러 가기
      </button>
    </div>
  );
} 