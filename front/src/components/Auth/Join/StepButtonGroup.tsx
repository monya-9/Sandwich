interface StepButtonGroupProps {
    onNext: () => void;
    onPrev?: () => void;
    nextDisabled: boolean;
    className?: string;
}

const StepButtonGroup = ({ onNext, onPrev, nextDisabled, className = "" }: StepButtonGroupProps) => {
    return (
        <div className={`flex justify-center gap-2 pb-[20px] ${className}`}>
            <button
                onClick={onPrev}
                className="px-6 py-2 bg-gray-200 rounded text-black"
                disabled={!onPrev} // onPrev 없으면 비활성화
            >
                이전
            </button>
            <button
                onClick={onNext}
                disabled={nextDisabled}
                className={`px-6 py-2 rounded text-white ${
                    nextDisabled ? "bg-gray-400" : "bg-[#168944] hover:bg-green-700"
                }`}
            >
                다음
            </button>
        </div>
    );
};

export default StepButtonGroup;
