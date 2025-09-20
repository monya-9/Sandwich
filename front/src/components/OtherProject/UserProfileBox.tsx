import React, { useEffect, useRef, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import LoginPrompt from "./LoginPrompt";
import Toast from "../common/Toast";

type Props = {
  userName: string;
  ownerId?: number;
  onFollow?: () => void;
  onSuggest?: () => void;
};

export default function UserProfileBox({
  userName,
  ownerId,
  onFollow,
  onSuggest,
}: Props) {
  const [isFollowing, setIsFollowing] = useState(false);
  const [toast, setToast] = useState<null | "follow" | "unfollow">(null);
  const [errorToast, setErrorToast] = useState<{ visible: boolean; message: string }>({
    visible: false,
    message: ''
  });
  const [followBtnHover, setFollowBtnHover] = useState(false);
  const followBtnRef = useRef<HTMLButtonElement>(null);
  const navigate = useNavigate();
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);


  useEffect(() => {
    const token = localStorage.getItem("accessToken") || sessionStorage.getItem("accessToken");
    if (!token || !ownerId || ownerId <= 0) {
      setIsFollowing(false);
      return;
    }
    (async () => {
      try {
        const res = await axios.get(`/api/users/${ownerId}/follow-status`, {
          withCredentials: true,
          headers: { Authorization: `Bearer ${token}` },
        });
        setIsFollowing(!!res.data?.isFollowing);
      } catch (e: any) {
        if (e.response?.status === 401) setIsFollowing(false);
      }
    })();
  }, [ownerId]);

  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent).detail as { userId?: number; isFollowing?: boolean };
      if (detail?.userId && ownerId && detail.userId === ownerId && typeof detail.isFollowing === "boolean") {
        setIsFollowing(detail.isFollowing);
      }
    };
    window.addEventListener("followChanged", handler as EventListener);
    window.addEventListener("followChanged:global", handler as EventListener);
    return () => {
      window.removeEventListener("followChanged", handler as EventListener);
      window.removeEventListener("followChanged:global", handler as EventListener);
    };
  }, [ownerId]);


  const ensureLogin = () => {
    const token = localStorage.getItem("accessToken") || sessionStorage.getItem("accessToken");
    if (!token) {
      setShowLoginPrompt(true);
      return false;
    }
    return true;
  };

  const handleToggle = async () => {
    if (!ensureLogin()) return;
    const token = localStorage.getItem("accessToken") || sessionStorage.getItem("accessToken");
    if (!ownerId || ownerId <= 0) {
      setErrorToast({
        visible: true,
        message: "대상 사용자를 확인할 수 없습니다."
      });
      return;
    }
    try {
      if (isFollowing) {
        await axios.delete(`/api/users/${ownerId}/unfollow`, {
          withCredentials: true,
          headers: { Authorization: `Bearer ${token}` },
        });
        setIsFollowing(false);
        setToast("unfollow");
        window.dispatchEvent(new CustomEvent("followChanged", { detail: { userId: ownerId, isFollowing: false } }));
      } else {
        await axios.post(`/api/users/${ownerId}/follow`, null, {
          withCredentials: true,
          headers: { Authorization: `Bearer ${token}` },
        });
        setIsFollowing(true);
        setToast("follow");
        window.dispatchEvent(new CustomEvent("followChanged", { detail: { userId: ownerId, isFollowing: true } }));
      }
      onFollow?.();
    } catch (e: any) {
      if (e.response?.status === 401) {
        setShowLoginPrompt(true);
        return;
      }
      setErrorToast({
        visible: true,
        message: "팔로우 처리 중 오류가 발생했습니다."
      });
    }
  };

  const handleSuggest = () => {
    if (!ensureLogin()) return;
    onSuggest?.();
  };

  const CheckIcon = (
    <svg width="16" height="16" viewBox="0 0 24 24">
      <polyline points="20 6 9 17 4 12" fill="none" stroke="#fff" strokeWidth="3"/>
    </svg>
  );

  // 표시 이름/이니셜 계산
  const storedNickname = (localStorage.getItem("userNickname") || sessionStorage.getItem("userNickname") || "").trim();
  const storedEmail = (localStorage.getItem("userEmail") || sessionStorage.getItem("userEmail") || "").trim();
  const displayName = storedNickname || userName;
  const emailInitial = storedEmail ? storedEmail[0].toUpperCase() : "";
  const avatarInitial = emailInitial || (displayName?.[0] || "").toUpperCase();

  return (
    <>
      <Toast
        visible={!!toast}
        message={toast === "follow" ? "사용자를 팔로우했습니다." : "사용자를 팔로우하지 않습니다."}
        type={toast === "follow" ? "success" : "info"}
        size="medium"
        autoClose={3000}
        closable={true}
        onClose={() => setToast(null)}
        icon={CheckIcon}
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
      <div className="flex flex-col items-center mb-16">
        {showLoginPrompt && (
        <LoginPrompt
          onLoginClick={() => { setShowLoginPrompt(false); navigate("/login"); }}
          onSignupClick={() => { setShowLoginPrompt(false); navigate("/join"); }}
          onClose={() => setShowLoginPrompt(false)}
        />
        )}
        <div className="w-14 h-14 rounded-full mb-4 bg-gray-200 text-gray-700 font-bold flex items-center justify-center">
          {avatarInitial}
        </div>
        <div className="text-2xl font-bold mb-3">{displayName}</div>
        <div className="flex gap-6">
          <button
            ref={followBtnRef}
            className={`${isFollowing ? (followBtnHover ? "bg-[#F6323E] text-white border-2 border-[#F6323E]" : "bg-white border-2 border-black text-black") : "bg-white border-2 border-black text-black"} rounded-full text-xl font-bold shadow transition px-14 py-5 inline-flex items-center justify-center whitespace-nowrap`}
            onClick={handleToggle}
            onMouseEnter={() => setFollowBtnHover(true)}
            onMouseLeave={() => setFollowBtnHover(false)}
          >
            <span className="invisible">제안하기</span>
            <span className="absolute">{isFollowing ? (followBtnHover ? "팔로우 취소" : "팔로잉") : "+ 팔로우"}</span>
          </button>
          <button className="bg-cyan-400 text-white rounded-full text-xl font-bold shadow hover:bg-cyan-500 transition px-14 py-5 inline-flex items-center justify-center" onClick={handleSuggest}>
            제안하기
          </button>
        </div>
      </div>
    </>
  );
}
