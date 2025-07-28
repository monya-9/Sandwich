import React from "react";

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
                    onClick={onSend}
                    disabled={disabled}
                    className={`w-24 h-10 rounded text-white text-sm transition ${
                        disabled ? "bg-gray-400" : "bg-gray-600 hover:bg-gray-800"
                    }`}
                    style={{ cursor: disabled ? "default" : "pointer" }}
                >
                    {sent ? "재전송" : "전송"}
                </button>
            </div>
            {message && (
                <p className="text-sm mt-1 ml-1 text-left text-green-600">{message}</p>
            )}
        </div>
    );
};

export default EmailInput;
