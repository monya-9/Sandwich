// src/components/Auth/Login/SNSLogin.tsx
import React from "react";
import { SOCIAL_LOGIN_BASE } from "../../../config/apiBase";
import { getStaticUrl } from "../../../config/staticBase";

const SNSLogin: React.FC = () => {
    const handleSocialLogin = (provider: "google" | "github") => {
        // ✅ 소셜 로그인은 직접 백엔드로 이동 (프록시 거치지 않음)
        window.location.href = `${SOCIAL_LOGIN_BASE}/oauth2/authorization/${provider}`;
    };

    return (
        <div className="mt-4">
            <p className="text-sm text-gray-600 dark:text-white">SNS로 간편하게 로그인하기</p>
            <div className="flex justify-center gap-4 mt-5">
                <div className="w-8 h-8 bg-transparent dark:bg-white rounded-full flex items-center justify-center cursor-pointer transition-colors">
                    <img
                        src={getStaticUrl("assets/icons/github.png")}
                        alt="GitHub"
                        className="w-8 h-8 dark:w-6 dark:h-6"
                        onClick={() => handleSocialLogin("github")}
                    />
                </div>
                <img
                    src={getStaticUrl("assets/icons/Google.png")}
                    alt="Google"
                    className="w-8 h-8 cursor-pointer"
                    onClick={() => handleSocialLogin("google")}
                />
            </div>
        </div>
    );
};

export default SNSLogin;
