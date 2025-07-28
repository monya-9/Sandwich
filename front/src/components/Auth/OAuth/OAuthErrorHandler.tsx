// components/Auth/OAuth/OAuthErrorHandler.tsx
import React, { useEffect } from "react";
import { useSearchParams } from "react-router-dom";

const OAuthErrorHandler = () => {
    const [params] = useSearchParams();
    const provider = params.get("provider");
    const message = params.get("message") || "소셜 로그인에 실패했습니다.";

    useEffect(() => {
        if (provider) {
            localStorage.setItem("lastLoginMethod", provider);
        }
    }, [provider]);

    return (
        <div className="flex justify-center items-center min-h-screen">
            <div className="text-center text-red-600 text-xl font-semibold">
                <p>{decodeURIComponent(message)}</p>
                <p className="mt-2">다시 시도해주세요.</p>
            </div>
        </div>
    );
};

export default OAuthErrorHandler;
