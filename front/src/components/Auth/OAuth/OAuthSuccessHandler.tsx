// src/components/Auth/Login/OAuthSuccessHandler.tsx
import React, { useEffect, useRef } from "react";

const OAuthSuccessHandler: React.FC = () => {
    const isHandled = useRef(false); // ✅ 중복 실행 방지

    useEffect(() => {
        if (isHandled.current) return;
        isHandled.current = true;

        const urlParams = new URLSearchParams(window.location.search);
        const token = urlParams.get("token");
        const refreshToken = urlParams.get("refreshToken");
        const provider = urlParams.get("provider");
        const isProfileSet = urlParams.get("isProfileSet") === "true";

        if (!token) {
            alert("토큰이 없습니다. 다시 로그인해주세요.");
            window.location.href = "/login";
            return;
        }

        // ✅ 토큰 저장
        localStorage.setItem("accessToken", token);
        if (refreshToken) localStorage.setItem("refreshToken", refreshToken);
        if (provider) localStorage.setItem("lastLoginMethod", provider);

        // ✅ alert 후 완전 새로고침 (검은 화면 문제 방지)
        alert("소셜 로그인 성공!");
        window.location.href = isProfileSet ? "/" : "/oauth/profile-step";
    }, []);

    return <div className="text-center mt-10 text-green-600">로그인 중입니다...</div>;
};

export default OAuthSuccessHandler;
