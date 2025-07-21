import React, { useState } from "react";
import { FaFolderMinus } from "react-icons/fa6";

export default function CollectionAction() {
  const [hover, setHover] = useState(false);

  return (
    <div className="relative">
      <button
        className="flex flex-col items-center gap-1 group"
        onMouseEnter={() => setHover(true)}
        onMouseLeave={() => setHover(false)}
      >
        <div className="w-14 h-14 rounded-full bg-white shadow flex items-center justify-center mb-1">
          <FaFolderMinus className="w-6 h-6" />
        </div>
        <span className="text-xs text-gray-800 font-semibold text-center">컬렉션</span>
      </button>
      {hover && (
        <div className="absolute right-[calc(100%+10px)] top-1/2 -translate-y-1/2 z-50 px-4 py-2 rounded-xl bg-black text-white text-sm shadow">
          컬렉션에 추가
        </div>
      )}
    </div>
  );
}
