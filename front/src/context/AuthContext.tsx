import React, { createContext, useState, useEffect, ReactNode } from "react";

interface AuthContextType {
    isLoggedIn: boolean;
    email: string | null;          // 화면에 보여줄 이메일
    login: (email?: string) => void; // 로그인 시 이메일 주입
    logout: () => void;
}

export const AuthContext = createContext<AuthContextType>({
    isLoggedIn: false,
    email: null,
    login: () => {},
    logout: () => {},
});

interface Props { children: ReactNode }

export const AuthProvider = ({ children }: Props) => {
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [email, setEmail] = useState<string | null>(null);

    // 부팅 시 복원 + 잘못 저장된 이메일(JWT) 정리
    useEffect(() => {
        const token =
            localStorage.getItem("accessToken") || sessionStorage.getItem("accessToken");

        let storedEmail =
            localStorage.getItem("userEmail") || sessionStorage.getItem("userEmail");

        const looksLikeJwt =
            !!storedEmail && storedEmail.split(".").length === 3 && storedEmail.length > 50;
        if (looksLikeJwt) {
            localStorage.removeItem("userEmail");
            sessionStorage.removeItem("userEmail");
            storedEmail = null;
        }

        setIsLoggedIn(!!token);
        setEmail(storedEmail);
    }, []);

    // 다른 탭/창과 동기화
    useEffect(() => {
        const handleStorageChange = () => {
            const token =
                localStorage.getItem("accessToken") || sessionStorage.getItem("accessToken");
            let storedEmail =
                localStorage.getItem("userEmail") || sessionStorage.getItem("userEmail");

            const looksLikeJwt =
                !!storedEmail && storedEmail.split(".").length === 3 && storedEmail.length > 50;
            if (looksLikeJwt) {
                localStorage.removeItem("userEmail");
                sessionStorage.removeItem("userEmail");
                storedEmail = null;
            }

            setIsLoggedIn(!!token);
            setEmail(storedEmail);
        };

        window.addEventListener("storage", handleStorageChange);
        return () => window.removeEventListener("storage", handleStorageChange);
    }, []);

    const login = (userEmail?: string) => {
        setIsLoggedIn(true);
        if (userEmail) {
            setEmail(userEmail);

            // 토큰이 저장된 쪽에 이메일도 맞춰 저장
            const tokenInLocal = !!localStorage.getItem("accessToken");
            if (tokenInLocal) localStorage.setItem("userEmail", userEmail);
            else sessionStorage.setItem("userEmail", userEmail);
        }
    };

    const logout = () => {
        setIsLoggedIn(false);
        setEmail(null);
        localStorage.removeItem("accessToken");
        sessionStorage.removeItem("accessToken");
        localStorage.removeItem("refreshToken");
        sessionStorage.removeItem("refreshToken"); // ✅ 추가
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
        <AuthContext.Provider value={{ isLoggedIn, email, login, logout }}>
            {children}
        </AuthContext.Provider>
    );
};
