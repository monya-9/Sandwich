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
    <img src={ownerImageUrl} alt="avatar" className="w-full h-full rounded-full object-cover" />
  ) : (
    <div className="w-full h-full rounded-full bg-gray-200 text-gray-700 font-bold flex items-center justify-center text-lg sm:text-xl">
      {(ownerEmail?.[0] || userName?.[0] || "?").toUpperCase()}
    </div>
  );

  return (
    <>
      <Toast visible={!!toast} message={toast === "follow" ? "사용자를 팔로우했습니다." : "사용자를 팔로우하지 않습니다."} type={toast === "follow" ? "success" : "info"} size="medium" autoClose={3000} closable={true} onClose={() => setToast(null)} icon={CheckIcon} />
      <Toast visible={errorToast.visible} message={errorToast.message} type="error" size="medium" autoClose={3000} closable={true} onClose={() => setErrorToast(prev => ({ ...prev, visible: false }))} />
      <div className="w-full flex items-start gap-2 sm:gap-4 mb-4 sm:mb-6 md:mb-8">
        {showLoginPrompt && (
          <LoginPrompt onLoginClick={() => { setShowLoginPrompt(false); navigate("/login"); }} onSignupClick={() => { setShowLoginPrompt(false); navigate("/join"); }} onClose={() => setShowLoginPrompt(false)} />
        )}
        <div role="button" className="w-12 h-12 sm:w-14 sm:h-14 rounded-full flex-shrink-0 cursor-pointer overflow-hidden" onClick={() => ownerId && navigate(((Number(localStorage.getItem('userId') || sessionStorage.getItem('userId') || '0')) === ownerId) ? '/profile' : `/users/${ownerId}`)} title="프로필 보기">
          {avatar}
        </div>
        <div className="flex-1 min-w-0">
          {/* 프로젝트 제목 - 한줄 소개 */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2 flex-wrap mb-1">
            <h1 className="text-base sm:text-lg md:text-xl font-bold text-black dark:text-white break-words">
              {projectName}
              {!!(intro && intro.trim()) && (
                <span className="text-[15px] sm:text-[15px] md:text-[15px] text-black dark:text-white font-normal leading-tight ml-1">
                  - {intro}
                </span>
              )}
            </h1>
            {/* 데스크톱: 제목 옆에 버튼 표시 */}
            {isOwner && (
              <div className="hidden sm:flex items-center gap-2 mt-1 sm:mt-0 sm:ml-4">
                <button className="bg-white dark:bg-[var(--surface)] border border-[#E5E7EB] dark:border-[var(--border-color)] text-gray-700 dark:text-white hover:bg-gray-50 dark:hover:bg-[var(--surface)]/80 rounded-full px-3 py-1 sm:px-4 sm:py-1.5 text-xs sm:text-sm font-semibold" onClick={onEdit}>수정하기</button>
                <button className="bg-[#F6323E] text-white hover:bg-[#e42b36] rounded-full px-3 py-1 sm:px-4 sm:py-1.5 text-xs sm:text-sm font-semibold" onClick={onDelete}>삭제하기</button>
              </div>
            )}
          </div>
          {/* 닉네임 */}
          <div className="text-sm sm:text-base md:text-[18px] text-black dark:text-white truncate mb-2 sm:mb-0">{userName}</div>
          {/* 모바일: 닉네임 아래 버튼 표시 */}
          {isOwner && (
            <div className="flex sm:hidden items-center gap-2 mt-2">
              <button className="bg-white dark:bg-[var(--surface)] border border-[#E5E7EB] dark:border-[var(--border-color)] text-gray-700 dark:text-white hover:bg-gray-50 dark:hover:bg-[var(--surface)]/80 rounded-full px-3 py-1 text-xs font-semibold" onClick={onEdit}>수정하기</button>
              <button className="bg-[#F6323E] text-white hover:bg-[#e42b36] rounded-full px-3 py-1 text-xs font-semibold" onClick={onDelete}>삭제하기</button>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
