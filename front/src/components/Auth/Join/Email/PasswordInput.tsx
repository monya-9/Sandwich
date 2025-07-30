import React, { useState } from "react";
import { Eye, EyeOff } from "lucide-react";

interface Props {
    password: string;
    passwordConfirm: string;
    onPasswordChange: (value: string) => void;
    onConfirmChange: (value: string) => void;
}

const PasswordInput = ({ password, passwordConfirm, onPasswordChange, onConfirmChange }: Props) => {
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);

    const hasLength = password.length >= 8 && password.length <= 20;
    const hasLetter = /[A-Za-z]/.test(password);
    const hasSpecial = /[!@#$%^&*()\-_=+]/.test(password);
    const isPasswordValid = hasLength && hasLetter && hasSpecial;

    const isPasswordMatched = password === passwordConfirm && passwordConfirm !== "";
    const showHints = password.length > 0;

    return (
        <div className="w-full max-w-sm mt-6 space-y-4">
            {/* 비밀번호 입력 */}
            <div>
                <label className="block text-left font-medium text-gray-700 mb-1">비밀번호</label>
                <div className="relative">
                    <input
                        type={showPassword ? "text" : "password"}
                        value={password}
                        onChange={(e) => onPasswordChange(e.target.value)}
                        placeholder=""
                        className={`w-full px-4 py-2 border rounded text-black placeholder-gray-400 focus:outline-none focus:ring-2
                            ${showHints
                            ? isPasswordValid
                                ? "border-green-500 ring-green-200"
                                : "border-red-500 ring-red-200"
                            : "border-gray-300"
                        }`}
                    />
                    <button
                        type="button"
                        onClick={() => setShowPassword((prev) => !prev)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500"
                    >
                        {showPassword ? <Eye /> : <EyeOff />}
                    </button>
                </div>
                {showHints && (
                    <div className="text-sm mt-1 min-h-[40px] text-left ml-1 space-y-1">
                        <p className={hasLength ? "text-green-600" : "text-gray-500"}>
                            ✔ 최소 8자리 ~ 최대 20자리
                        </p>
                        <p className={hasLetter && hasSpecial ? "text-green-600" : "text-gray-500"}>
                            ✔ 특수문자 1개, 영어 1개 이상 포함
                        </p>
                    </div>
                )}
            </div>

            {/* 비밀번호 확인 */}
            <div>
                <label className="block text-left font-medium text-gray-700 mb-1">비밀번호 확인</label>
                <div className="relative">
                    <input
                        type={showConfirm ? "text" : "password"}
                        value={passwordConfirm}
                        onChange={(e) => onConfirmChange(e.target.value)}
                        placeholder="비밀번호 재입력"
                        className={`w-full px-4 py-2 border rounded text-black placeholder-gray-400 focus:outline-none focus:ring-2
                            ${passwordConfirm
                            ? isPasswordMatched
                                ? "border-green-500 ring-green-200"
                                : "border-red-500 ring-red-200"
                            : "border-gray-300"
                        }`}
                    />
                    <button
                        type="button"
                        onClick={() => setShowConfirm((prev) => !prev)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500"
                    >
                        {showConfirm ? <Eye /> : <EyeOff />}
                    </button>
                </div>
                <div className="text-sm mt-1 min-h-[20px] text-left ml-1">
                    {passwordConfirm && isPasswordMatched && (
                        <p className="text-green-600">✔ 비밀번호가 일치합니다.</p>
                    )}
                    {passwordConfirm && !isPasswordMatched && (
                        <p className="text-red-500">❌ 비밀번호가 일치하지 않습니다.</p>
                    )}
                </div>
            </div>
        </div>
    );
};

export default PasswordInput;
