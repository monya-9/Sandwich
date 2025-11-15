import React from "react";
import { FaLink } from "react-icons/fa";

interface LiveDemoActionProps {
  url?: string;
  deployEnabled?: boolean;
  isMobile?: boolean;
}

export default function LiveDemoAction({ url, deployEnabled = false, isMobile = false }: LiveDemoActionProps) {
  // deployEnabled=false 이면 비활성화
  // deployEnabled=true 이고 url이 있으면 활성화
  const isEnabled = deployEnabled && !!url;

  const inner = (
    <>
      <div className={`rounded-full bg-white shadow ring-1 ring-black/10 dark:ring-white/20 flex items-center justify-center ${isMobile ? 'w-10 h-10' : 'w-14 h-14 mb-1'}`}>
        <FaLink className={isMobile ? 'w-5 h-5' : 'w-7 h-7'} />
      </div>
      <span className={`font-semibold text-center ${isMobile ? 'text-xs text-gray-800 whitespace-nowrap' : 'text-sm text-white'}`} style={isMobile ? {} : { textShadow: "0 1px 2px rgba(0,0,0,0.6)" }}>
        {isMobile ? '라이브' : <>라이브<br />데모링크</>}
      </span>
    </>
  );

  return (
    <div className="relative">
      {isEnabled ? (
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className={`flex items-center group ${isMobile ? 'flex-col gap-0.5' : 'flex-col gap-1'}`}
          title={url}
        >
          {inner}
        </a>
      ) : (
        <button
          className={`flex items-center group opacity-40 cursor-not-allowed ${isMobile ? 'flex-col gap-0.5' : 'flex-col gap-1'}`}
          title={!deployEnabled ? "배포가 활성화되지 않았습니다." : "라이브 링크가 설정되지 않았습니다."}
          type="button"
          disabled
        >
          {inner}
        </button>
      )}
    </div>
  );
}
