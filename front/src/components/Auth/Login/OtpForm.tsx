// src/components/Auth/Login/OtpForm.tsx
import React, { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import { getStaticUrl } from "../../../config/staticBase";
import api from "../../../api/axiosInstance";
import Toast from "../../common/Toast";

interface Props {
    pendingId: string;
    maskedEmail: string;
    onSuccess: (accessToken: string, refreshToken: string) => void;
    onBack: () => void;
}

const OtpForm = ({ pendingId, maskedEmail, onSuccess, onBack }: Props) => {
    const [otpCode, setOtpCode] = useState("");
    const [rememberDevice, setRememberDevice] = useState(true);
    const [error, setError] = useState("");
    const [isVerifying, setIsVerifying] = useState(false);
    const [isResending, setIsResending] = useState(false);
    
    // 🆕 타이머 관련 상태 (5분 = 300초)
    const [timeLeft, setTimeLeft] = useState(300);
    const [isExpired, setIsExpired] = useState(false);
    
    // 🆕 토스트 관련 상태
    const [toast, setToast] = useState<{
        visible: boolean;
        message: string;
        type: "success" | "error" | "info";
    }>({ visible: false, message: "", type: "success" });

    // 🆕 타이머 카운트다운
    useEffect(() => {
        if (timeLeft <= 0) {
            setIsExpired(true);
            return;
        }

        const timer = setInterval(() => {
            setTimeLeft(prev => {
                if (prev <= 1) {
                    setIsExpired(true);
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        return () => clearInterval(timer);
    }, [timeLeft]);

    // 🆕 시간 포맷팅 함수 (예: "4:23")
    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, "0")}`;
    };

    // 🆕 토스트 헬퍼 함수들
    const showToast = (message: string, type: "success" | "error" | "info" = "success") => {
        setToast({ visible: true, message, type });
    };

    const hideToast = useCallback(() => {
        setToast(prev => ({ ...prev, visible: false }));
    }, []);

    const handleOtpVerify = async () => {
        if (isExpired) {
            setError("인증코드가 만료되었습니다. 코드를 재전송해주세요.");
            return;
        }

        if (otpCode.length !== 6) {
            setError("6자리 인증코드를 입력해주세요.");
            return;
        }

        setIsVerifying(true);
        setError("");

        try {
            const res = await api.post("/auth/otp/verify", {
                pendingId,
                code: otpCode.trim(),
                rememberDevice,
                deviceName: "Web Browser"
            });

            const { accessToken, refreshToken } = res.data;
            showToast("✅ 인증이 완료되었습니다!", "success");
            
            // 약간의 딜레이 후 성공 콜백 호출 (토스트를 보여주기 위함)
            setTimeout(() => {
                onSuccess(accessToken, refreshToken);
            }, 1000);
        } catch (err: any) {
            const errorType = err.response?.data?.error;
            switch (errorType) {
                case "INVALID_CODE":
                    setError("인증코드가 올바르지 않습니다.");
                    break;
                case "EXPIRED":
                    setError("인증코드가 만료되었습니다. 다시 시도해주세요.");
                    break;
                case "LOCKED":
                    setError("너무 많은 시도로 인해 잠겼습니다. 10분 후 다시 시도해주세요.");
                    break;
                default:
                    setError("인증에 실패했습니다. 다시 시도해주세요.");
            }
        } finally {
            setIsVerifying(false);
        }
    };

    const handleResend = async () => {
        setIsResending(true);
        setError("");

        try {
            await api.post("/auth/otp/resend", { pendingId });
            
            // 🆕 재전송 성공 시 타이머 리셋
            setTimeLeft(300);
            setIsExpired(false);
            setOtpCode(""); // 입력된 코드도 초기화
            
            setError(""); // 성공 시 에러 초기화
            showToast("📧 새로운 인증코드가 전송되었습니다!", "success");
        } catch (err: any) {
            const errorType = err.response?.data?.error;
            switch (errorType) {
                case "COOLDOWN":
                    setError("재전송은 60초에 한 번만 가능합니다.");
                    break;
                case "DAILY_LIMIT":
                    setError("일일 재전송 횟수를 초과했습니다.");
                    break;
                case "EXPIRED":
                    setError("세션이 만료되었습니다. 다시 로그인해주세요.");
                    onBack();
                    break;
                default:
                    setError("재전송에 실패했습니다.");
            }
        } finally {
            setIsResending(false);
        }
    };

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === "Enter" && otpCode.length === 6 && !isVerifying) {
            handleOtpVerify();
        }
    };

    const handleOtpChange = (value: string) => {
        // 숫자만 허용, 최대 6자리
        const numericValue = value.replace(/[^0-9]/g, "").slice(0, 6);
        setOtpCode(numericValue);
        if (error) setError(""); // 입력 시 에러 초기화
    };

    return (
        <div className="flex flex-col items-center justify-center min-h-screen px-4 text-center bg-white dark:bg-black">
            <Link to="/">
                <img src={getStaticUrl("assets/logo.png")} alt="logo" className="w-36 mb-10 mx-auto" />
            </Link>

            <div className="w-full max-w-sm">
                <h2 className="text-xl font-bold mb-2 text-gray-900 dark:text-white">이메일 인증</h2>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                    <span className="font-medium">{maskedEmail}</span>로<br />
                    인증코드를 보내드렸습니다.
                </p>
                
                {/* 🆕 강조된 타이머 표시 */}
                <div className="mb-6">
                    {isExpired ? (
                        <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-center">
                            <p className="text-red-700 font-semibold text-sm">
                                ⏰ 인증시간이 만료되었습니다
                            </p>
                            <p className="text-red-600 text-xs mt-1">
                                새 코드를 받아주세요
                            </p>
                        </div>
                    ) : (
                        <div className={`border rounded-lg p-3 text-center transition-all duration-300 ${
                            timeLeft <= 60 
                                ? 'bg-red-50 border-red-200 animate-pulse' 
                                : timeLeft <= 120
                                ? 'bg-yellow-50 border-yellow-200'
                                : 'bg-blue-50 border-blue-200'
                        }`}>
                            <p className={`font-semibold text-sm ${
                                timeLeft <= 60 
                                    ? 'text-red-700' 
                                    : timeLeft <= 120
                                    ? 'text-yellow-700'
                                    : 'text-blue-700'
                            }`}>
                                ⏰ 남은시간
                            </p>
                            <p className={`font-mono text-2xl font-bold mt-1 ${
                                timeLeft <= 60 
                                    ? 'text-red-600' 
                                    : timeLeft <= 120
                                    ? 'text-yellow-600'
                                    : 'text-blue-600'
                            }`}>
                                {formatTime(timeLeft)}
                            </p>
                        </div>
                    )}
                </div>

                {/* OTP 입력 필드 */}
                <div className="mb-4">
                    <input
                        type="text"
                        value={otpCode}
                        onChange={(e) => handleOtpChange(e.target.value)}
                        onKeyPress={handleKeyPress}
                        placeholder="6자리 인증코드"
                        className="w-full px-4 py-3 text-center text-lg tracking-widest border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:border-green-500 bg-white dark:bg-gray-800 text-black dark:text-white"
                        maxLength={6}
                        autoComplete="off"
                    />
                </div>

                {/* "이 브라우저 기억하기" 체크박스 */}
                <div className="flex items-center mb-4">
                    <input
                        type="checkbox"
                        id="rememberDevice"
                        checked={rememberDevice}
                        onChange={(e) => setRememberDevice(e.target.checked)}
                        className="mr-2"
                    />
                    <label htmlFor="rememberDevice" className="text-sm text-gray-700 dark:text-gray-300">
                        이 브라우저 기억하기 (30일)
                    </label>
                </div>

                {/* 에러 메시지 */}
                {error && (
                    <p className="text-sm text-red-600 mb-4 text-center">{error}</p>
                )}

                {/* 인증하기 버튼 */}
                <button
                    onClick={handleOtpVerify}
                    disabled={otpCode.length !== 6 || isVerifying || isExpired}
                    className={`w-full py-3 rounded-lg font-medium transition ${
                        otpCode.length === 6 && !isVerifying && !isExpired
                            ? "bg-green-600 text-white hover:bg-green-700"
                            : "bg-gray-300 text-gray-500 cursor-not-allowed"
                    }`}
                >
                    {isExpired ? "코드 만료됨" : isVerifying ? "인증 중..." : "인증하기"}
                </button>

                {/* 재전송 및 뒤로가기 */}
                <div className="flex justify-center items-center text-sm text-gray-500 dark:text-gray-400 gap-2 mt-4">
                    <button
                        onClick={handleResend}
                        disabled={isResending}
                        className={`hover:text-green-600 hover:underline disabled:text-gray-400 dark:disabled:text-gray-600 ${
                            isExpired ? "text-green-600 font-medium" : ""
                        }`}
                    >
                        {isResending ? "재전송 중..." : isExpired ? "새 코드 받기" : "코드 재전송"}
                    </button>
                    <span>|</span>
                    <button
                        onClick={onBack}
                        className="hover:text-green-600 hover:underline"
                    >
                        뒤로가기
                    </button>
                </div>
            </div>

            {/* 🆕 토스트 컴포넌트 */}
            <Toast
                message={toast.message}
                type={toast.type}
                visible={toast.visible}
                onClose={hideToast}
                autoClose={3000}
            />
        </div>
    );
};

export default OtpForm;
