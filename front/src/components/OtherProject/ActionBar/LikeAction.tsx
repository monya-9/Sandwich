import React, { useState, useEffect } from "react";
import { FaHeart } from "react-icons/fa";
import api from "../../../api/axiosInstance";
import LikedUsersModal from "./LikedUsersModal";
import LoginPrompt from "../LoginPrompt";
import { useNavigate } from "react-router-dom";
import Toast from "../../common/Toast";

interface LikeActionProps {
  targetType: "PROJECT" | "POST" | "COMMENT" | "CODE_SUBMISSION" | "PORTFOLIO_SUBMISSION";
  targetId: number;
}

export default function LikeAction({ targetType, targetId }: LikeActionProps) {
  const [liked, setLiked] = useState(false);
  const [count, setCount] = useState(0);
  const [toast, setToast] = useState<null | "like" | "unlike">(null);
  const [errorToast, setErrorToast] = useState<{ visible: boolean; message: string }>({
    visible: false,
    message: ''
  });
  const [loading, setLoading] = useState(false);
  const [showLikedUsers, setShowLikedUsers] = useState(false);
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);
  const navigate = useNavigate();

  // ✅ 로그인 상태 판단 (localStorage || sessionStorage 둘 다 확인)
  const isLoggedIn = !!(localStorage.getItem("accessToken") || sessionStorage.getItem("accessToken"));

  // 좋아요 상태 불러오기
  useEffect(() => {
    const fetchLike = async () => {
      try {
        const res = await api.get(`/likes`, {
          params: { targetType, targetId },
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

  const handleLike = async () => {
    if (!isLoggedIn) {
      setShowLoginPrompt(true);
      return;
    }
    if (loading) return;
    setLoading(true);
    
    try {
      const token = localStorage.getItem("accessToken") || sessionStorage.getItem("accessToken");
      if (!token) {
        setShowLoginPrompt(true);
        return;
      }

      const res = await api.post(
        "/likes",
        { targetType, targetId }
      );
      setLiked(res.data.likedByMe);
      setCount(res.data.likeCount);
      setToast(res.data.likedByMe ? "like" : "unlike");
    } catch (e: any) {
      console.error("좋아요 처리 실패:", e);
      if (e.response?.status === 401) {
        setShowLoginPrompt(true);
      } else {
        setErrorToast({
          visible: true,
          message: "좋아요 처리 중 오류가 발생했습니다."
        });
      }
    } finally {
      setLoading(false);
    }
  };

  // 외부에서 트리거되는 좋아요 토글 이벤트 처리
  useEffect(() => {
    const onToggle = (e: any) => {
      try {
        const detail = e?.detail || {};
        const typeMatches = !detail?.targetType || detail.targetType === targetType;
        const idMatches = !detail?.targetId || detail.targetId === targetId;
        if (typeMatches && idMatches) {
          handleLike();
        }
      } catch {}
    };
    window.addEventListener("like:toggle", onToggle as any);
    return () => window.removeEventListener("like:toggle", onToggle as any);
  }, [targetType, targetId, isLoggedIn, loading]);

  return (
    <>
      <Toast
        visible={!!toast}
        message={toast === "like" ? "사용자의 작업에 좋아요를 눌렀습니다." : "좋아요를 취소하였습니다."}
        type="success"
        size="medium"
        autoClose={2000}
        closable={true}
        onClose={() => setToast(null)}
      />
      <Toast
        visible={errorToast.visible}
        message={errorToast.message}
        type="error"
        size="medium"
        autoClose={3000}
        closable={true}
        onClose={() => setErrorToast(prev => ({ ...prev, visible: false }))}
      />
      {showLoginPrompt && (
        <LoginPrompt
          onLoginClick={() => {
            setShowLoginPrompt(false);
            navigate("/login");
          }}
          onSignupClick={() => {
            setShowLoginPrompt(false);
            navigate("/join");
          }}
          onClose={() => setShowLoginPrompt(false)}
        />
      )}
      <LikedUsersModal
        isOpen={showLikedUsers}
        onClose={() => setShowLikedUsers(false)}
        targetType={targetType}
        targetId={targetId}
      />
      <div className="relative">
        <button
          aria-label="좋아요"
          className="flex flex-col items-center gap-1 group focus:outline-none"
          onClick={handleLike}
          disabled={loading}
        >
          <div
            className={`w-14 h-14 rounded-full shadow ring-1 ring-black/10 dark:ring-white/20 flex items-center justify-center mb-1 transition-all duration-150
              ${liked ? "bg-[#FF6688]" : "bg-white"}`}
            style={{ position: "relative" }}
          >
            <FaHeart
              className={`w-7 h-7 transition-colors duration-150
                  ${liked ? "text-white" : "text-gray-800"}`}
            />
            {count > 0 && (
              <span
                className={`absolute -top-[10px] -right-[10px] z-10 min-w-[28px] h-[28px] px-1 rounded-full ${liked ? "bg-[#BE185D]" : "bg-[#FF6688]"} text-white text-[13px] leading-[28px] text-center font-bold shadow cursor-pointer`}
                title="좋아요한 사람 보기"
                onClick={(e) => { e.stopPropagation(); setShowLikedUsers(true); }}
              >
                {count}
              </span>
            )}
          </div>
          <span
            className="text-sm text-white font-semibold text-center"
            style={{ textShadow: "0 1px 2px rgba(0,0,0,0.6)" }}
          >
            좋아요
          </span>
        </button>
      </div>
    </>
  );
} 