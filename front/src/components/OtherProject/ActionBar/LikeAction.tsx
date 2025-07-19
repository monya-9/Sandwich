import React, { useState, useEffect } from "react";
import ReactDOM from "react-dom";
import { FaHeart } from "react-icons/fa";

export default function LikeAction() {
  const [liked, setLiked] = useState(false);
  const [count, setCount] = useState(2); // 기본 2
  const [toast, setToast] = useState<null | "like" | "unlike">(null);

  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 2000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  const handleLike = () => {
    if (liked) {
      setLiked(false);
      setCount(c => c - 1);
      setToast("unlike");
    } else {
      setLiked(true);
      setCount(c => c + 1);
      setToast("like");
    }
  };

  // 초록색 체크 아이콘
  const CheckIcon = (
    <span
      className="flex items-center justify-center w-8 h-8 rounded-full mr-3"
      style={{ background: "#19c37d" }}
    >
      <svg width="22" height="22" viewBox="0 0 22 22">
        <polyline
          points="5.5,12.5 10,17 17,7.5"
          fill="none"
          stroke="#fff"
          strokeWidth="3"
          strokeLinecap="round"
        />
      </svg>
    </span>
  );

  // 중앙에 고정된 토스트 메시지 (포탈 사용)
  const renderToast = toast && ReactDOM.createPortal(
    <div
      style={{
        position: "fixed",
        top: "60px",
        left: "50%",
        transform: "translateX(-50%)",
        zIndex: 9999,
        background: "#222",
        color: "#fff",
        fontFamily: "'Gmarket Sans', sans-serif",
        fontWeight: 700,
        borderRadius: 18,
        boxShadow: "0 2px 18px #0002",
        padding: "18px 38px",
        display: "flex",
        alignItems: "center",
        gap: 24,
        fontSize: 20,
        letterSpacing: "0.02em",
        minWidth: 340,
        minHeight: 46
      }}
    >
      {CheckIcon}
      {toast === "like"
        ? "사용자의 작업에 좋아요를 눌렀습니다."
        : "좋아요를 취소하였습니다."
      }
    </div>,
    document.body
  );

  return (
    <>
      {renderToast}

      <div className="relative">
        <button
          aria-label="좋아요"
          className="flex flex-col items-center group focus:outline-none"
          onClick={handleLike}
        >
          <div
            className={`w-14 h-14 rounded-full shadow flex items-center justify-center mb-1 transition-all duration-150
              ${liked ? "bg-[#222]" : "bg-[#FF6688]"}`}
            style={{ position: "relative" }}
          >
            {/* 하트 아이콘 */}
            <FaHeart
              className={`w-6 h-6 transition-colors duration-150
                  ${liked ? "mb-1 translate-y-[-6px] text-[#FF6688]" : "text-white"}`}
            />
            {/* 숫자 (좋아요 눌렀을 때만) */}
            {liked && (
              <span
                className="absolute top-1/2 left-1/2 translate-x-[-50%] translate-y-[-100%] text-white text-lg font-bold pointer-events-none select-none"
                style={{
                  lineHeight: 1,
                  marginTop: 26,
                  textShadow: "0 1px 2px #0004"
                }}
              >
                {count}
              </span>
            )}
          </div>
          <span className="text-xs text-gray-800 font-semibold text-center">좋아요</span>
        </button>
      </div>
    </>
  );
}
