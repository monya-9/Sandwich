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
            className="flex items-center justify-center gap-2 px-5 py-2 rounded-md transition-all"
        >
            <div className="w-7 h-7 bg-transparent dark:bg-white rounded-full flex items-center justify-center">
                <img
                    src={icon}
                    alt={`${text} 아이콘`}
                    className="w-7 h-7 dark:w-5 dark:h-5 object-contain"
                />
            </div>
            <span className="text-base font-medium text-gray-800 dark:text-white">{text}</span>
        </button>
    );
};

export default SNSButton;
