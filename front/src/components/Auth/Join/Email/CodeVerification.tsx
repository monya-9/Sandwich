import React, { useEffect, useState } from "react";

interface Props {
    code: string;
    setCode: (val: string) => void;
    onVerify: () => void;
    disabled?: boolean;
    readOnly?: boolean;
    status?: "default" | "success" | "error" | "timeout";
    timeDisplay?: string;
    showSuccessMessage?: boolean;
}

const CodeVerification = ({
                              code,
                              setCode,
                              onVerify,
                              disabled,
                              readOnly,
                              status = "default",
                              timeDisplay,
                              showSuccessMessage = false,
                          }: Props) => {
    const isVerified = status === "success";

    // ✅ 인증 성공 시 초록 테두리 & 메시지
    const [showSuccessStyle, setShowSuccessStyle] = useState(false);
    const [showMessage, setShowMessage] = useState(false);

    useEffect(() => {
        if (isVerified && showSuccessMessage) {
            setShowSuccessStyle(true);
            setShowMessage(true);

            const timer = setTimeout(() => {
                setShowSuccessStyle(false); // ✅ 초록 테두리 제거
                setShowMessage(false); // ✅ 메시지 제거
            }, 10000);

            return () => clearTimeout(timer);
        }
    }, [isVerified, showSuccessMessage]);

    const getInputBorderClass = () => {
        if (status === "success") {
            return showSuccessStyle
                ? "border-green-500 focus:ring-green-500"
                : "border-gray-300 focus:ring-gray-300"; // 복귀 색상
        }
        if (status === "error" || status === "timeout") {
            return "border-red-500 focus:ring-red-500";
        }
        return "border-gray-300 focus:ring-gray-300";
    };

    const getTextColor = () => {
        if (status === "success") {
            return showSuccessStyle ? "text-green-600" : "text-gray-900";
        }
        return "text-gray-900";
    };

    const isButtonDisabled =
        disabled || code.length !== 6 || (status === "timeout" && !isVerified);

    return (
        <div className="my-4 w-full max-w-md">
            <label className="block text-left font-medium text-gray-700 mb-1">
                인증번호 입력
            </label>
            <div className="flex items-center gap-2">
                <div className="relative w-full">
                    <input
                        type="text"
                        value={code}
                        onChange={(e) => setCode(e.target.value)}
                        maxLength={6}
                        readOnly={readOnly}
                        disabled={disabled}
                        placeholder="인증번호"
                        className={`input-style border rounded px-3 py-2 w-full pr-16 bg-white 
                            ${getInputBorderClass()} 
                            ${getTextColor()} 
                            ${readOnly || disabled ? "cursor-default" : ""}`}
                    />
                    {!isVerified && timeDisplay && (
                        <div className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-red-500 font-normal">
                            ⏳ {status === "timeout" ? "만료" : timeDisplay}
                        </div>
                    )}
                </div>

                <button
                    onClick={onVerify}
                    disabled={isButtonDisabled}
                    className={`w-24 h-10 rounded text-white text-sm transition ${
                        isButtonDisabled
                            ? "bg-gray-400"
                            : "bg-gray-600 hover:bg-gray-800"
                    }`}
                    style={{
                        cursor: isButtonDisabled ? "default" : "pointer",
                    }}
                >
                    인증완료
                </button>
            </div>

            {/* 메시지 */}
            {status === "error" && (
                <p className="text-red-500 text-sm mt-1 ml-1 text-left">
                    ❌ 인증번호가 올바르지 않습니다.
                </p>
            )}
            {status === "timeout" && !isVerified && (
                <p className="text-red-500 text-sm mt-1 ml-1 text-left">
                    ⏳ 인증 시간이 만료되었습니다. 다시 인증번호를 요청해주세요.
                </p>
            )}
            {isVerified && showSuccessMessage && showMessage && (
                <p className="text-green-600 text-sm mt-1 ml-1 text-left">
                    ✔ 인증이 완료되었습니다.
                </p>
            )}
        </div>
    );
};

export default CodeVerification;
