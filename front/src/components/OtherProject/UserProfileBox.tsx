import React, { useEffect, useRef, useState } from "react";
import api from "../../api/axiosInstance";
import { useNavigate } from "react-router-dom";
import LoginPrompt from "./LoginPrompt";
import Toast from "../common/Toast";

import { deleteProject as apiDeleteProject } from "../../api/projectApi";


type Props = {
  userName: string;
  ownerId?: number;
  onFollow?: () => void;
  onSuggest?: () => void;
  isOwner?: boolean;
  email?: string;
  profileImageUrl?: string | null;
  projectId?: number;
  initialIsFollowing?: boolean;
};

export default function UserProfileBox({
  userName,
  ownerId,
  onFollow,
  onSuggest,
  isOwner = false,
  email,
  profileImageUrl,
  projectId,
  initialIsFollowing,
}: Props) {
  const [isFollowing, setIsFollowing] = useState(initialIsFollowing ?? false);
  const [toast, setToast] = useState<null | "follow" | "unfollow">(null);
  const [errorToast, setErrorToast] = useState<{ visible: boolean; message: string }>({ visible: false, message: '' });
  const [followBtnHover, setFollowBtnHover] = useState(false);
  const followBtnRef = useRef<HTMLButtonElement>(null);
  const navigate = useNavigate();
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);

  useEffect(() => {
    if (typeof initialIsFollowing === "boolean") {
      setIsFollowing(initialIsFollowing);
    }
  }, [initialIsFollowing]);

  useEffect(() => {
    if (typeof initialIsFollowing === "boolean") return;
    const token = localStorage.getItem("accessToken") || sessionStorage.getItem("accessToken");
    if (!token || !ownerId || ownerId <= 0) { setIsFollowing(false); return; }
    (async () => {
      try {
        const res = await api.get(`/users/${ownerId}/follow-status`);
        setIsFollowing(!!res.data?.isFollowing);
      } catch (e: any) { if (e.response?.status === 401) setIsFollowing(false); }
    })();
  }, [ownerId, initialIsFollowing]);

  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent).detail as { userId?: number; isFollowing?: boolean };
      if (detail?.userId && ownerId && detail.userId === ownerId && typeof detail.isFollowing === "boolean") setIsFollowing(detail.isFollowing);
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
    if (!token) { setShowLoginPrompt(true); return false; }
    return true;
  };

  const handleToggle = async () => {
    if (!ensureLogin()) return;
    if (!ownerId || ownerId <= 0) { setErrorToast({ visible: true, message: "대상 사용자를 확인할 수 없습니다." }); return; }
    try {
      if (isFollowing) {
        await api.delete(`/users/${ownerId}/unfollow`);
        setIsFollowing(false);
        setToast("unfollow");
        window.dispatchEvent(new CustomEvent("followChanged", { detail: { userId: ownerId, isFollowing: false } }));
      } else {
        await api.post(`/users/${ownerId}/follow`, null);
        setIsFollowing(true);
        setToast("follow");
        window.dispatchEvent(new CustomEvent("followChanged", { detail: { userId: ownerId, isFollowing: true } }));
      }
      onFollow?.();
    } catch (e: any) {
      if (e.response?.status === 401) { setShowLoginPrompt(true); return; }
      setErrorToast({ visible: true, message: "팔로우 처리 중 오류가 발생했습니다." });
    }
  };

  const handleSuggest = () => { if (!ensureLogin()) return; onSuggest?.(); try { window.dispatchEvent(new Event("suggest:open")); } catch {} };

  const onEdit = () => { if (ownerId && projectId) navigate(`/project/edit/${ownerId}/${projectId}`); };
  const onDelete = async () => {
    if (!ownerId || !projectId) return;
    if (!window.confirm("정말 이 프로젝트를 삭제하시겠습니까?")) return;
    try {
      await apiDeleteProject(ownerId, projectId);
      navigate(`/users/${ownerId}`);
    } catch (e: any) {
      setErrorToast({ visible: true, message: e?.message || "삭제 실패" });
    }
  };

  const displayName = userName;
  const avatar = profileImageUrl ? (
    <img src={profileImageUrl} alt="avatar" className="w-14 h-14 rounded-full object-cover" />
  ) : (
    <div className="w-14 h-14 rounded-full mb-4 bg-gray-200 text-gray-700 font-bold flex items-center justify-center cursor-pointer">
      {(email?.[0] || userName?.[0] || "?").toUpperCase()}
    </div>
  );

  return (
    <>
      <Toast visible={!!toast} message={toast === "follow" ? "사용자를 팔로우했습니다." : "사용자를 팔로우하지 않습니다."} type={toast === "follow" ? "success" : "info"} size="medium" autoClose={3000} closable={true} onClose={() => setToast(null)} icon={<svg width="16" height="16" viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12" fill="none" stroke="#fff" strokeWidth="3"/></svg>} />
      <Toast visible={errorToast.visible} message={errorToast.message} type="error" size="medium" autoClose={3000} closable={true} onClose={() => setErrorToast(prev => ({ ...prev, visible: false }))} />
      <div className="flex flex-col items-center mb-16">
        {showLoginPrompt && (<LoginPrompt onLoginClick={() => { setShowLoginPrompt(false); navigate("/login"); }} onSignupClick={() => { setShowLoginPrompt(false); navigate("/join"); }} onClose={() => setShowLoginPrompt(false)} />)}
        <div role="button" className="w-14 h-14 rounded-full mb-4 overflow-hidden cursor-pointer" onClick={() => ownerId && navigate(((Number(localStorage.getItem('userId') || sessionStorage.getItem('userId') || '0')) === ownerId) ? '/profile' : `/users/${ownerId}`)} title="프로필 보기">
          {avatar}
        </div>
        <div className="text-2xl font-bold mb-3">{displayName}</div>
        <div className="flex gap-6" />
      </div>
    </>
  );
}
