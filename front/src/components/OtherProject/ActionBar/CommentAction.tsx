import React from "react";
import { FaCommentAlt } from "react-icons/fa";

interface CommentActionProps {
  onClick: () => void;
  isMobile?: boolean;
}

export default function CommentAction({ onClick, isMobile = false }: CommentActionProps) {
  return (
    <button
      className={`flex items-center group ${isMobile ? 'flex-col gap-0.5' : 'flex-col gap-1'}`}
      onClick={onClick}
    >
      <div className={`rounded-full bg-white shadow ring-1 ring-black/10 dark:ring-white/20 flex items-center justify-center ${isMobile ? 'w-10 h-10' : 'w-14 h-14 mb-1'}`}>
        <FaCommentAlt className={isMobile ? 'w-5 h-5' : 'w-7 h-7'} />
      </div>
      <span className={`font-semibold text-center ${isMobile ? 'text-xs text-gray-800' : 'text-sm text-white'}`} style={isMobile ? {} : { textShadow: "0 1px 2px rgba(0,0,0,0.6)" }}>댓글</span>
    </button>
  );
}
