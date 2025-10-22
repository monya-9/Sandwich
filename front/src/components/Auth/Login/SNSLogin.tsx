// src/components/Auth/Login/SNSLogin.tsx
import React from "react";
import githubIcon from "../../../assets/icons/github.png";
import googleIcon from "../../../assets/icons/Google.png";

const SNSLogin: React.FC = () => {
    const API_BASE = process.env.REACT_APP_API_BASE;
    const handleSocialLogin = (provider: "google" | "github") => {
        // ✅ 바로 백엔드 OAuth2 엔드포인트로 이동
        window.location.href = `${API_BASE}/oauth2/authorization/${provider}`;
    };

    return (
        <div className="mt-4">
            <p className="text-sm text-gray-600 dark:text-white">SNS로 간편하게 로그인하기</p>
            <div className="flex justify-center gap-4 mt-5">
                <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                    <img
                        src={githubIcon}
                        alt="GitHub"
                        className="w-6 h-6"
                        onClick={() => handleSocialLogin("github")}
                    />
                </div>
                <img
                    src={googleIcon}
                    alt="Google"
                    className="w-8 h-8 cursor-pointer"
                    onClick={() => handleSocialLogin("google")}
                />
            </div>
        </div>
    );
};

export default SNSLogin;
