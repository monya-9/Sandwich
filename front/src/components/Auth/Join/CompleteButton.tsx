// src/components/Auth/Join/CompleteButton.tsx

interface CompleteButtonProps {
    onComplete: () => void;
    onPrev?: () => void;
    completeDisabled: boolean;
    className?: string;
}

const CompleteButton = ({ onComplete, onPrev, completeDisabled, className = "" }: CompleteButtonProps) => {
    return (
        <div className={`flex justify-center gap-2 pb-[20px] ${className}`}>
            {onPrev && (
                <button
                    onClick={onPrev}
                    className="px-6 py-2 bg-gray-200 rounded text-black"
                >
                    이전
                </button>
            )}
            <button
                onClick={onComplete}
                disabled={completeDisabled}
                className={`px-6 py-2 rounded text-white ${
                    completeDisabled ? "bg-gray-400" : "bg-[#168944] hover:bg-green-700"
                }`}
            >
                완료
            </button>
        </div>
    );
};


export default CompleteButton;
