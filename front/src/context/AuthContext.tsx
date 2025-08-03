import React, { createContext, useState, useEffect, ReactNode } from 'react';

interface AuthContextType {
    isLoggedIn: boolean;
    email: string | null;
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

    useEffect(() => {
        const token = localStorage.getItem('accessToken') || sessionStorage.getItem('accessToken');
        const storedEmail = localStorage.getItem('userEmail') || sessionStorage.getItem('userEmail');
        setIsLoggedIn(!!token);
        setEmail(storedEmail);
    }, []);

    const login = (userEmail?: string) => {
        setIsLoggedIn(true);
        if (userEmail) {
            setEmail(userEmail);
            // 저장 방식 유지 (로그인 시 localStorage/sessionStorage 결정)
            localStorage.setItem('userEmail', userEmail);
        }
    };

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
