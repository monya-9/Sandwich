import React, { useState, useEffect } from "react";
import ReactDOM from "react-dom";
import { FaHeart } from "react-icons/fa";
import axios from "axios";

interface LikeActionProps {
  targetType: "PROJECT" | "BOARD" | "COMMENT";
  targetId: number;
}



export default function LikeAction({ targetType, targetId }: LikeActionProps) {
  const [liked, setLiked] = useState(false);
  const [count, setCount] = useState(0);
  const [toast, setToast] = useState<null | "like" | "unlike">(null);
  const [loading, setLoading] = useState(false);

  // ✅ 로그인 상태 판단 (localStorage에 토큰 존재 여부)
  const isLoggedIn = !!localStorage.getItem("accessToken");

  // 좋아요 상태 불러오기
  useEffect(() => {
    const fetchLike = async () => {
      try {
        const res = await axios.get(`/api/likes`, {
          params: { targetType, targetId },
          withCredentials: true,
          headers: {
            Authorization: localStorage.getItem("accessToken") || "",
          },
        });
        setLiked(res.data.likedByMe);
        setCount(res.data.likeCount);
      } catch (e) {
        setLiked(false);
        setCount(0);
      }
    };
    fetchLike();
  }, [targetType, targetId]);

  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 2000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  const handleLike = async () => {
    if (!isLoggedIn) {
      alert("로그인이 필요합니다.");
      return;
    }
    if (loading) return;
    setLoading(true);
    try {
      const res = await axios.post(
        "/api/likes",
        { targetType, targetId },
        {
          withCredentials: true,
          headers: {
            Authorization: localStorage.getItem("accessToken") || "",
          },
        }
      );
      setLiked(res.data.likedByMe);
      setCount(res.data.likeCount);
      setToast(res.data.likedByMe ? "like" : "unlike");
    } catch (e: any) {
      if (e.response?.status === 401) {
        alert("로그인이 필요합니다.");
      }
    } finally {
      setLoading(false);
    }
  };

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

  const renderToast =
    toast &&
    ReactDOM.createPortal(
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
          minHeight: 46,
        }}
      >
        {CheckIcon}
        {toast === "like"
          ? "사용자의 작업에 좋아요를 눌렀습니다."
          : "좋아요를 취소하였습니다."}
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
          disabled={loading}
        >
          <div
            className={`w-14 h-14 rounded-full shadow flex items-center justify-center mb-1 transition-all duration-150
              ${liked ? "bg-[#222]" : "bg-[#FF6688]"}`}
            style={{ position: "relative" }}
          >
            <FaHeart
              className={`w-6 h-6 transition-colors duration-150
                  ${liked ? "mb-1 translate-y-[-6px] text-[#FF6688]" : "text-white"}`}
            />
            {liked && (
              <span
                className="absolute top-1/2 left-1/2 translate-x-[-50%] translate-y-[-100%] text-white text-lg font-bold pointer-events-none select-none"
                style={{
                  lineHeight: 1,
                  marginTop: 26,
                  textShadow: "0 1px 2px #0004",
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
