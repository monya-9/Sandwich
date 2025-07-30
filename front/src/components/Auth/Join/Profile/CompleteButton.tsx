interface Props {
    disabled: boolean;
}

const CompleteButton = ({ disabled }: Props) => {
    return (
        <button
            className={`mt-8 w-full py-2 rounded text-white text-lg font-medium ${
                disabled ? "bg-gray-400 cursor-not-allowed" : "bg-[#168944] hover:bg-green-700"
            }`}
            disabled={disabled}
        >
            회원가입 완료
        </button>
    );
};

export default CompleteButton;
