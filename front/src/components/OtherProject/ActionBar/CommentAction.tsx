import React from "react";
import { FaCommentAlt } from "react-icons/fa";

export default function CommentAction({ onClick }: { onClick: () => void }) {
  return (
    <button
      className="flex flex-col items-center gap-1 group"
      onClick={onClick}
    >
      		<div className="w-14 h-14 rounded-full bg-white shadow flex items-center justify-center mb-1">
			<FaCommentAlt className="w-6 h-6 text-[#222]" />
		</div>
		<span className="text-xs text-white font-semibold text-center">댓글</span>
    </button>
  );
}
