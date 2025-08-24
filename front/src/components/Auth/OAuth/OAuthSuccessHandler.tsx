import React, { useEffect, useRef, useContext } from "react";
import { AuthContext } from "../../../context/AuthContext";
import { setToken } from "../../../utils/tokenStorage"; // 이미 있는 유틸 사용

const OAuthSuccessHandler: React.FC = () => {
    const isHandled = useRef(false);
    const { login } = useContext(AuthContext);

    useEffect(() => {
        if (isHandled.current) return;
        isHandled.current = true;

        const urlParams = new URLSearchParams(window.location.search);
        const token = urlParams.get("token");
        const refreshToken = urlParams.get("refreshToken");
        const provider = urlParams.get("provider");
        const isProfileSet = urlParams.get("isProfileSet") === "true";
        const email = urlParams.get("email"); // 백엔드에서 내려준 이메일

        if (!token) {
            window.location.replace("/login");
            return;
        }

        // ✅ 토큰 저장 (OAuth는 keepLogin = true 가 일반적)
        setToken(token, true);
        if (refreshToken) localStorage.setItem("refreshToken", refreshToken);
        if (provider) localStorage.setItem("lastLoginMethod", provider);
        if (email) localStorage.setItem("userEmail", email);

        // ✅ 컨텍스트 갱신(이메일만 전달)
        login(email || undefined);

        // ✅ 프로필 미완성 시 스텝 페이지로
        window.location.replace(isProfileSet ? "/" : "/oauth/profile-step");
    }, [login]);

    return (
        <div className="text-center mt-10 text-green-600">로그인 중입니다...</div>
    );
};

export default OAuthSuccessHandler;
