import React, { useState, useRef, useEffect } from "react";
import ReactDOM from "react-dom";
import { FaHandshake } from "react-icons/fa";
import { FaCommentDots, FaRegCommentDots } from "react-icons/fa6";

export default function SuggestAction() {
  const [hover, setHover] = useState(false);
  const [tooltipHover, setTooltipHover] = useState(false); // 삼각형/팝업 위에 올려도 true
  const [isModalOpen, setIsModalOpen] = useState(false);

  const btnRef = useRef<HTMLButtonElement>(null);
  const popupRef = useRef<HTMLDivElement>(null);
  const modalRef = useRef<HTMLDivElement>(null);

  // 스타일 한 번만 추가
  useEffect(() => {
  const styleId = "suggest-style";
  let styleTag = document.getElementById(styleId);
  if (styleTag) styleTag.remove();
  styleTag = document.createElement("style");
  styleTag.id = styleId;
  styleTag.innerHTML = `
    .suggest-blur-bg {
      position: fixed; inset: 0;
      background: rgba(0, 0, 0, 0.65);  
      z-index: 9000;
       backdrop-filter: blur(0px);
      pointer-events: auto;
    }
  `;
  document.head.appendChild(styleTag);
}, []);


  // 모달 외부 클릭 → 모달 닫힘
  useEffect(() => {
    if (!isModalOpen) return;
    const handler = (e: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(e.target as Node)) {
        setIsModalOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [isModalOpen]);

  // ESC 닫기
  useEffect(() => {
    if (!isModalOpen) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") setIsModalOpen(false);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [isModalOpen]);

  // 모달 열릴 때 스크롤 차단
  useEffect(() => {
    if (!isModalOpen) return;
    const preventScroll = (e: Event) => e.preventDefault();
    const preventKeys = (e: KeyboardEvent) => {
      const keys = [
        "ArrowUp", "ArrowDown", "PageUp", "PageDown", "Home", "End", " ", "Spacebar"
      ];
      if (keys.includes(e.key)) e.preventDefault();
    };
    window.addEventListener("wheel", preventScroll, { passive: false });
    window.addEventListener("touchmove", preventScroll, { passive: false });
    window.addEventListener("keydown", preventKeys, { passive: false });
    return () => {
      window.removeEventListener("wheel", preventScroll);
      window.removeEventListener("touchmove", preventScroll);
      window.removeEventListener("keydown", preventKeys);
    };
  }, [isModalOpen]);

  // *** 툴팁 유지 ***
  // 버튼/삼각형/팝업 셋 중 하나라도 hover면 보여줌
  const tooltipVisible = hover || tooltipHover;

  // --- 중앙 모달 Portal 렌더링
  const ModalPortal = isModalOpen
    ? ReactDOM.createPortal(
        <>
          <div className="suggest-blur-bg" />
          <div
            ref={modalRef}
            className="fixed left-1/2 top-1/2 z-[10000] w-[380px] h-[420px] -translate-x-1/2 -translate-y-1/2 flex flex-col items-center bg-white border border-black rounded-[20px] shadow-xl px-0 py-0"
            tabIndex={-1}
            role="dialog"
          >
            <button
              className="absolute right-5 top-5 text-2xl text-gray-500 hover:text-black"
              onClick={() => setIsModalOpen(false)}
              aria-label="닫기"
            >×</button>
            <div
              className="mt-10 mb-3"
              style={{
                width: 80,
                height: 80,
                borderRadius: "50%",
                background: "#068334"
              }}
            />
            <div className="text-2xl font-bold mb-1">사용자 이름</div>
            <div className="text-base text-gray-600 mb-6">프론트엔드</div>
            <button
              className="flex items-center w-[90%] h-[52px] mb-3 border border-[#ADADAD] rounded-[14px] px-5 bg-white hover:bg-gray-100"
              style={{ justifyContent: "space-between" }}
              onClick={() => setIsModalOpen(false)}
            >
              <span className="flex items-center gap-2">
                <FaHandshake className="text-[24px] text-green-500" />
                <span className="text-[18px]">협업 제안하기</span>
              </span>
              <svg width="24" height="24" viewBox="0 0 32 32">
                <polyline points="12,8 20,16 12,24" fill="none" stroke="#111" strokeWidth="2" />
              </svg>
            </button>
            <button
              className="flex items-center w-[90%] h-[52px] border border-[#ADADAD] rounded-[14px] px-5 bg-white hover:bg-gray-100"
              style={{ justifyContent: "space-between" }}
              onClick={() => setIsModalOpen(false)}
            >
              <span className="flex items-center gap-2">
                <FaRegCommentDots className="text-[24px] text-green-500" />
                <span className="text-[18px]">일반 메세지</span>
              </span>
              <svg width="24" height="24" viewBox="0 0 32 32">
                <polyline points="12,8 20,16 12,24" fill="none" stroke="#111" strokeWidth="2" />
              </svg>
            </button>
          </div>
        </>,
        document.body
      )
    : null;

  return (
    <div className="relative">
      {/* 액션 버튼 */}
      <button
        ref={btnRef}
        className="flex flex-col items-center gap-1 group"
        onMouseEnter={() => setHover(true)}
        onMouseLeave={() => setHover(false)}
        onClick={() => setIsModalOpen(true)}
      >
        <div className="w-14 h-14 rounded-full bg-white shadow flex items-center justify-center mb-1">
          <FaCommentDots className="w-6 h-6" />
        </div>
        <span className="text-xs text-gray-800 font-semibold text-center">제안하기</span>
      </button>

      {/* 툴팁(팝업+꼬리, 셋 다 위에 올릴 때만 유지) */}
      {tooltipVisible && !isModalOpen && (
        <>
          {/* 꼬리 */}
          <div
            className="absolute right-[calc(100%-10px)] top-1/2 -translate-y-1/2 z-50"
            style={{ width: 32, height: 32 }}
            onMouseEnter={() => setTooltipHover(true)}
            onMouseLeave={() => setTooltipHover(false)}
          >
            <svg width="32" height="32" viewBox="0 0 32 32">
              <polygon points="32,16 0,0 0,32" fill="white" stroke="#e5e7eb" strokeWidth="1" />
            </svg>
          </div>
          {/* 팝업 */}
          <div
            ref={popupRef}
            className="absolute right-[calc(100%+18px)] top-[-55%] rounded-2xl bg-white shadow-xl border border-gray-300 flex flex-col gap-4 items-center z-50 pt-8 pb-6 w-[350px] h-[180px] px-9 gap-10"
            onMouseEnter={() => setTooltipHover(true)}
            onMouseLeave={() => setTooltipHover(false)}
            onMouseDown={e => e.stopPropagation()}
          >
            {/* 협업 제안하기 */}
            <div className="flex items-center justify-between w-full">
              <span className="flex items-center gap-3">
                <FaHandshake className="text-[22px]" />
                <span className="font-gmarket font-normal text-[23px] text-black">
                  협업 제안하기
                </span>
              </span>
              <span className="w-8 h-8 flex items-center justify-center rounded-full border border-gray-300">
                <svg width="16" height="16"><circle cx="8" cy="8" r="7" fill="#fff" stroke="#111" strokeWidth="2"/><polyline points="5,9 7,12 12,6" fill="none" stroke="#111" strokeWidth="2"/></svg>
              </span>
            </div>
            {/* 일반 메시지 */}
            <div className="flex items-center justify-between w-full">
              <span className="flex items-center gap-3">
                <FaRegCommentDots className="text-[22px]" />
                <span className="font-gmarket font-normal text-[23px] text-black">
                  일반 메세지
                </span>
              </span>
              <span className="w-8 h-8 flex items-center justify-center rounded-full border border-gray-300">
                <svg width="16" height="16"><circle cx="8" cy="8" r="7" fill="#fff" stroke="#111" strokeWidth="2"/><polyline points="5,9 7,12 12,6" fill="none" stroke="#111" strokeWidth="2"/></svg>
              </span>
            </div>
          </div>
        </>
      )}

      {/* 중앙 모달 Portal */}
      {ModalPortal}
    </div>
  );
}
