// front/src/context/AuthContext.tsx
import React, { createContext, useState, useEffect, ReactNode } from 'react';

interface AuthContextType {
    isLoggedIn: boolean;
    email: string | null;
    /** 로그인 성공 후 상태 갱신 (옵션: 이메일 저장) */
    login: (email?: string) => void;
    logout: () => void;
}

export const AuthContext = createContext<AuthContextType>({
    isLoggedIn: false,
    email: null,
    login: () => {},
    logout: () => {},
});

interface Props {
    children: ReactNode;
}

export const AuthProvider = ({ children }: Props) => {
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [email, setEmail] = useState<string | null>(null);

    // 초기 복원
    useEffect(() => {
        const token =
            localStorage.getItem('accessToken') ||
            sessionStorage.getItem('accessToken');
        const storedEmail =
            localStorage.getItem('userEmail') ||
            sessionStorage.getItem('userEmail');

        setIsLoggedIn(!!token);
        setEmail(storedEmail);
    }, []);

    // 다른 탭/창에서 토큰/이메일이 바뀌었을 때 동기화
    useEffect(() => {
        const handleStorageChange = () => {
            const token =
                localStorage.getItem('accessToken') ||
                sessionStorage.getItem('accessToken');
            const storedEmail =
                localStorage.getItem('userEmail') ||
                sessionStorage.getItem('userEmail');

            setIsLoggedIn(!!token);
            setEmail(storedEmail);
        };

        window.addEventListener('storage', handleStorageChange);
        return () => window.removeEventListener('storage', handleStorageChange);
    }, []);

    const login = (userEmail?: string) => {
        setIsLoggedIn(true);
        if (userEmail) {
            setEmail(userEmail);

            // 토큰이 어디에 있는지에 맞춰 이메일도 같이 저장
            const tokenInLocal = !!localStorage.getItem('accessToken');
            if (tokenInLocal) {
                localStorage.setItem('userEmail', userEmail);
            } else {
                sessionStorage.setItem('userEmail', userEmail);
            }
        }
    };

    const logout = () => {
        setIsLoggedIn(false);
        setEmail(null);
        // 토큰/이메일 모두 정리
        localStorage.removeItem('accessToken');
        sessionStorage.removeItem('accessToken');
        localStorage.removeItem('userEmail');
        sessionStorage.removeItem('userEmail');
    };

    return (
        <AuthContext.Provider value={{ isLoggedIn, email, login, logout }}>
            {children}
        </AuthContext.Provider>
    );
};
