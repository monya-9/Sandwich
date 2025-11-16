import React, { useEffect, useState, useContext } from "react";
import api from "../../api/axiosInstance";
import { useNavigate } from "react-router-dom";
import LoginPrompt from "./LoginPrompt";
import Toast from "../common/Toast";
import { deleteProject as apiDeleteProject } from "../../api/projectApi";
import { AuthContext } from "../../context/AuthContext";


type Props = {
  projectName: string;
  userName: string;
  intro: string;
  ownerId?: number;
  ownerEmail?: string;
  ownerImageUrl?: string;
  isOwner?: boolean;
  projectId?: number;
  initialIsFollowing?: boolean;
};

export default function ProjectTopInfo({ projectName, userName, intro, ownerId, ownerEmail, ownerImageUrl, isOwner, projectId, initialIsFollowing }: Props) {
  const [isFollowing, setIsFollowing] = useState(initialIsFollowing ?? false);
  const [toast, setToast] = useState<null | "follow" | "unfollow">(null);
  const [errorToast, setErrorToast] = useState<{ visible: boolean; message: string }>({
    visible: false,
    message: ''
  });
  const navigate = useNavigate();
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);
  
  // ✅ httpOnly 쿠키 기반: AuthContext에서 로그인 상태 확인
  const { isLoggedIn, isAuthChecking } = useContext(AuthContext);


  useEffect(() => {
    if (typeof initialIsFollowing === "boolean") {
      setIsFollowing(initialIsFollowing);
    }
  }, [initialIsFollowing]);

  useEffect(() => {
    if (typeof initialIsFollowing === "boolean") return;
    
    // 인증 확인 중이거나 로그인하지 않았으면 스킵
    if (isAuthChecking || !isLoggedIn || !ownerId || ownerId <= 0) {
      setIsFollowing(false);
      return;
    }
    
    (async () => {
      try {
        const res = await api.get(`/users/${ownerId}/follow-status`);
        setIsFollowing(!!res.data?.isFollowing);
      } catch (e: any) {
        if (e.response?.status === 401) {
          setIsFollowing(false);
        }
      }
    })();
  }, [ownerId, initialIsFollowing, isLoggedIn, isAuthChecking]);

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
    if (isAuthChecking) return false;
    
    if (!isLoggedIn) {
      setShowLoginPrompt(true);
      return false;
    }
    return true;
  };

  const handleToggleFollow = async () => {
    if (!ensureLogin()) return;
    if (!ownerId || ownerId <= 0) {
      setErrorToast({ visible: true, message: "대상 사용자를 확인할 수 없습니다." });
      return;
    }
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
    } catch (e: any) {
      if (e.response?.status === 401) { setShowLoginPrompt(true); return; }
      setErrorToast({ visible: true, message: "팔로우 처리 중 오류가 발생했습니다." });
    }
  };


  const onEdit = () => { if (ownerId && projectId) navigate(`/project/edit/${ownerId}/${projectId}`); };
  const onDelete = async () => {
    if (!ownerId || !projectId) return;
    if (!window.confirm("정말 이 프로젝트를 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.")) return;
    try {
      await apiDeleteProject(ownerId, projectId);
      navigate(`/users/${ownerId}`);
    } catch (e: any) {
      setErrorToast({ visible: true, message: e?.message || "삭제 실패" });
    }
  };

  const CheckIcon = (
    <svg width="16" height="16" viewBox="0 0 24 24">
      <polyline points="20 6 9 17 4 12" fill="none" stroke="#fff" strokeWidth="3"/>
    </svg>
  );

  // 아바타 계산: 이미지 우선, 없으면 이메일 이니셜
  const avatar = ownerImageUrl ? (
    <img src={ownerImageUrl} alt="avatar" className="w-14 h-14 rounded-full object-cover" />
  ) : (
    <div className="w-14 h-14 rounded-full bg-gray-200 text-gray-700 font-bold flex items-center justify-center">
      {(ownerEmail?.[0] || userName?.[0] || "?").toUpperCase()}
    </div>
  );

  return (
    <>
      <Toast visible={!!toast} message={toast === "follow" ? "사용자를 팔로우했습니다." : "사용자를 팔로우하지 않습니다."} type={toast === "follow" ? "success" : "info"} size="medium" autoClose={3000} closable={true} onClose={() => setToast(null)} icon={CheckIcon} />
      <Toast visible={errorToast.visible} message={errorToast.message} type="error" size="medium" autoClose={3000} closable={true} onClose={() => setErrorToast(prev => ({ ...prev, visible: false }))} />
      <div className="w-full flex items-start gap-4 mb-8">
        {showLoginPrompt && (
          <LoginPrompt onLoginClick={() => { setShowLoginPrompt(false); navigate("/login"); }} onSignupClick={() => { setShowLoginPrompt(false); navigate("/join"); }} onClose={() => setShowLoginPrompt(false)} />
        )}
        <div role="button" className="w-14 h-14 rounded-full flex-shrink-0 cursor-pointer overflow-hidden" onClick={() => ownerId && navigate(((Number(localStorage.getItem('userId') || sessionStorage.getItem('userId') || '0')) === ownerId) ? '/profile' : `/users/${ownerId}`)} title="프로필 보기">
          {avatar}
        </div>
        <div>
          <div className="flex items-center gap-2 flex-wrap">
          <h1 className="text-2xl font-bold text-black">{projectName}</h1>
            {isOwner && (
              <div className="flex items-center gap-2 ml-20">
                <button className="bg-white border border-[#E5E7EB] text-gray-700 hover:bg-gray-50 rounded-full px-4 py-1.5 text-sm font-semibold" onClick={onEdit}>수정하기</button>
                <button className="bg-[#F6323E] text-white hover:bg-[#e42b36] rounded-full px-4 py-1.5 text-sm font-semibold" onClick={onDelete}>삭제하기</button>
              </div>
            )}
          </div>
          {/* 소개 말풍선 (한줄 소개가 있을 때만 표시) */}
          {!!(intro && intro.trim()) && (
            <div className="mt-2 relative">
              <div className="inline-flex relative bg-white text-gray-900 text-[15px] px-4 py-2 rounded-3xl border border-gray-200 shadow-sm max-w-[640px] min-w-[72px] min-h-[36px] items-center justify-center text-center break-words">
                {intro}
                <div className="absolute left-4 -bottom-1 w-3 h-3 bg-white rotate-45 shadow-sm border-r border-b border-gray-200"></div>
              </div>
            </div>
          )}
          {/* 닉네임 */}
          <div className="flex items-center gap-2 text-gray-600 text-base mt-2">
            <span>{userName}</span>
          </div>
        </div>
      </div>
    </>
  );
}
