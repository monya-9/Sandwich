import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import LoginPrompt from "./LoginPrompt";
import Toast from "../common/Toast";

type Props = {
  projectName: string;
  userName: string;
  intro: string;
  ownerId?: number;
};

export default function ProjectTopInfo({ projectName, userName, intro, ownerId }: Props) {
  const [isFollowing, setIsFollowing] = useState(false);
  const [toast, setToast] = useState<null | "follow" | "unfollow">(null);
  const [errorToast, setErrorToast] = useState<{ visible: boolean; message: string }>({
    visible: false,
    message: ''
  });
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
        if (e.response?.status === 401) {
          setIsFollowing(false);
        }
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

  const handleToggleFollow = async () => {
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

  const CheckIcon = (
    <svg width="16" height="16" viewBox="0 0 24 24">
      <polyline points="20 6 9 17 4 12" fill="none" stroke="#fff" strokeWidth="3"/>
    </svg>
  );

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
      <div className="w-full flex items-start gap-4 mb-8">
        {showLoginPrompt && (
        <LoginPrompt
          onLoginClick={() => { setShowLoginPrompt(false); navigate("/login"); }}
          onSignupClick={() => { setShowLoginPrompt(false); navigate("/join"); }}
          onClose={() => setShowLoginPrompt(false)}
        />
        )}
        <div
          role="button"
          className="w-14 h-14 rounded-full bg-green-600 flex-shrink-0 cursor-pointer"
          onClick={() => ownerId && navigate(`/users/${ownerId}`)}
          title="프로필 보기"
        />
        <div>
          <h1 className="text-2xl font-bold text-black">{projectName}</h1>
          <div className="flex items-center gap-2 text-gray-600 text-base mt-1">
            <span>{userName}</span>
            <span
              className="font-bold text-green-700 ml-2 cursor-pointer hover:underline"
              onClick={handleToggleFollow}
            >
              {isFollowing ? "팔로잉" : "팔로우"}
            </span>
          </div>
          <div className="text-gray-500 text-base mt-1">{intro}</div>
        </div>
      </div>
    </>
  );
}
