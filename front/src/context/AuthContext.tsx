// context/AuthContext.tsx
import React, { createContext, useEffect, useState, ReactNode, useCallback } from "react";
import { clearAllUserData } from "../utils/tokenStorage";
import { clearAdminCache } from "../utils/authz";
import api from "../api/axiosInstance";

type AuthContextType = {
    isLoggedIn: boolean;
    isAuthChecking: boolean; // 초기 인증 확인 중 여부
    email: string | null;
    nickname: string | null;
    login: (hintEmail?: string) => Promise<void>; // 로그인 직후 호출
    logout: () => void;
    refreshProfile: () => Promise<void>;          // 앱 부팅/프로필 저장 후 호출
    clearState: () => void;                       // 즉시 상태 초기화 (깜빡임 방지)
};

export const AuthContext = createContext<AuthContextType>({
    isLoggedIn: false,
    isAuthChecking: true,
    email: null,
    nickname: null,
    login: async () => {},
    logout: () => {},
    refreshProfile: async () => {},
    clearState: () => {},
});

interface Props { children: ReactNode }

export const AuthProvider = ({ children }: Props) => {
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [isAuthChecking, setIsAuthChecking] = useState(true); // 초기 인증 확인 중
    const [email, setEmail] = useState<string | null>(null);
    const [nickname, setNickname] = useState<string | null>(null);

    const refreshFromStorage = () => {
        const e = localStorage.getItem("userEmail");
        const n = localStorage.getItem("userNickname");
        setEmail(e);
        setNickname(n);
    };

    const refreshProfile = useCallback(async () => {
        // ✅ httpOnly 쿠키 기반: /users/me API 호출로 로그인 상태 확인
        setIsAuthChecking(true);
        try {
            const { data } = await api.get("/users/me");
            const { id, email, username, nickname, profileName, profileSlug } = data || {};

            // userId 저장 (알림 WS 구독에 필요)
            if (typeof id === "number" && Number.isFinite(id)) {
                localStorage.setItem("userId", String(id));
            }

            // 닉네임 우선(없으면 username 대체)
            const finalNick = (nickname ?? "").trim() || (username ?? "").trim();
            if (finalNick) localStorage.setItem("userNickname", finalNick);

            if (username) localStorage.setItem("userUsername", username);
            if (profileName) localStorage.setItem("userProfileName", profileName);
            if (profileSlug) localStorage.setItem("profileUrlSlug", profileSlug);
            if (email) localStorage.setItem("userEmail", email);

            setIsLoggedIn(true);
            refreshFromStorage();
        } catch (error: any) {
            // ✅ 401 Unauthorized: 로그인하지 않은 상태 (정상)
            if (error?.response?.status === 401) {
                setIsLoggedIn(false);
                setEmail(null);
                setNickname(null);
                return;
            }
            
            // ✅ 기타 에러: 콘솔에 경고만 출력하고 로그아웃 상태로 처리
            console.warn("[AUTH] Failed to fetch user profile:", error?.message || error);
            setIsLoggedIn(false);
            setEmail(null);
            setNickname(null);
        } finally {
            setIsAuthChecking(false);
        }
    }, []);

    // 앱 부팅 시 1회
    useEffect(() => { refreshProfile(); }, [refreshProfile]);

    const login = async (hintEmail?: string) => {
        // ✅ httpOnly 쿠키로 토큰이 자동 설정되므로 별도 저장 불필요
        if (hintEmail) {
            localStorage.setItem("userEmail", hintEmail);
        }
        await refreshProfile();
        
        // ✅ 로그인 성공 이벤트 발생 (FCM 등록 등에 사용)
        window.dispatchEvent(new Event("auth:login:success"));
    };

    const logout = () => {
        // ✅ React 상태 초기화
        setIsLoggedIn(false);
        setEmail(null);
        setNickname(null);

        // ✅ 모든 사용자 데이터 완전 삭제
        clearAllUserData();
        
        // ✅ 관리자 권한 캐시 무효화
        clearAdminCache();
    };

    const clearState = () => {
        // ✅ 즉시 React 상태만 초기화 (스토리지는 삭제하지 않음)
        setIsLoggedIn(false);
        setEmail(null);
        setNickname(null);
    };

    return (
        <AuthContext.Provider value={{ isLoggedIn, isAuthChecking, email, nickname, login, logout, refreshProfile, clearState }}>
            {children}
        </AuthContext.Provider>
    );
};
