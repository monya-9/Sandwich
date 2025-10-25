import React, { useState } from "react";
import ReactDOM from "react-dom";
import { FaShareAlt } from "react-icons/fa";
import Toast from "../../common/Toast";
import { getStaticUrl } from "../../../config/staticBase";

type ShareActionProps = {
  shareUrl?: string;
  thumbnailUrl?: string;
  title?: string;
  isMobile?: boolean;
};

export default function ShareAction({ shareUrl, thumbnailUrl, title, isMobile = false }: ShareActionProps) {
  const [open, setOpen] = useState(false);
  const [toast, setToast] = useState<{ visible: boolean; message: string }>({
    visible: false,
    message: ''
  });

  const finalShareUrl = shareUrl || (typeof window !== "undefined" ? window.location.href : "");
  const finalTitle = title || "프로젝트 이름";
  const finalThumb = thumbnailUrl || getStaticUrl("assets/images/default-thumbnail.png");

  const handleCopy = () => {
    if (!finalShareUrl) return;
    navigator.clipboard.writeText(finalShareUrl);
    setToast({
      visible: true,
      message: "URL이 복사되었습니다!"
    });
  };

  return (
    <>
      <Toast
        visible={toast.visible}
        message={toast.message}
        type="success"
        size="medium"
        autoClose={2000}
        closable={true}
        onClose={() => setToast((prev: { visible: boolean; message: string }) => ({ ...prev, visible: false }))}
      />
      <div className="relative font-gmarket">
      {/* 공유 버튼 (사이드바, 크기 그대로) */}
      <button
        className={`flex items-center group ${isMobile ? 'flex-col gap-0.5' : 'flex-col gap-1'}`}
        onClick={() => setOpen(true)}
      >
        <div className={`rounded-full bg-white shadow ring-1 ring-black/10 dark:ring-white/20 flex items-center justify-center ${isMobile ? 'w-10 h-10' : 'w-14 h-14 mb-1'}`}>
          <FaShareAlt className={isMobile ? 'w-5 h-5' : 'w-7 h-7'} />
        </div>
        <span className={`font-semibold text-center ${isMobile ? 'text-xs text-gray-800' : 'text-sm text-white'}`} style={isMobile ? {} : { textShadow: "0 1px 2px rgba(0,0,0,0.6)" }}>공유하기</span>
      </button>

      {/* 모달 */}
      {open && ReactDOM.createPortal(
        <>
          {/* 배경 */}
          <div
           className="fixed inset-0 z-[10000]"
           style={{ background: "rgba(0, 0, 0, 0.65)" }}
           onClick={() => setOpen(false)}
          />
          {/* 데스크탑 기준 중앙 고정 & 적정 너비 */}
          <div className="fixed z-[10001] inset-0 flex items-center justify-center">
            <div
              className="
                bg-white w-[520px] max-w-[95vw]
                rounded-2xl shadow-2xl px-9 py-8
                relative flex flex-col
              "
              style={{ fontFamily: "GmarketSans, sans-serif" }}
            >
              {/* 닫기 버튼 */}
              <button
                onClick={() => setOpen(false)}
                className="absolute right-8 top-8 text-gray-400 hover:text-black text-3xl"
                aria-label="닫기"
              >✕</button>

              {/* 제목 - 왼쪽 정렬 */}
              <div className="w-full font-bold text-[22px] mb-6 text-left pl-1 leading-tight">프로젝트 공유하기</div>
              {/* divider */}
              <div className="w-full h-px bg-gray-200 mb-7" />

              {/* 썸네일+제목/설명 왼쪽 정렬, 높이/글자 맞춤 */}
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
              {/* divider */}
              <div className="w-full h-px bg-gray-200 mb-6" />

              {/* SNS 리스트 숨김 처리 */}

              <div className="flex w-full mt-1">
                <input
                  type="text"
                  className="flex-1 border border-gray-200 rounded-l-lg px-5 py-4 bg-gray-50 font-medium text-gray-900 min-w-0 text-xs overflow-x-auto"
                  value={finalShareUrl}
                  readOnly
                  style={{
                    fontFamily: "GmarketSans, sans-serif",
                    fontSize: "13px",
                    letterSpacing: "-0.01em"
                  }}
                  onFocus={e => e.target.select()}
                />
                <button
                  onClick={handleCopy}
                  className="px-7 py-4 bg-gray-100 border-l border-gray-200 rounded-r-lg text-base font-bold hover:bg-gray-200 whitespace-nowrap"
                  style={{
                    fontFamily: "GmarketSans, sans-serif",
                    fontSize: "15px"
                  }}
                >URL 복사</button>
              </div>
            </div>
          </div>
        </>,
        document.body
      )}
    </div>
    </>
  );
}
