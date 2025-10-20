import React, { useEffect } from "react";
import { Outlet } from "react-router-dom";
import Header from "../components/common/Header/Header";
import { ensureNicknameInStorage } from "../utils/profile";

export default function AppLayout() {
    // 최초 진입 시 저장된 테마 적용
    useEffect(() => {
        const saved = (localStorage.getItem("theme") || "").toLowerCase();
        const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
        const isDark = saved === 'dark' ? true : saved === 'light' ? false : prefersDark; // system 또는 미설정은 OS 선호도
        document.documentElement.classList.toggle('dark', isDark);
    }, []);
    useEffect(() => {
        const token =
            localStorage.getItem("accessToken") || sessionStorage.getItem("accessToken");
        if (!token) return;

        const storage = localStorage.getItem("accessToken") ? localStorage : sessionStorage;

        const hasNickname =
            (storage.getItem("userNickname") || "").trim().length > 0 ||
            (storage.getItem("userProfileName") || "").trim().length > 0;
        const hasUserId = !!(storage.getItem("userId") || "").trim();

        const email = storage.getItem("userEmail") || "";

        if (!hasUserId || !hasNickname) {
            ensureNicknameInStorage(token, email, storage);
        }
    }, []);

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
