// src/components/Auth/Login/SNSLogin.tsx
import React, { useState } from "react";
import { getStaticUrl } from "../../../config/staticBase";

const SNSLogin: React.FC = () => {
    const API_BASE = process.env.REACT_APP_API_BASE;
    const [rememberDevice, setRememberDevice] = useState(true);

    const handleSocialLogin = (provider: "google" | "github") => {
        // ✅ 디바이스 기억 옵션과 함께 백엔드 OAuth2 엔드포인트로 이동
        const params = new URLSearchParams();
        if (rememberDevice) {
            params.append("remember", "1");
            params.append("deviceName", "Web Browser");
        }
        const queryString = params.toString();
        const url = `${API_BASE}/oauth2/authorization/${provider}${queryString ? `?${queryString}` : ''}`;
        window.location.href = url;
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
            
            {/* 디바이스 기억 체크박스 */}
            <div className="flex items-center justify-center mt-4">
                <input
                    type="checkbox"
                    id="rememberDeviceSocial"
                    checked={rememberDevice}
                    onChange={(e) => setRememberDevice(e.target.checked)}
                    className="mr-2"
                />
                <label htmlFor="rememberDeviceSocial" className="text-sm text-gray-700 dark:text-gray-300">
                    이 브라우저 기억하기 (30일)
                </label>
            </div>
        </div>
    );
};

export default SNSLogin;

