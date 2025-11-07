// src/components/Auth/OAuth/OAuthSuccessHandler.tsx
import React, { useEffect, useRef, useContext } from "react";
import { AuthContext } from "../../../context/AuthContext";
import { clearAllUserData } from "../../../utils/tokenStorage";
import api from "../../../api/axiosInstance";

type Me = {
    id: number;
    email: string;
    nickname?: string | null;
    username?: string | null;
    profileName?: string | null;
    profileSlug?: string | null; // 프로필 URL용 슬러그
};

const OAuthSuccessHandler: React.FC = () => {
    const isHandled = useRef(false);
    const { login, clearState } = useContext(AuthContext);

    useEffect(() => {
        if (isHandled.current) return;
        isHandled.current = true;

        (async () => {
            // ✅ httpOnly=true 쿠키는 JavaScript에서 읽을 수 없음 (보안상 정상)
            // axios가 자동으로 쿠키를 전송하므로 직접 읽을 필요 없음

            // URL 파라미터에서 메타 정보 읽기
            const q = new URLSearchParams(window.location.search);
            const provider = q.get("provider");
            const emailFromUrl = q.get("email") || undefined;
            const isProfileSetFlag = q.get("isProfileSet") === "true";
            const needNickname = q.get("needNickname") === "true";

            if (!emailFromUrl) {
                console.error("❌ 이메일 정보가 없습니다");
                window.location.replace("/login");
                return;
            }

            // ✅ 1. 기존 모든 사용자 데이터 완전 삭제
            clearAllUserData();

            // ✅ 2. React 상태 즉시 초기화 (깜빡임 방지)
            clearState(); // React 상태만 즉시 초기화

            // ✅ 3. 토큰은 httpOnly 쿠키에 있음 (JavaScript 접근 불가, 자동 전송됨)
            console.log("🔍 OAuthSuccessHandler - httpOnly 쿠키 방식:", {
                provider,
                email: emailFromUrl,
                needNickname
            });
            
            if (provider) localStorage.setItem("lastLoginMethod", provider);
            if (emailFromUrl) localStorage.setItem("userEmail", emailFromUrl);

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

                if (display) {
                    localStorage.setItem("userNickname", display);
                    sessionStorage.setItem("userNickname", display);
                }
                if (me.username) {
                    localStorage.setItem("userUsername", me.username);
                    const scopedKey = me.email ? `userUsername:${me.email}` : undefined;
                    if (scopedKey) localStorage.setItem(scopedKey, me.username);
                }
                if (me.profileName) localStorage.setItem("userProfileName", me.profileName);
                // ✅ profileSlug 저장
                if (me.profileSlug) {
                    localStorage.setItem("profileUrlSlug", me.profileSlug);
                    const scopedSlugKey = me.email ? `profileUrlSlug:${me.email}` : undefined;
                    if (scopedSlugKey) localStorage.setItem(scopedSlugKey, me.profileSlug);
                }
                localStorage.setItem("userEmail", me.email || emailFromUrl || "");

                // 닉네임 변경 이벤트 발생
                if (display) {
                    window.dispatchEvent(new Event("user-nickname-updated"));
                }

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
        <div className="flex justify-center items-center min-h-screen bg-white dark:bg-black">
            <div className="text-center text-green-600 dark:text-green-400">로그인 중입니다…</div>
        </div>
    );
};

export default OAuthSuccessHandler;
