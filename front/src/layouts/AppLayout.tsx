import React, { useEffect } from "react";
import { Outlet } from "react-router-dom";
import Header from "../components/common/Header/Header";
import { ensureNicknameInStorage } from "../utils/profile";

export default function AppLayout() {
    useEffect(() => {
        const token =
            localStorage.getItem("accessToken") || sessionStorage.getItem("accessToken");
        if (!token) return;

        const storage = localStorage.getItem("accessToken") ? localStorage : sessionStorage;

        const hasNickname =
            (storage.getItem("userNickname") || "").trim().length > 0 ||
            (storage.getItem("userProfileName") || "").trim().length > 0;

        const email = storage.getItem("userEmail") || "";

        if (!hasNickname) {
            ensureNicknameInStorage(token, email, storage);
        }
    }, []);

    return (
        <div className="min-h-dvh">
            <Header />
            <div className="h-20 md:h-20" />
            <main className="mx-auto w-full">
                <Outlet />
            </main>
        </div>
    );
}
