import React from "react";
import { FaLink } from "react-icons/fa";

export default function LiveDemoAction({ url }: { url?: string }) {
  const inner = (
    <>
      <div className="w-14 h-14 rounded-full bg-white shadow flex items-center justify-center mb-1">
        <FaLink className="w-7 h-7" />
      </div>
      <span className="text-sm text-white font-semibold text-center" style={{ textShadow: "0 1px 2px rgba(0,0,0,0.6)" }}>
        라이브<br />데모링크
      </span>
    </>
  );

  return (
    <div className="relative">
      {url ? (
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="flex flex-col items-center gap-1 group"
          title={url}
        >
          {inner}
        </a>
      ) : (
        <button
          className="flex flex-col items-center gap-1 group opacity-60 cursor-not-allowed"
          title="라이브 링크가 설정되지 않았습니다."
          type="button"
          disabled
        >
          {inner}
        </button>
      )}
    </div>
  );
}
