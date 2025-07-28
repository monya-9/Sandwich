// components/Auth/Intro/SNSButton.tsx
import React from "react";

interface SNSButtonProps {
    icon: string;
    text: string;
    onClick: () => void;
}

const SNSButton = ({ icon, text, onClick }: SNSButtonProps) => {
    return (
        <button
            onClick={onClick}
            className="flex items-center justify-center gap-2 px-5 py-2 rounded-md transition-all hover:bg-gray-100"
        >
            <img
                src={icon}
                alt={`${text} 아이콘`}
                className="w-7 h-7 object-contain"
            />
            <span className="text-base font-medium text-gray-800">{text}</span>
        </button>
    );
};

export default SNSButton;
