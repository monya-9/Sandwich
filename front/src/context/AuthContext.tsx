// context/AuthContext.tsx
import React, { createContext, useEffect, useState, ReactNode, useCallback } from "react";
import { ensureNicknameInStorage } from "../utils/profile"; // 네 함수 경로
// 토큰 저장/조회 유틸이 따로 있으면 써도 OK

type AuthContextType = {
    isLoggedIn: boolean;
    email: string | null;
    nickname: string | null;
    login: (hintEmail?: string) => Promise<void>; // 로그인 직후 호출
    logout: () => void;
    refreshProfile: () => Promise<void>;          // 앱 부팅/프로필 저장 후 호출
};

export const AuthContext = createContext<AuthContextType>({
    isLoggedIn: false,
    email: null,
    nickname: null,
    login: async () => {},
    logout: () => {},
    refreshProfile: async () => {},
});

interface Props { children: ReactNode }

const readToken = () =>
    localStorage.getItem("accessToken") || sessionStorage.getItem("accessToken");

const pickStorage = () =>
    localStorage.getItem("accessToken") ? localStorage :
        sessionStorage.getItem("accessToken") ? sessionStorage : localStorage;

export const AuthProvider = ({ children }: Props) => {
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [email, setEmail] = useState<string | null>(null);
    const [nickname, setNickname] = useState<string | null>(null);

    const refreshFromStorage = () => {
        const s = pickStorage();
        const e = s.getItem("userEmail");
        const n = s.getItem("userNickname");
        setEmail(e);
        setNickname(n);
    };

    const refreshProfile = useCallback(async () => {
        const token = readToken();
        const s = pickStorage();

        if (!token) {
            setIsLoggedIn(false);
            setEmail(null);
            setNickname(null);
            return;
        }

        // fallbackEmail은 일단 저장된 값이나 빈 문자열
        const fallbackEmail = s.getItem("userEmail") || "";
        await ensureNicknameInStorage(token, fallbackEmail, s);

        setIsLoggedIn(true);
        refreshFromStorage();
    }, []);

    // 앱 부팅 시 1회
    useEffect(() => { refreshProfile(); }, [refreshProfile]);

    const login = async (hintEmail?: string) => {
        // OAuthSuccessHandler가 토큰을 이미 저장한 상태라고 가정
        if (hintEmail) {
            const s = pickStorage();
            s.setItem("userEmail", hintEmail);
        }
        await refreshProfile();
    };

    const logout = () => {
        setIsLoggedIn(false);
        setEmail(null);
        setNickname(null);

        localStorage.removeItem("accessToken");
        sessionStorage.removeItem("accessToken");
        localStorage.removeItem("refreshToken");
        sessionStorage.removeItem("refreshToken");

        localStorage.removeItem("userEmail");
        sessionStorage.removeItem("userEmail");
        localStorage.removeItem("userNickname");
        sessionStorage.removeItem("userNickname");
        localStorage.removeItem("userUsername");
        sessionStorage.removeItem("userUsername");
        localStorage.removeItem("userProfileName");
        sessionStorage.removeItem("userProfileName");
    };

    return (
        <AuthContext.Provider value={{ isLoggedIn, email, nickname, login, logout, refreshProfile }}>
            {children}
        </AuthContext.Provider>
    );
};
