// components/Auth/RecentLogin.tsx
import React, { useEffect, useState } from "react";

const RecentLogin = () => {
    const [lastLogin, setLastLogin] = useState<string | null>(null);

    useEffect(() => {
        const method = localStorage.getItem("lastLoginMethod");
        if (method) {
            setLastLogin(method);
        }
    }, []);

    if (!lastLogin) return null;

    const providerName =
        lastLogin === "google" ? "Google" :
            lastLogin === "github" ? "GitHub" :
                lastLogin === "local" ? "이메일" :
                    lastLogin;

    return (
        <p className="text-sm text-gray-500 mt-2">
            최근 로그인: <span className="font-medium text-green-700">{providerName}</span>
        </p>
    );
};

export default RecentLogin;
