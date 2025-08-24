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
            // ✅ 토큰 없으면 로그인 페이지로 이동
            window.location.replace("/login");
            return;
        }

        // ✅ 토큰 저장
        localStorage.setItem("accessToken", token);
        if (refreshToken) localStorage.setItem("refreshToken", refreshToken);
        if (provider) localStorage.setItem("lastLoginMethod", provider);

        // ✅ alert 없이 바로 리다이렉트
        window.location.replace(isProfileSet ? "/" : "/oauth/profile-step");
    }, []);

    // ✅ 혹시 아주 잠깐 보이는 로딩 화면
    return <div className="text-center mt-10 text-green-600">로그인 중입니다...</div>;
};

export default OAuthSuccessHandler;
