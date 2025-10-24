// src/components/Auth/OAuth/OAuthSuccessHandler.tsx
import React, { useEffect, useRef, useContext } from "react";
import { AuthContext } from "../../../context/AuthContext";
import { setToken, clearAllUserData } from "../../../utils/tokenStorage";
import api from "../../../api/axiosInstance";

type Me = {
    id: number;
    email: string;
    nickname?: string | null;
    username?: string | null;
    profileName?: string | null;
};

const OAuthSuccessHandler: React.FC = () => {
    const isHandled = useRef(false);
    const { login, clearState } = useContext(AuthContext);

    useEffect(() => {
        if (isHandled.current) return;
        isHandled.current = true;

        (async () => {
            const q = new URLSearchParams(window.location.search);
            const token = q.get("token");
            const refreshToken = q.get("refreshToken");
            const provider = q.get("provider");
            const emailFromUrl = q.get("email") || undefined;
            const isProfileSetFlag = q.get("isProfileSet") === "true";
            const needNickname = q.get("needNickname") === "true";

            if (!token) {
                window.location.replace("/login");
                return;
            }

            // ✅ 1. 기존 모든 사용자 데이터 완전 삭제
            clearAllUserData();

            // ✅ 2. React 상태 즉시 초기화 (깜빡임 방지)
            clearState(); // React 상태만 즉시 초기화

            // ✅ 3. 새 토큰/부가정보 저장 (OAuth는 keepLogin = true가 일반적)
            console.log("🔍 OAuthSuccessHandler 토큰 저장:", {
                token: token ? "있음" : "없음",
                tokenLength: token?.length,
                refreshToken: refreshToken ? "있음" : "없음",
                provider,
                needNickname
            });
            
            setToken(token, true); // => accessToken을 localStorage에
            if (refreshToken) localStorage.setItem("refreshToken", refreshToken);
            if (provider) localStorage.setItem("lastLoginMethod", provider);
            if (emailFromUrl) localStorage.setItem("userEmail", emailFromUrl);
            
            // 토큰 저장 확인
            console.log("🔍 토큰 저장 후 확인:", {
                storedToken: localStorage.getItem("accessToken") ? "있음" : "없음",
                storedRefreshToken: localStorage.getItem("refreshToken") ? "있음" : "없음"
            });

            // URL 정리 (히스토리만 치환)
            window.history.replaceState(null, "", "/oauth2/success");

            try {
                // ✅ 4. 내 정보 조회 (⚠️ baseURL이 /api라서 여기서는 '/users/me' 만!)
                const me: Me = (await api.get("/users/me")).data;

                // ✅ 5. 새 사용자 정보 저장
                const display =
                    (me.nickname && me.nickname.trim()) ||
                    (me.profileName && me.profileName.trim()) ||
                    (me.username && me.username.trim()) ||
                    "";

                if (display) localStorage.setItem("userNickname", display);
                if (me.username) {
                    localStorage.setItem("userUsername", me.username);
                    const scopedKey = me.email ? `userUsername:${me.email}` : undefined;
                    if (scopedKey) localStorage.setItem(scopedKey, me.username);
                }
                if (me.profileName) localStorage.setItem("userProfileName", me.profileName);
                localStorage.setItem("userEmail", me.email || emailFromUrl || "");

                // ✅ 6. 컨텍스트 갱신
                login(me.email || emailFromUrl);

                // ✅ 7. 닉네임 존재 여부에 따라 이동 (needNickname 파라미터 우선)
                if (needNickname) {
                    window.location.replace("/oauth/profile-step");
                } else {
                    window.location.replace(display ? "/" : "/oauth/profile-step");
                }
            } catch {
                // 실패 시에도 최소한 로그인 컨텍스트는 갱신
                login(emailFromUrl);
                window.location.replace(isProfileSetFlag ? "/" : "/oauth/profile-step");
            }
        })();
    }, [login, clearState]);

    return (
        <div className="text-center mt-10 text-green-600">로그인 중입니다…</div>
    );
};

export default OAuthSuccessHandler;
