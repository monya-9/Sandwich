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
            <p className="text-sm text-gray-600">SNS로 간편하게 로그인하기</p>
            <div className="flex justify-center gap-4 mt-5">
                <img
                    src={githubIcon}
                    alt="GitHub"
                    className="w-8 h-8 cursor-pointer"
                    onClick={() => handleSocialLogin("github")}
                />
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
