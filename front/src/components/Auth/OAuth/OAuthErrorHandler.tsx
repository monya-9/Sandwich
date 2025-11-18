// components/Auth/OAuth/OAuthErrorHandler.tsx
import React, { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { AlertTriangle, Home, LogIn } from "lucide-react";

const OAuthErrorHandler = () => {
    const navigate = useNavigate();
    const [params] = useSearchParams();
    const [errorMessage, setErrorMessage] = useState<string>("");

    useEffect(() => {
        // URL 파라미터에서 에러 메시지 추출
        const provider = params.get("provider");
        const message = params.get("message");
        const error = params.get("error");

        // lastLoginMethod 저장
        if (provider && !provider.includes("이미") && !provider.includes("가입")) {
            localStorage.setItem("lastLoginMethod", provider);
        }

        // 에러 메시지 설정
        if (provider) {
            setErrorMessage(decodeURIComponent(provider));
        } else if (message) {
            setErrorMessage(decodeURIComponent(message));
        } else if (error) {
            setErrorMessage(decodeURIComponent(error));
        } else {
            setErrorMessage("소셜 로그인 중 오류가 발생했습니다.");
        }
    }, [params]);

    // 에러 메시지에 따른 안내 문구
    const getHelpText = (errorMsg: string): string => {
        if (errorMsg.includes("이미") && errorMsg.includes("가입")) {
            return "다른 로그인 방법으로 가입된 계정이 있습니다.\n기존 로그인 방법을 사용해주세요.";
        }
        if (errorMsg.includes("취소")) {
            return "로그인이 취소되었습니다.\n다시 시도해주세요.";
        }
        if (errorMsg.includes("서버") || errorMsg.includes("INTERNAL")) {
            return "서버 오류가 발생했습니다.\n잠시 후 다시 시도해주세요.";
        }
        return "로그인 중 문제가 발생했습니다.\n다시 시도해주세요.";
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-black flex items-center justify-center p-4">
            <div className="max-w-md w-full">
                {/* 에러 카드 */}
                <div className="bg-white dark:bg-neutral-900 rounded-2xl shadow-xl p-6 sm:p-8 border border-gray-200 dark:border-neutral-800">
                    {/* 에러 아이콘 */}
                    <div className="flex justify-center mb-4 sm:mb-6">
                        <AlertTriangle className="w-14 h-14 sm:w-16 sm:h-16 text-orange-500 dark:text-orange-400" />
                    </div>

                    {/* 제목 */}
                    <h1 className="text-xl sm:text-2xl font-bold text-center text-gray-900 dark:text-white mb-3">
                        로그인 실패
                    </h1>

                    {/* 에러 메시지 */}
                    <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3 sm:p-4 mb-3 sm:mb-4">
                        <p className="text-xs sm:text-sm text-red-800 dark:text-red-200 text-center font-medium break-words">
                            {errorMessage}
                        </p>
                    </div>

                    {/* 도움말 텍스트 */}
                    <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 text-center mb-4 sm:mb-6 whitespace-pre-line">
                        {getHelpText(errorMessage)}
                    </p>

                    {/* 버튼들 */}
                    <div className="space-y-2 sm:space-y-3">
                        {/* 다시 로그인 시도 */}
                        <button
                            onClick={() => navigate("/login")}
                            className="w-full flex items-center justify-center gap-2 px-4 sm:px-6 py-2.5 sm:py-3 bg-green-600 hover:bg-green-700 text-white text-sm sm:text-base rounded-lg font-medium transition-colors"
                        >
                            <LogIn className="w-4 h-4 sm:w-5 sm:h-5" />
                            다시 로그인하기
                        </button>

                        {/* 메인으로 */}
                        <button
                            onClick={() => navigate("/")}
                            className="w-full flex items-center justify-center gap-2 px-4 sm:px-6 py-2.5 sm:py-3 bg-gray-100 dark:bg-neutral-800 hover:bg-gray-200 dark:hover:bg-neutral-700 text-gray-900 dark:text-white text-sm sm:text-base rounded-lg font-medium transition-colors"
                        >
                            <Home className="w-4 h-4 sm:w-5 sm:h-5" />
                            메인으로 돌아가기
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default OAuthErrorHandler;
