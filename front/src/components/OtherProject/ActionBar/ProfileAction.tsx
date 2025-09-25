import React, { useState, useRef, useEffect } from "react";
import { FaUser } from "react-icons/fa";
import axios from "axios";
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
}

export default function ProfileAction({
  targetUserId: targetUserIdProp,
  userName = "사용자 이름",
  role = "",
  profileImageUrl,
  email,
  isOwner = false,
}: ProfileActionProps = {}) {
  const [hover, setHover] = useState(false);
  const [tooltipHover, setTooltipHover] = useState(false);
  const [isFollowing, setIsFollowing] = useState(false);
  const [followBtnHover, setFollowBtnHover] = useState(false);
  const [toast, setToast] = useState<null | "follow" | "unfollow">(null);
  const [errorToast, setErrorToast] = useState<{ visible: boolean; message: string }>({ visible: false, message: '' });
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);

  const btnRef = useRef<HTMLButtonElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);

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
    const fetchFollowStatus = async () => {
      try {
        const token = localStorage.getItem("accessToken") || sessionStorage.getItem("accessToken");
        if (!token || !targetUserId || targetUserId <= 0) { setIsFollowing(false); return; }
        const res = await axios.get(`/api/users/${targetUserId}/follow-status`, { withCredentials: true, headers: { Authorization: `Bearer ${token}` } });
        setIsFollowing(!!res.data?.isFollowing);
      } catch (e: any) { if (e.response?.status === 401) setIsFollowing(false); }
    };
    fetchFollowStatus();
  }, [targetUserId]);

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
      await axios.post(`/api/users/${targetUserId}/follow`, null, { withCredentials: true, headers: { Authorization: `Bearer ${token}` } });
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
      await axios.delete(`/api/users/${targetUserId}/unfollow`, { withCredentials: true, headers: { Authorization: `Bearer ${token}` } });
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
    <button type="button" onClick={goProfile} className="w-[100px] h-[100px] rounded-full mb-4 border-2 border-gray-100 shadow focus:outline-none focus:ring-2 focus:ring-black/20" aria-label="프로필로 이동" style={{ backgroundImage: `url(${profileImageUrl})`, backgroundSize: "cover", backgroundPosition: "center" }} />
  ) : (
    <button type="button" onClick={goProfile} className="w-[100px] h-[100px] rounded-full mb-4 border-2 border-gray-100 shadow bg-gray-200 text-gray-700 font-bold flex items-center justify-center text-4xl focus:outline-none focus:ring-2 focus:ring-black/20" aria-label="프로필로 이동">
      {(email?.[0] || userName?.[0] || "?").toUpperCase()}
    </button>
  );

  return (
    <>
      <Toast visible={!!toast} message={toast === "follow" ? "사용자를 팔로우했습니다." : "사용자를 팔로우하지 않습니다."} type={toast === "follow" ? "success" : "info"} size="medium" autoClose={3000} closable={true} onClose={() => setToast(null)} icon={CheckIcon} />
      <Toast visible={errorToast.visible} message={errorToast.message} type="error" size="medium" autoClose={3000} closable={true} onClose={() => setErrorToast(prev => ({ ...prev, visible: false }))} />
      <div className="relative">
        {showLoginPrompt && (<LoginPrompt onLoginClick={() => { setShowLoginPrompt(false); navigate("/login"); }} onSignupClick={() => { setShowLoginPrompt(false); navigate("/join"); }} onClose={() => setShowLoginPrompt(false)} />)}

        <button ref={btnRef} className="flex flex-col items-center gap-1 group" onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)} onClick={goProfile}>
        		<div className="w-14 h-14 rounded-full bg-white shadow flex items-center justify-center mb-1">
			<FaUser className="w-6 h-6" />
		</div>
		<span className="text-xs text-white font-semibold text-center">프로필</span>
      </button>

      {(hover || tooltipHover) && (
        <>
            <div className="absolute right-[calc(100%-10px)] top-1/2 -translate-y-1/2 z-50" style={{ width: 32, height: 32 }} onMouseEnter={() => setTooltipHover(true)} onMouseLeave={() => setTooltipHover(false)}>
              <svg width="32" height="32" viewBox="0 0 32 32"><polygon points="32,16 0,0 0,32" fill="white" stroke="#e5e7eb" strokeWidth="1"/></svg>
          </div>
            <div ref={tooltipRef} className="absolute right-[calc(100%+18px)] top-[-70%] rounded-2xl bg-white shadow-xl border border-gray-300 flex flex-col gap-4 items-center z-50 pt-8 pb-6 w-[360px] h-[380px]" onMouseEnter={() => setTooltipHover(true)} onMouseLeave={() => { setTooltipHover(false); setFollowBtnHover(false); }} onMouseDown={e => e.stopPropagation()}>
              {avatar}
            <div className="text-2xl font-bold mb-1">{userName}</div>
              {!isOwner && (
                <>
            {!isFollowing ? (
                    <button className="bg-white border-2 border-black text-black rounded-full font-bold text-lg shadow hover:bg-gray-100 transition w-[320px] h-[68px] flex items-center justify-center" onClick={handleFollow}>팔로우</button>
            ) : (
                    <button className={`rounded-full font-bold text-lg transition shadow w-[320px] h-[68px] flex items-center justify-center ${followBtnHover ? "bg-[#F6323E] text-white border-2 border-[#F6323E]" : "bg-white border-2 border-black text-black"}`} onClick={handleUnfollow} onMouseEnter={() => setFollowBtnHover(true)} onMouseLeave={() => setFollowBtnHover(false)}>
                {followBtnHover ? "팔로우 취소" : "팔로잉"}
              </button>
                  )}
                </>
            )}
          </div>
        </>
      )}
    </div>
    </>
  );
}
