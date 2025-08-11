import React, { createContext, useState, useEffect, ReactNode } from 'react';

export const AuthContext = createContext({
    isLoggedIn: false,
    login: (token?: string) => {},
    logout: () => {},
});

interface Props {
    children: ReactNode;
}

export const AuthProvider = ({ children }: Props) => {
    const [isLoggedIn, setIsLoggedIn] = useState(false);

    useEffect(() => {
        const token = localStorage.getItem('accessToken');
        setIsLoggedIn(!!token);
    }, []);

    // 토큰 변경 감지를 위한 이벤트 리스너 추가
    useEffect(() => {
        const handleStorageChange = () => {
            const token = localStorage.getItem('accessToken');
            setIsLoggedIn(!!token);
        };

        window.addEventListener('storage', handleStorageChange);
        return () => window.removeEventListener('storage', handleStorageChange);
    }, []);

    const login = (token?: string) => {
        if (token) {
            localStorage.setItem('accessToken', token);
        }
        setIsLoggedIn(true);
    };
    const logout = () => {
        setIsLoggedIn(false);
        localStorage.removeItem('accessToken');
    };

    return (
        <AuthContext.Provider value={{ isLoggedIn, login, logout }}>
            {children}
        </AuthContext.Provider>
    );
};
