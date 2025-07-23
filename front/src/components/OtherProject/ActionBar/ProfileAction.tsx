import React, { useState, useRef, useEffect } from "react";
import ReactDOM from "react-dom";
import { FaUser } from "react-icons/fa";

export default function ProfileAction() {
  const [hover, setHover] = useState(false);
  const [tooltipHover, setTooltipHover] = useState(false);
  const [isFollowing, setIsFollowing] = useState(false);
  const [followBtnHover, setFollowBtnHover] = useState(false);
  const [toast, setToast] = useState<null | "follow" | "unfollow">(null);

  const btnRef = useRef<HTMLButtonElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!document.getElementById("toast-style")) {
      const style = document.createElement("style");
      style.id = "toast-style";
      style.innerHTML = `
      .follow-toast {
        position: fixed; top: 60px; left: 50%; transform: translateX(-50%);
        background: #222; color: #fff; font-size: 1.2rem;
        border-radius: 20px; padding: 18px 38px; z-index: 9999;
        box-shadow: 0px 2px 12px rgba(0,0,0,0.13);
        display: flex; align-items: center; gap: 24px;
        font-family: 'Gmarket Sans', sans-serif;
      }
      .toast-check {
        display: flex; align-items: center; justify-content: center;
        width: 46px; height: 46px; border-radius: 50%;
        background: #46ce6b; font-size: 2rem;
      }
      .follow-toast.unfollow {
        background: #222;
      }
      .follow-toast.unfollow .toast-check {
        background: #F6323E;
      }
      `;
      document.head.appendChild(style);
    }
  }, []);

  useEffect(() => {
    if (!hover && !tooltipHover) return;
    const handler = (e: MouseEvent) => {
      if (
        btnRef.current &&
        !btnRef.current.contains(e.target as Node) &&
        tooltipRef.current &&
        !tooltipRef.current.contains(e.target as Node)
      ) {
        setHover(false);
        setTooltipHover(false);
        setFollowBtnHover(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [hover, tooltipHover]);

  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  const handleFollow = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsFollowing(true);
    setToast("follow");
    setFollowBtnHover(false);
  };
  const handleUnfollow = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsFollowing(false);
    setToast("unfollow");
    setFollowBtnHover(false);
  };

  // 토스트 메시지 Portal 렌더링
  const renderToast = toast && ReactDOM.createPortal(
    <div className={`follow-toast${toast === "unfollow" ? " unfollow" : ""}`}>
      <span className="toast-check">
        <svg width="24" height="24" viewBox="0 0 24 24">
          <polyline points="20 6 9 17 4 12" fill="none" stroke="#fff" strokeWidth="3"/>
        </svg>
      </span>
      {toast === "follow" ? "사용자를 팔로우했습니다." : "사용자를 팔로우하지 않습니다."}
    </div>,
    document.body
  );

  return (
    <div className="relative">
      {/* 토스트 */}
      {renderToast}

      {/* 액션 버튼 */}
      <button
        ref={btnRef}
        className="flex flex-col items-center gap-1 group"
        onMouseEnter={() => setHover(true)}
        onMouseLeave={() => setHover(false)}
      >
        <div className="w-14 h-14 rounded-full bg-white shadow flex items-center justify-center mb-1">
          <FaUser className="w-6 h-6" />
        </div>
        <span className="text-xs text-gray-800 font-semibold text-center">프로필</span>
      </button>

      {/* 툴팁+꼬리 */}
      {(hover || tooltipHover) && (
        <>
          <div
            className="absolute right-[calc(100%-10px)] top-1/2 -translate-y-1/2 z-50"
            style={{ width: 32, height: 32 }}
            onMouseEnter={() => setTooltipHover(true)}
            onMouseLeave={() => setTooltipHover(false)}
          >
            <svg width="32" height="32" viewBox="0 0 32 32">
              <polygon points="32,16 0,0 0,32" fill="white" stroke="#e5e7eb" strokeWidth="1"/>
            </svg>
          </div>
          <div
            ref={tooltipRef}
            className={`
              absolute
              right-[calc(100%+18px)]
              top-[-70%]
              rounded-2xl
              bg-white
              shadow-xl
              border
              border-gray-300
              flex
              flex-col
              gap-4
              items-center
              z-50
              pt-8
              pb-6
              w-[360px] h-[380px]
            `}
            onMouseEnter={() => setTooltipHover(true)}
            onMouseLeave={() => { setTooltipHover(false); setFollowBtnHover(false); }}
            onMouseDown={e => e.stopPropagation()}
          >
            <div className="w-[100px] h-[100px] rounded-full bg-[#16c064] mb-4 border-2 border-gray-100 shadow flex items-center justify-center"></div>
            <div className="text-2xl font-bold mb-1">사용자 이름</div>
            <div className="text-base text-gray-600 mb-6">프론트엔드</div>
            {!isFollowing ? (
              <button
                className="bg-white border-2 border-black text-black rounded-full font-bold text-lg shadow hover:bg-gray-100 transition w-[320px] h-[68px] flex items-center justify-center"
                onClick={handleFollow}
              >
                팔로우
              </button>
            ) : (
              <button
                className={`rounded-full font-bold text-lg transition shadow w-[320px] h-[68px] flex items-center justify-center ${
                  followBtnHover
                    ? "bg-[#F6323E] text-white border-2 border-[#F6323E]"
                    : "bg-white border-2 border-black text-black"
                }`}
                onClick={handleUnfollow}
                onMouseEnter={() => setFollowBtnHover(true)}
                onMouseLeave={() => setFollowBtnHover(false)}
              >
                {followBtnHover ? "팔로우 취소" : "팔로잉"}
              </button>
            )}
          </div>
        </>
      )}
    </div>
  );
}
