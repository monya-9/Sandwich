// components/Auth/Intro/SNSButtonGroup.tsx
import React from "react";
import { getStaticUrl } from "../../../../config/staticBase";
import SNSButton from "./SNSButton";
import { SOCIAL_LOGIN_BASE } from "../../../../config/apiBase";

const SNSButtonGroup = () => {
    const handleSocialLogin = (provider: "google" | "github") => {
        // ✅ 소셜 로그인은 직접 백엔드로 이동 (프록시 거치지 않음)
        window.location.href = `${SOCIAL_LOGIN_BASE}/oauth2/authorization/${provider}`;
    };

    return (
        <div className="flex justify-center items-center gap-4">
            <SNSButton icon={getStaticUrl("assets/icons/github.png")} text="깃허브" onClick={() => handleSocialLogin("github")} />
            <div className="text-gray-300 dark:text-white text-xl">|</div>
            <SNSButton icon={getStaticUrl("assets/icons/Google.png")} text="구글" onClick={() => handleSocialLogin("google")} />
        </div>
    );
};

export default SNSButtonGroup;
