// components/Auth/Login/LoginButton.tsx
import React from "react";

interface Props {
    onClick: () => void;
    isActive: boolean;
}

const LoginButton = ({ onClick, isActive }: Props) => {
    return (
        <button
            onClick={onClick}
            disabled={!isActive}
            className={`w-full py-2 rounded text-white text-sm font-medium transition-colors duration-200 ${
                isActive ? "bg-green-600 hover:bg-green-700" : "bg-gray-400"
            }`}
        >
            로그인
        </button>
    );
};

export default LoginButton;
