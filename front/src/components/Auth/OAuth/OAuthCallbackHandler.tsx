// components/Auth/OAuth/OAuthCallbackHandler.tsx
import React, { useEffect } from "react";
import { useParams, useSearchParams, useNavigate } from "react-router-dom";

/**
 * Spring Security OAuth2 기본 콜백 URL 처리
 * /login/oauth2/code/{provider}?code=...&state=...
 * 
 * 이 경로는 OAuth2 필터가 처리하는 중간 단계로,
 * 백엔드에서 최종적으로 /oauth2/success로 리다이렉트하지만,
 * 프론트엔드 라우팅에 없어서 404가 발생할 수 있습니다.
 * 
 * 이 컴포넌트는 잠시 대기하거나 백엔드 처리를 기다립니다.
 */
const OAuthCallbackHandler: React.FC = () => {
    const { provider } = useParams<{ provider: string }>();
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();

    useEffect(() => {
        const code = searchParams.get("code");

        if (!code || !provider) {
            console.warn("[OAuthCallback] code 또는 provider가 없습니다.", { code, provider });
            navigate("/login");
            return;
        }

        // 백엔드가 자동으로 /oauth2/success로 리다이렉트할 때까지 대기
        // 만약 일정 시간 내에 리다이렉트되지 않으면 로그인 페이지로 이동
        const timeout = setTimeout(() => {
            console.warn("[OAuthCallback] 백엔드 리다이렉트 대기 시간 초과");
            navigate("/login");
        }, 5000);

        return () => clearTimeout(timeout);
    }, [provider, searchParams, navigate]);

    return (
        <div className="flex justify-center items-center min-h-screen bg-white dark:bg-black">
            <div className="text-center text-green-600 dark:text-green-400">
                <p>{provider === "github" ? "GitHub" : provider === "google" ? "Google" : provider} 로그인 처리 중...</p>
            </div>
        </div>
    );
};

export default OAuthCallbackHandler;

