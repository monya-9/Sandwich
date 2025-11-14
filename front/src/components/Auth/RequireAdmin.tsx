import React, { useEffect, useState } from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { isAdmin } from "../../utils/authz";

// ✅ httpOnly 쿠키 기반: 서버 API로 권한 확인

export default function RequireAdmin({ children }: { children?: React.ReactNode }) {
    const location = useLocation();
    const [checking, setChecking] = useState(true);
    const [ok, setOk] = useState(false);

    useEffect(() => {
        isAdmin().then((result) => {
            setOk(result);
            setChecking(false);
        });
    }, []);

    // 권한 확인 중이면 로딩 표시
    if (checking) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-gray-500">권한 확인 중...</div>
            </div>
        );
    }

    // 권한 없으면 메인 페이지로 리다이렉트
    if (!ok) {
        return <Navigate to="/" replace state={{ from: location }} />;
    }

    return children ? <>{children}</> : <Outlet />;
}


