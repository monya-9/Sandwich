import React, { useEffect, useRef, useContext } from "react";
import { AuthContext } from "../../../context/AuthContext";

const OAuthSuccessHandler: React.FC = () => {
    const isHandled = useRef(false); // ✅ 중복 실행 방지
    const { login } = useContext(AuthContext);

    useEffect(() => {
        if (isHandled.current) return;
        isHandled.current = true;

        const urlParams = new URLSearchParams(window.location.search);
        const token = urlParams.get("token");
        const refreshToken = urlParams.get("refreshToken");
        const provider = urlParams.get("provider");
        const isProfileSet = urlParams.get("isProfileSet") === "true";
        const email = urlParams.get("email"); // ✅ 백엔드에서 추가한 이메일 받기

        if (!token) {
            // ✅ 토큰 없으면 로그인 페이지로 이동
            window.location.replace("/login");
            return;
        }

        // ✅ 토큰 저장
        localStorage.setItem("accessToken", token);
        if (refreshToken) localStorage.setItem("refreshToken", refreshToken);
        if (provider) localStorage.setItem("lastLoginMethod", provider);
        if (email) localStorage.setItem("userEmail", email); // ✅ 이메일 저장

        // ✅ AuthContext 상태 업데이트
        login(email || undefined);

        // ✅ alert 없이 바로 리다이렉트
        window.location.replace(isProfileSet ? "/" : "/oauth/profile-step");
    }, [login]);

    // ✅ 혹시 아주 잠깐 보이는 로딩 화면
    return <div className="text-center mt-10 text-green-600">로그인 중입니다...</div>;
};

export default OAuthSuccessHandler;
