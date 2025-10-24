import React, { useState } from "react";
import { FaQrcode } from "react-icons/fa";
import { getStaticUrl } from "../../../config/staticBase";

interface QrCodeActionProps {
  qrImageUrl: string;
  title?: string;
  thumbnailUrl?: string;
}

export default function QrCodeAction({ qrImageUrl, title, thumbnailUrl }: QrCodeActionProps) {
  const [open, setOpen] = useState(false);

  const finalTitle = title || "프로젝트 이름";
  const finalThumb = thumbnailUrl || getStaticUrl("assets/images/default-thumbnail.png");

  return (
    <div className="relative">
      <button
        className="flex flex-col items-center gap-1 group"
        onClick={() => setOpen(true)}
      >
        <div className="w-14 h-14 rounded-full bg-white shadow ring-1 ring-black/10 dark:ring-white/20 flex items-center justify-center mb-1">
          <FaQrcode className="w-7 h-7" />
        </div>
        <span className="text-sm text-white font-semibold text-center" style={{ textShadow: "0 1px 2px rgba(0,0,0,0.6)" }}>QR코드</span>
      </button>
      
      {/* 공유 모달과 동일한 레이아웃/크기 */}
      {open && (
        <>
          {/* 배경 */}
          <div
            className="fixed inset-0 z-40"
            style={{ background: "rgba(0, 0, 0, 0.65)" }}
            onClick={() => setOpen(false)}
          />

          {/* 컨테이너 */}
          <div className="fixed z-50 inset-0 flex items-center justify-center">
            <div
              className="bg-white w-[520px] max-w-[95vw] rounded-2xl shadow-2xl px-9 py-8 relative flex flex-col"
              style={{ fontFamily: "GmarketSans, sans-serif" }}
            >
              {/* 닫기 */}
              <button
                onClick={() => setOpen(false)}
                className="absolute right-8 top-8 text-gray-400 hover:text-black text-3xl"
                aria-label="닫기"
              >✕</button>

              {/* 제목 */}
              <div className="w-full font-bold text-[22px] mb-6 text-left pl-1 leading-tight">QR코드</div>
              <div className="w-full h-px bg-gray-200 mb-7" />

              {/* 썸네일 + 타이틀 */}
              <div className="flex items-center w-full mb-7 pl-1">
                <img
                  src={finalThumb}
                  alt="썸네일"
                  className="w-14 h-14 rounded-lg bg-gray-100 object-cover flex-shrink-0"
                />
                <div className="ml-4 flex flex-col justify-center">
                  <div className="font-bold text-[15px] text-black leading-snug whitespace-pre-line">
                    {finalTitle}
                  </div>
                </div>
              </div>
              <div className="w-full h-px bg-gray-200 mb-6" />

              {/* QR 이미지 영역 (SNS/URL 영역 대체) */}
              <div className="w-full flex items-center justify-center py-3">
                <img src={qrImageUrl} alt="프로젝트 QR" className="w-[320px] h-[320px] max-w-full max-h-[70vh] object-contain bg-white" />
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
