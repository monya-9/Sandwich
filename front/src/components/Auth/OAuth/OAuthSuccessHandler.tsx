// OAuthSuccessHandler.tsx
import React, { useEffect, useRef, useContext } from "react";
import axios from "axios";
import { AuthContext } from "../../../context/AuthContext";
import { setToken } from "../../../utils/tokenStorage";

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
        const email = urlParams.get("email") || undefined;

        if (!token) {
            window.location.replace("/login");
            return;
        }

        // 토큰 저장 (keepLogin = true)
        setToken(token, true); // <- 내부에서 localStorage.setItem('accessToken', token) 이어야 함
        if (refreshToken) localStorage.setItem("refreshToken", refreshToken);
        if (provider) localStorage.setItem("lastLoginMethod", provider);
        if (email) localStorage.setItem("userEmail", email);

        // 바로 axios 기본 Authorization도 설정(대기 없이 API 호출 가능)
        axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;

        // URL에서 토큰 제거 (히스토리만 교체)
        window.history.replaceState(null, "", "/oauth2/success");

        // 컨텍스트 갱신
        login(email);

        // 프로필 완료 여부에 따라 이동
        window.location.replace(isProfileSet ? "/" : "/oauth/profile-step");
    }, [login]);

    return <div className="text-center mt-10 text-green-600">로그인 중입니다…</div>;
};

export default OAuthSuccessHandler;
