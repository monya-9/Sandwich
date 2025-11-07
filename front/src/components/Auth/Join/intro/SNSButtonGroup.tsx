// components/Auth/Intro/SNSButtonGroup.tsx
import React, { useState } from "react";
import { getStaticUrl } from "../../../../config/staticBase";
import SNSButton from "./SNSButton";

const SNSButtonGroup = () => {
    const API_BASE = process.env.REACT_APP_API_BASE;
    const [rememberDevice, setRememberDevice] = useState(true);

    const handleSocialLogin = (provider: "google" | "github") => {
        // ✅ 체크박스 상태에 따라 remember 파라미터 전달 (SNSLogin과 동일)
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
        <div className="flex flex-col items-center gap-4">
            <div className="flex justify-center items-center gap-4">
                <SNSButton icon={getStaticUrl("assets/icons/github.png")} text="깃허브" onClick={() => handleSocialLogin("github")} />
                <div className="text-gray-300 dark:text-white text-xl">|</div>
                <SNSButton icon={getStaticUrl("assets/icons/Google.png")} text="구글" onClick={() => handleSocialLogin("google")} />
            </div>
            
            {/* 디바이스 기억 체크박스 (SNSLogin과 동일) */}
            <div className="flex items-center">
                <input
                    type="checkbox"
                    id="rememberDeviceJoin"
                    checked={rememberDevice}
                    onChange={(e) => setRememberDevice(e.target.checked)}
                    className="mr-2"
                />
                <label htmlFor="rememberDeviceJoin" className="text-sm text-gray-700 dark:text-gray-300">
                    이 브라우저 기억하기 (30일)
                </label>
            </div>
        </div>
    );
};

export default SNSButtonGroup;

