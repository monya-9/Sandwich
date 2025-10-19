// components/Auth/Intro/SNSButtonGroup.tsx
import React from "react";
import githubIcon from "../../../../assets/icons/github.png";
import googleIcon from "../../../../assets/icons/Google.png";
import SNSButton from "./SNSButton";

const SNSButtonGroup = () => {
    const API_BASE = process.env.REACT_APP_API_BASE || "http://localhost:8080";
    const handleSocialLogin = (provider: "google" | "github") => {
        // ✅ React 내부 경로로 먼저 이동 → 흰 화면 유지
        window.location.href = `${API_BASE}/oauth2/authorization/${provider}`;
    };

    return (
        <div className="flex justify-center items-center gap-4">
            <SNSButton icon={githubIcon} text="깃허브" onClick={() => handleSocialLogin("github")} />
            <div className="text-gray-300 text-xl">|</div>
            <SNSButton icon={googleIcon} text="구글" onClick={() => handleSocialLogin("google")} />
        </div>
    );
};

export default SNSButtonGroup;
