import React, { useEffect, useRef, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import ReactDOM from "react-dom";

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
  const [followBtnHover, setFollowBtnHover] = useState(false);
  const followBtnRef = useRef<HTMLButtonElement>(null);
  const navigate = useNavigate();

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
      .follow-toast.unfollow { background: #222; }
      .follow-toast.unfollow .toast-check { background: #F6323E; }
      `;
      document.head.appendChild(style);
    }
  }, []);

  useEffect(() => {
    const token = localStorage.getItem("accessToken");
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

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 3000);
    return () => clearTimeout(t);
  }, [toast]);

  const handleToggle = async () => {
    const token = localStorage.getItem("accessToken");
    if (!token) {
      alert("로그인이 필요합니다.");
      navigate("/login");
      return;
    }
    if (!ownerId || ownerId <= 0) {
      alert("대상 사용자를 확인할 수 없습니다.");
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
        alert("로그인이 필요합니다.");
        navigate("/login");
        return;
      }
      alert("팔로우 처리 중 오류가 발생했습니다.");
    }
  };

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
    <div className="flex flex-col items-center mb-16">
      {renderToast}
      <div className="w-24 h-24 bg-green-600 rounded-full mb-4" />
      <div className="text-2xl font-bold mb-3">{userName}</div>
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
        <button className="bg-cyan-400 text-white rounded-full text-xl font-bold shadow hover:bg-cyan-500 transition px-14 py-5 inline-flex items-center justify-center" onClick={onSuggest}>
          제안하기
        </button>
      </div>
    </div>
  );
}
