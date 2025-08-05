import React, { useState, useEffect } from "react";
import ReactDOM from "react-dom";
import axios from "axios";
import LikedUsersModal from "./LikedUsersModal";

interface CommentLikeActionProps {
  commentId: number;
}

export default function CommentLikeAction({ commentId }: CommentLikeActionProps) {
  const [liked, setLiked] = useState(false);
  const [count, setCount] = useState(0);
  const [toast, setToast] = useState<null | "like" | "unlike">(null);
  const [loading, setLoading] = useState(false);
  const [showLikedUsers, setShowLikedUsers] = useState(false);

  // 로그인 상태 판단
  const isLoggedIn = !!localStorage.getItem("accessToken");

  // 좋아요 상태 불러오기
  useEffect(() => {
    const fetchLike = async () => {
      try {
        const token = localStorage.getItem("accessToken");
        
        const res = await axios.get(`/api/likes`, {
          params: { targetType: "COMMENT", targetId: commentId },
          withCredentials: true,
          headers: token ? {
            Authorization: `Bearer ${token}`,
          } : {},
        });
        setLiked(res.data.likedByMe || false);
        setCount(res.data.likeCount || 0);
      } catch (e) {
        console.error("댓글 좋아요 상태 조회 실패:", e);
        setLiked(false);
        setCount(0);
      }
    };
    fetchLike();
  }, [commentId]);

  // 토스트 메시지 자동 제거
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
      const token = localStorage.getItem("accessToken");
      if (!token) {
        alert("로그인이 필요합니다.");
        return;
      }

      const res = await axios.post(
        "/api/likes",
        { targetType: "COMMENT", targetId: commentId },
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
      console.error("댓글 좋아요 처리 실패:", e);
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
      className="flex items-center justify-center w-6 h-6 rounded-full mr-2"
      style={{ background: "#19c37d" }}
    >
      <svg width="14" height="14" viewBox="0 0 22 22">
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
        padding: "12px 24px",
        display: "flex",
        alignItems: "center",
        gap: 16,
        fontSize: 16,
        letterSpacing: "0.02em",
        minWidth: 280,
        minHeight: 40,
      }}
    >
      {CheckIcon}
      {toast === "like" ? "댓글에 좋아요를 눌렀습니다." : "좋아요를 취소하였습니다."}
    </div>,
    document.body
  );

  return (
    <>
      {renderToast}
      <LikedUsersModal
        isOpen={showLikedUsers}
        onClose={() => setShowLikedUsers(false)}
        targetType="COMMENT"
        targetId={commentId}
      />
      <button
        onClick={handleLike}
        disabled={loading || !isLoggedIn}
        className={`flex items-center gap-1 text-xs transition-colors ${
          !isLoggedIn 
            ? "text-gray-300 cursor-not-allowed" 
            : liked 
              ? "text-red-500 hover:text-red-600" 
              : "text-gray-500 hover:text-red-500"
        }`}
      >
        <svg 
          width="12" 
          height="12" 
          viewBox="0 0 24 24" 
          fill={liked ? "currentColor" : "none"} 
          stroke="currentColor" 
          strokeWidth="2"
          className="transition-colors"
        >
          <path 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" 
          />
        </svg>
        {count > 0 && <span>{count}</span>}
      </button>
      {count > 0 && (
        <button
          onClick={() => setShowLikedUsers(true)}
          className="text-xs text-gray-400 hover:text-gray-600 ml-1"
        >
          목록
        </button>
      )}
    </>
  );
} 