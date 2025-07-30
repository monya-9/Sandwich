// components/Auth/OAuth/OAuthSuccessHandler.tsx
import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";

const OAuthSuccessHandler = () => {
    const navigate = useNavigate();

    useEffect(() => {
        const urlParams = new URLSearchParams(window.location.search);
        const token = urlParams.get("token");
        const provider = urlParams.get("provider");

        if (provider) {
            localStorage.setItem("lastLoginMethod", provider);
        }

        if (token) {
            localStorage.setItem("accessToken", token); // 원하면 refreshToken도 처리
            navigate("/"); // 홈 또는 원하는 페이지로 리다이렉트
        } else {
            navigate("/oauth2/error?message=토큰이+없습니다");
        }
    }, [navigate]);

    return <div className="text-center mt-10 text-green-600">로그인 중입니다...</div>;
};

export default OAuthSuccessHandler;
