import React from "react";
import { FaCommentAlt } from "react-icons/fa";

export default function CommentAction({ onClick }: { onClick: () => void }) {
  return (
    <button
      className="flex flex-col items-center gap-1 group"
      onClick={onClick}
    >
      <div className="w-14 h-14 rounded-full bg-white shadow ring-1 ring-black/10 dark:ring-white/20 flex items-center justify-center mb-1">
        <FaCommentAlt className="w-7 h-7" />
      </div>
      <span className="text-sm text-white font-semibold text-center" style={{ textShadow: "0 1px 2px rgba(0,0,0,0.6)" }}>댓글</span>
    </button>
  );
}
