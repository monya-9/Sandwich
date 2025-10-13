import React, { useState, useRef, useEffect } from "react";
import { FaUser } from "react-icons/fa";
import api from "../../../api/axiosInstance";
import { useNavigate, useParams } from "react-router-dom";
import LoginPrompt from "../LoginPrompt";
import Toast from "../../common/Toast";

interface ProfileActionProps {
  targetUserId?: number;
  userName?: string;
  role?: string;
  profileImageUrl?: string;
  email?: string;
  isOwner?: boolean;
  initialIsFollowing?: boolean;
}

export default function ProfileAction({
  targetUserId: targetUserIdProp,
  userName = "사용자 이름",
  role = "",
  profileImageUrl,
  email,
  isOwner = false,
  initialIsFollowing,
}: ProfileActionProps = {}) {
  const [hover, setHover] = useState(false);
  const [tooltipHover, setTooltipHover] = useState(false);
  const [isFollowing, setIsFollowing] = useState(initialIsFollowing ?? false);
  const [followBtnHover, setFollowBtnHover] = useState(false);
  const [toast, setToast] = useState<null | "follow" | "unfollow">(null);
  const [errorToast, setErrorToast] = useState<{ visible: boolean; message: string }>({ visible: false, message: '' });
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);

  const btnRef = useRef<HTMLButtonElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [cardTopPx, setCardTopPx] = useState<number | null>(null);

  const isLoggedIn = !!(localStorage.getItem("accessToken") || sessionStorage.getItem("accessToken"));
  const navigate = useNavigate();
  const { ownerId: ownerIdParam } = useParams<{ ownerId?: string }>();
  const targetUserId = targetUserIdProp ?? (ownerIdParam ? Number(ownerIdParam) : undefined);
  const myId = Number((typeof window !== 'undefined' && (localStorage.getItem('userId') || sessionStorage.getItem('userId'))) || '0');
  const goProfile = () => {
    if (!targetUserId) return;
    if (myId > 0 && myId === targetUserId) navigate('/profile');
    else navigate(`/users/${targetUserId}`);
  };

  useEffect(() => {
    if (typeof initialIsFollowing === "boolean") {
      setIsFollowing(initialIsFollowing);
    }
  }, [initialIsFollowing]);

  useEffect(() => {
    if (typeof initialIsFollowing === "boolean") return;
    const fetchFollowStatus = async () => {
      try {
        const token = localStorage.getItem("accessToken") || sessionStorage.getItem("accessToken");
        if (!token || !targetUserId || targetUserId <= 0) { setIsFollowing(false); return; }
        const res = await api.get(`/users/${targetUserId}/follow-status`);
        setIsFollowing(!!res.data?.isFollowing);
      } catch (e: any) { if (e.response?.status === 401) setIsFollowing(false); }
    };
    fetchFollowStatus();
  }, [targetUserId, initialIsFollowing]);

  useEffect(() => {
    if (!hover && !tooltipHover) return;
    const handler = (e: MouseEvent) => {
      if (btnRef.current && !btnRef.current.contains(e.target as Node) && tooltipRef.current && !tooltipRef.current.contains(e.target as Node)) {
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

  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent).detail as { userId?: number; isFollowing?: boolean };
      if (detail?.userId && targetUserId && detail.userId === targetUserId && typeof detail.isFollowing === "boolean") {
        setIsFollowing(detail.isFollowing);
        setFollowBtnHover(false);
      }
    };
    window.addEventListener("followChanged", handler as EventListener);
    return () => window.removeEventListener("followChanged", handler as EventListener);
  }, [targetUserId]);

  const requireLogin = () => { setShowLoginPrompt(true); };
  const requireTarget = () => { setErrorToast({ visible: true, message: "대상 사용자를 확인할 수 없습니다." }); };

  const handleFollow = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isLoggedIn) return requireLogin();
    if (!targetUserId || targetUserId <= 0) return requireTarget();
    try {
      const token = localStorage.getItem("accessToken") || sessionStorage.getItem("accessToken");
      if (!token) return requireLogin();
      await api.post(`/users/${targetUserId}/follow`, null);
      setIsFollowing(true);
      setToast("follow");
      setFollowBtnHover(false);
      window.dispatchEvent(new CustomEvent("followChanged", { detail: { userId: targetUserId, isFollowing: true } }));
      window.dispatchEvent(new CustomEvent("followChanged:global", { detail: { userId: targetUserId, isFollowing: true } }));
    } catch (e: any) {
      if (e.response?.status === 401) return requireLogin();
      setErrorToast({ visible: true, message: "팔로우 처리 중 오류가 발생했습니다." });
    }
  };
  const handleUnfollow = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isLoggedIn) return requireLogin();
    if (!targetUserId || targetUserId <= 0) return requireTarget();
    try {
      const token = localStorage.getItem("accessToken") || sessionStorage.getItem("accessToken");
      if (!token) return requireLogin();
      await api.delete(`/users/${targetUserId}/unfollow`);
      setIsFollowing(false);
      setToast("unfollow");
      setFollowBtnHover(false);
      window.dispatchEvent(new CustomEvent("followChanged", { detail: { userId: targetUserId, isFollowing: false } }));
      window.dispatchEvent(new CustomEvent("followChanged:global", { detail: { userId: targetUserId, isFollowing: false } }));
    } catch (e: any) {
      if (e.response?.status === 401) return requireLogin();
      setErrorToast({ visible: true, message: "팔로우 취소 처리 중 오류가 발생했습니다." });
    }
  };

  const CheckIcon = (
    <svg width="16" height="16" viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12" fill="none" stroke="#fff" strokeWidth="3"/></svg>
  );

  const avatar = profileImageUrl ? (
    <button type="button" onClick={goProfile} className="w-[72px] h-[72px] rounded-full overflow-hidden ring-1 ring-gray-300 focus:outline-none" aria-label="프로필로 이동">
      <img src={profileImageUrl} alt="avatar" className="w-full h-full object-cover" />
    </button>
  ) : (
    <button type="button" onClick={goProfile} className="w-[72px] h-[72px] rounded-full bg-gray-200 text-gray-700 font-bold flex items-center justify-center text-2xl ring-1 ring-gray-300 focus:outline-none" aria-label="프로필로 이동">
      {(email?.[0] || userName?.[0] || "?").toUpperCase()}
    </button>
  );

  // 카드 고정 위치 계산: 아이콘 중앙에서 일정 오프셋(기존 50px) 유지
  useEffect(() => {
    const updateTop = () => {
      try {
        const container = containerRef.current;
        const button = btnRef.current;
        if (!container || !button) return;
        const btnRect = button.getBoundingClientRect();
        const contRect = container.getBoundingClientRect();
        const relativeCenter = btnRect.top + btnRect.height / 2 - contRect.top;
        const ARROW_OFFSET_PX = 60; // 살짝 아래로 조정
        setCardTopPx(relativeCenter - ARROW_OFFSET_PX);
      } catch {}
    };
    updateTop();
    window.addEventListener("resize", updateTop);
    window.addEventListener("scroll", updateTop, { passive: true } as any);
    return () => {
      window.removeEventListener("resize", updateTop);
      window.removeEventListener("scroll", updateTop as any);
    };
  }, [hover, tooltipHover, isOwner]);

  return (
    <>
      <Toast visible={!!toast} message={toast === "follow" ? "사용자를 팔로우했습니다." : "사용자를 팔로우하지 않습니다."} type={toast === "follow" ? "success" : "info"} size="medium" autoClose={3000} closable={true} onClose={() => setToast(null)} icon={CheckIcon} />
      <Toast visible={errorToast.visible} message={errorToast.message} type="error" size="medium" autoClose={3000} closable={true} onClose={() => setErrorToast(prev => ({ ...prev, visible: false }))} />
      <div ref={containerRef} className="relative">
        {showLoginPrompt && (<LoginPrompt onLoginClick={() => { setShowLoginPrompt(false); navigate("/login"); }} onSignupClick={() => { setShowLoginPrompt(false); navigate("/join"); }} onClose={() => setShowLoginPrompt(false)} />)}

        <button ref={btnRef} className="flex flex-col items-center gap-1 group" onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)} onClick={goProfile}>
          <div className="w-14 h-14 rounded-full bg-white shadow flex items-center justify-center mb-1">
            <FaUser className="w-7 h-7" />
          </div>
          <span className="text-sm text-white font-semibold text-center" style={{ textShadow: "0 1px 2px rgba(0,0,0,0.6)" }}>프로필</span>
      </button>

      {(hover || tooltipHover) && (
        <>
          <div
            ref={tooltipRef}
            className="absolute right-[calc(100%+14px)] rounded-[4px] bg-white shadow-lg border border-gray-200 flex flex-col items-center z-50 px-7 py-6 gap-4 w-max min-w-[350px]"
            style={{ top: (cardTopPx ?? 0) + "px" }}
            onMouseEnter={() => setTooltipHover(true)}
            onMouseLeave={() => { setTooltipHover(false); setFollowBtnHover(false); }}
            onMouseDown={e => e.stopPropagation()}
          >
            <div className="absolute -right-2 top-5 w-4 h-4 bg-white rotate-45 rounded-[2px]" />
            {avatar}
            <div className="text-[20px] font-bold">{userName}</div>
            <div className={isOwner ? "h-0 w-full overflow-hidden" : "h-auto w-full"}>
              {!isOwner && (
                !isFollowing ? (
                  <button className="w-full h-10 rounded-full bg-white border border-gray-300 text-gray-800 font-semibold hover:bg-gray-50" onClick={handleFollow}>+ 팔로우</button>
                ) : (
                  <button className={`w-full h-10 rounded-full font-semibold border ${followBtnHover ? "bg-[#F6323E] text-white border-[#F6323E]" : "bg-white border-gray-300 text-gray-800 hover:bg-gray-50"}`} onClick={handleUnfollow} onMouseEnter={() => setFollowBtnHover(true)} onMouseLeave={() => setFollowBtnHover(false)}>
                    {followBtnHover ? "팔로우 취소" : "팔로잉"}
                  </button>
                )
              )}
            </div>
          </div>
        </>
      )}
    </div>
    </>
  );
}
