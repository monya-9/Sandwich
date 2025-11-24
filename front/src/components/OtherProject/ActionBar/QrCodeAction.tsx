import React, { useState } from "react";
import ReactDOM from "react-dom";
import { FaQrcode } from "react-icons/fa";
import { getStaticUrl } from "../../../config/staticBase";

interface QrCodeActionProps {
  qrImageUrl: string;
  title?: string;
  thumbnailUrl?: string;
  isMobile?: boolean;
  deployEnabled?: boolean;
  qrCodeEnabled?: boolean;
}

export default function QrCodeAction({ qrImageUrl, title, thumbnailUrl, isMobile = false, deployEnabled = false, qrCodeEnabled = false }: QrCodeActionProps) {
  const [open, setOpen] = useState(false);

  const finalTitle = title || "프로젝트 이름";
  const finalThumb = thumbnailUrl || getStaticUrl("assets/images/default-thumbnail.png");

  // deployEnabled=false 이거나 qrCodeEnabled=false 이면 비활성화
  const isDisabled = !deployEnabled || !qrCodeEnabled;

  return (
    <div className="relative">
      <button
        className={`flex items-center group ${isMobile ? 'flex-col gap-0.5' : 'flex-col gap-1'} ${isDisabled ? 'opacity-40 cursor-not-allowed' : ''}`}
        onClick={() => !isDisabled && setOpen(true)}
        disabled={isDisabled}
        title={isDisabled ? (!deployEnabled ? "배포가 활성화되지 않았습니다." : "QR 코드가 생성되지 않았습니다.") : ""}
      >
        <div className={`rounded-full bg-white shadow ring-1 ring-black/10 dark:ring-white/20 flex items-center justify-center ${isMobile ? 'w-10 h-10' : 'w-14 h-14 mb-1'}`}>
          <FaQrcode className={isMobile ? 'w-5 h-5' : 'w-7 h-7'} />
        </div>
        <span className={`font-semibold text-center ${isMobile ? 'text-xs text-gray-800' : 'text-sm text-white'}`} style={isMobile ? {} : { textShadow: "0 1px 2px rgba(0,0,0,0.6)" }}>QR코드</span>
      </button>
      
      {/* 공유 모달과 동일한 레이아웃/크기 */}
      {open && ReactDOM.createPortal(
        <>
          {/* 배경 */}
          <div
            className="fixed inset-0 z-[100000]"
            style={{ background: "rgba(0, 0, 0, 0.65)" }}
            onClick={() => setOpen(false)}
          />

          {/* 컨테이너 */}
          <div className="fixed z-[100001] inset-0 flex items-center justify-center p-3 sm:p-4">
            <div
              className="bg-white dark:bg-[var(--surface)] w-full sm:w-[520px] max-w-[95vw] rounded-xl sm:rounded-2xl shadow-2xl px-4 py-6 sm:px-6 sm:py-7 md:px-9 md:py-8 relative flex flex-col"
              style={{ fontFamily: "GmarketSans, sans-serif" }}
            >
              {/* 닫기 */}
              <button
                onClick={() => setOpen(false)}
                className="absolute right-4 top-4 sm:right-6 sm:top-6 md:right-8 md:top-8 text-gray-400 hover:text-black dark:hover:text-white text-2xl sm:text-3xl"
                aria-label="닫기"
              >✕</button>

              {/* 제목 */}
              <div className="w-full font-bold text-lg sm:text-xl md:text-[22px] mb-4 sm:mb-5 md:mb-6 text-left pl-0 sm:pl-1 leading-tight dark:text-white">QR코드</div>
              <div className="w-full h-px bg-gray-200 dark:bg-[var(--border-color)] mb-4 sm:mb-5 md:mb-7" />

              {/* 썸네일 + 타이틀 */}
              <div className="flex items-center w-full mb-4 sm:mb-5 md:mb-7 pl-0 sm:pl-1">
                <img
                  src={finalThumb}
                  alt="썸네일"
                  className="w-12 h-12 sm:w-14 sm:h-14 rounded-lg bg-gray-100 dark:bg-[var(--surface)] object-cover flex-shrink-0"
                />
                <div className="ml-3 sm:ml-4 flex flex-col justify-center min-w-0 flex-1">
                  <div className="font-bold text-sm sm:text-[15px] text-black dark:text-white leading-snug whitespace-pre-line line-clamp-2">
                    {finalTitle}
                  </div>
                </div>
              </div>
              <div className="w-full h-px bg-gray-200 dark:bg-[var(--border-color)] mb-4 sm:mb-5 md:mb-6" />

              {/* QR 이미지 영역 (SNS/URL 영역 대체) */}
              <div className="w-full flex items-center justify-center py-2 sm:py-3">
                <img src={qrImageUrl} alt="프로젝트 QR" className="w-[280px] h-[280px] sm:w-[320px] sm:h-[320px] max-w-full max-h-[60vh] sm:max-h-[70vh] object-contain bg-white" />
              </div>
            </div>
          </div>
        </>,
        document.body
      )}
    </div>
  );
}
