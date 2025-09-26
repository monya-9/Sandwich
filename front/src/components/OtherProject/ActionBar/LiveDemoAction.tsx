import React from "react";
import { FaLink } from "react-icons/fa";

export default function LiveDemoAction() {
  return (
    <div className="relative">
      <button
        className="flex flex-col items-center gap-1 group"
      >
        <div className="w-14 h-14 rounded-full bg-white shadow flex items-center justify-center mb-1">
          <FaLink className="w-6 h-6" />
        </div>
        		<span className="text-xs text-white font-semibold text-center">
			라이브<br />데모링크
		</span>
      </button>
    </div>
  );
}
