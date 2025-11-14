import React, { useEffect } from "react";
import { Outlet } from "react-router-dom";
import Header from "../components/common/Header/Header";

export default function AppLayout() {
    // 최초 진입 시 저장된 테마 적용
    useEffect(() => {
        const saved = (localStorage.getItem("theme") || "").toLowerCase();
        const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
        const isDark = saved === 'dark' ? true : saved === 'light' ? false : prefersDark; // system 또는 미설정은 OS 선호도
        document.documentElement.classList.toggle('dark', isDark);
    }, []);
    
    // ✅ httpOnly 쿠키 기반: 토큰 체크 제거
    // AuthContext에서 /users/me API로 로그인 상태 확인 및 프로필 정보 저장

    return (
        <div className="min-h-dvh bg-white text-gray-900 dark:bg-[#0b1220] dark:text-gray-200">
            <Header />
            <div className="h-20 md:h-20" />
            <main className="mx-auto w-full">
                <Outlet />
            </main>
        </div>
    );
}
