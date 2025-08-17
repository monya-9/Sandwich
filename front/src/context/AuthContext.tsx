import React, { createContext, useState, useEffect, ReactNode } from 'react';

interface AuthContextType {
    isLoggedIn: boolean;
    email: string | null;
    /** 로그인 시 이메일을 넘기면 상태/저장에 반영 */
    login: (email?: string) => void;
    /** 로그아웃: 토큰/이메일 모두 정리 */
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

    // 최초 로딩: token/email을 localStorage 또는 sessionStorage에서 읽어옴
    useEffect(() => {
        const token = localStorage.getItem('accessToken') || sessionStorage.getItem('accessToken');
        const storedEmail = localStorage.getItem('userEmail') || sessionStorage.getItem('userEmail');
        setIsLoggedIn(!!token);
        setEmail(storedEmail);
    }, []);

    // 다른 탭/창에서 storage 변경시 로그인 여부 동기화 (develop에서 가져온 포인트)
    useEffect(() => {
        const handleStorageChange = () => {
            const token = localStorage.getItem('accessToken') || sessionStorage.getItem('accessToken');
            const storedEmail = localStorage.getItem('userEmail') || sessionStorage.getItem('userEmail');
            setIsLoggedIn(!!token);
            setEmail(storedEmail);
        };
        window.addEventListener('storage', handleStorageChange);
        return () => window.removeEventListener('storage', handleStorageChange);
    }, []);

    // 로그인: 이메일 상태 및 저장(저장 위치는 로그인 플로우에서 정한 방식 유지)
    const login = (userEmail?: string) => {
        setIsLoggedIn(true);
        if (userEmail) {
            setEmail(userEmail);
            // 기존 정책대로 localStorage에 저장 (필요 시 sessionStorage 사용 부분에서 덮어쓸 수 있음)
            localStorage.setItem('userEmail', userEmail);
        }
    };

    // 로그아웃: 상태/토큰/이메일 모두 제거
    const logout = () => {
        setIsLoggedIn(false);
        setEmail(null);
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
