import React, { useState, useEffect } from "react";
import { checkEmailDuplicate } from "../../../../api/authApi";
import Toast from "../../../common/Toast";

interface EmailInputProps {
    email: string;
    onChange: (val: string) => void;
    onSend: () => void;
    disabled?: boolean;
    sent?: boolean;
    verified?: boolean;
    message?: string;
}

const EmailInput = ({
                        email,
                        onChange,
                        onSend,
                        disabled,
                        sent,
                        verified,
                        message,
                    }: EmailInputProps) => {
    const [isCheckingDuplicate, setIsCheckingDuplicate] = useState(false);
    const [duplicateCheckResult, setDuplicateCheckResult] = useState<{
        isDuplicate: boolean | null;
        message: string;
    }>({ isDuplicate: null, message: "" });
    const [showDuplicateMessage, setShowDuplicateMessage] = useState(false);
    const [canSendEmail, setCanSendEmail] = useState(false);
    const [showToast, setShowToast] = useState(false);

    // 이메일이 변경되면 중복 확인 상태 초기화
    useEffect(() => {
        setCanSendEmail(false);
        setShowDuplicateMessage(false);
        setDuplicateCheckResult({ isDuplicate: null, message: "" });
    }, [email]);

    const handleDuplicateCheck = async () => {
        if (!email || !email.includes('@')) {
            return;
        }

        setIsCheckingDuplicate(true);
        try {
            const result = await checkEmailDuplicate(email);
            setDuplicateCheckResult({
                isDuplicate: result.duplicate,
                message: result.duplicate ? "이미 가입된 이메일입니다. 로그인해주세요." : "사용가능한 이메일입니다."
            });
            setShowDuplicateMessage(true);
            setCanSendEmail(!result.duplicate);
            
            // 5초 후 메시지 숨김
            setTimeout(() => {
                setShowDuplicateMessage(false);
            }, 5000);

            // 토스트 알림 표시
            setShowToast(true);
        } catch (error) {
            console.error('이메일 중복 확인 실패:', error);
            setDuplicateCheckResult({
                isDuplicate: null,
                message: "중복 확인에 실패했습니다. 다시 시도해주세요."
            });
            setShowDuplicateMessage(true);
            setTimeout(() => setShowDuplicateMessage(false), 5000);
        } finally {
            setIsCheckingDuplicate(false);
        }
    };
    return (
        <div className="my-4 w-full max-w-md">
            <label className="block text-left font-medium text-gray-700 mb-1">
                이메일 주소
            </label>
            <div className="flex items-center gap-2">
                <input
                    type="email"
                    value={email}
                    onChange={(e) => onChange(e.target.value)}
                    placeholder="이메일 입력"
                    disabled={disabled}
                    className="input-style border border-gray-300 rounded px-3 py-2 w-full bg-white"
                />
                <button
                    onClick={canSendEmail ? onSend : handleDuplicateCheck}
                    disabled={disabled || isCheckingDuplicate || !email}
                    className={`w-24 h-10 rounded text-white text-sm transition ${
                        disabled || isCheckingDuplicate ? "bg-gray-400" : 
                        "bg-green-600 hover:bg-green-800"
                    }`}
                    style={{ cursor: disabled || isCheckingDuplicate ? "default" : "pointer" }}
                >
                    {isCheckingDuplicate ? "확인중..." : 
                     canSendEmail ? "전송" : 
                     sent ? "재전송" : "중복확인"}
                </button>
            </div>
            {message && (
                <p className="text-sm mt-1 ml-1 text-left text-green-600">{message}</p>
            )}
            {showDuplicateMessage && duplicateCheckResult.message && (
                <p className={`text-sm mt-1 ml-1 text-left ${
                    duplicateCheckResult.isDuplicate ? "text-red-600" : "text-green-600"
                }`}>
                    {duplicateCheckResult.message}
                </p>
            )}
            
            <Toast
                message="중복확인 완료"
                type="success"
                size="small"
                visible={showToast}
                onClose={() => setShowToast(false)}
                autoClose={2000}
            />
        </div>
    );
};

export default EmailInput;
