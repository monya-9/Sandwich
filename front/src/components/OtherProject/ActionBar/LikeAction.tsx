import React, { useState, useEffect } from "react";
import ReactDOM from "react-dom";
import { FaHeart } from "react-icons/fa";
import axios from "axios";
import LikedUsersModal from "./LikedUsersModal";

interface LikeActionProps {
  targetType: "PROJECT" | "BOARD" | "COMMENT";
  targetId: number;
}

export default function LikeAction({ targetType, targetId }: LikeActionProps) {
  const [liked, setLiked] = useState(false);
  const [count, setCount] = useState(0);
  const [toast, setToast] = useState<null | "like" | "unlike">(null);
  const [loading, setLoading] = useState(false);
  const [showLikedUsers, setShowLikedUsers] = useState(false);

  // ✅ 로그인 상태 판단 (localStorage || sessionStorage 둘 다 확인)
  const isLoggedIn = !!(localStorage.getItem("accessToken") || sessionStorage.getItem("accessToken"));

  // 좋아요 상태 불러오기
  useEffect(() => {
    const fetchLike = async () => {
      try {
        const token = localStorage.getItem("accessToken") || sessionStorage.getItem("accessToken");
        
        const res = await axios.get(`/api/likes`, {
          params: { targetType, targetId },
          withCredentials: true,
          headers: token ? {
            Authorization: `Bearer ${token}`,
          } : {},
        });
        setLiked(res.data.likedByMe || false);
        setCount(res.data.likeCount || 0);
      } catch (e) {
        console.error("좋아요 상태 조회 실패:", e);
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
      const token = localStorage.getItem("accessToken") || sessionStorage.getItem("accessToken");
      if (!token) {
        alert("로그인이 필요합니다.");
        return;
      }

      const res = await axios.post(
        "/api/likes",
        { targetType, targetId },
        {
          withCredentials: true,
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      setLiked(res.data.likedByMe);
      setCount(res.data.likeCount);
      setToast(res.data.likedByMe ? "like" : "unlike");
    } catch (e: any) {
      console.error("좋아요 처리 실패:", e);
      if (e.response?.status === 401) {
        alert("로그인이 필요합니다.");
      } else {
        alert("좋아요 처리 중 오류가 발생했습니다.");
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
      <LikedUsersModal
        isOpen={showLikedUsers}
        onClose={() => setShowLikedUsers(false)}
        targetType={targetType}
        targetId={targetId}
      />
      <div className="relative">
        <button
          aria-label="좋아요"
          className="flex flex-col items-center group focus:outline-none"
          onClick={handleLike}
          disabled={loading}
        >
          <div
            className={`w-14 h-14 rounded-full shadow flex items-center justify-center mb-1 transition-all duration-150
              ${liked ? "bg-[#FF6688]" : "bg-white"}`}
            style={{ position: "relative" }}
          >
            <FaHeart
              className={`w-6 h-6 transition-colors duration-150
                  ${liked ? "text-white" : "text-gray-800"}`}
            />
          </div>
          		  <span
						className="text-xs text-white font-semibold text-center"
						onClick={(e) => {
							if (count > 0) {
								e.stopPropagation();
								setShowLikedUsers(true);
							}
						}}
						style={{ cursor: count > 0 ? "pointer" : "default" }}
					  >
						{count > 0 ? count : "좋아요"}
					  </span>
        </button>
      </div>
    </>
  );
} 