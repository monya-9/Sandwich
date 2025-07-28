const interestsList = [
    "자료구조 & 알고리즘",
    "운영체제",
    "테스트 코드 작성 (TDD)",
    "디자인 패턴",
    "소프트웨어 아키텍처",
    "네트워크",
    "클린 코드",
    "CI / CD",
    "API 설계",
    "운영환경",
    "DB모델링/정규화",
];

interface Props {
    selected: string[];
    onChange: (val: string[]) => void;
}

const InterestSelect = ({ selected, onChange }: Props) => {
    const toggle = (item: string) => {
        const newList = selected.includes(item)
            ? selected.filter((i) => i !== item)
            : selected.length < 3
                ? [...selected, item]
                : selected;
        onChange(newList);
    };

    return (
        <div className="text-left w-full flex flex-col items-center">
            <p className="font-medium text-gray-700 mb-2 w-full max-w-md">
                관심 분야(최대 3개 선택)
            </p>
            <div className="grid grid-cols-2 gap-x-6 gap-y-2 w-full max-w-md">
                {interestsList.map((item) => (
                    <label
                        key={item}
                        className="flex items-start gap-2 cursor-pointer"
                    >
                        <input
                            type="checkbox"
                            checked={selected.includes(item)}
                            onChange={() => toggle(item)}
                            className="mt-0.5 accent-green-600"
                        />
                        <span className="text-sm text-gray-900 leading-5">{item}</span>
                    </label>
                ))}
            </div>
        </div>
    );
};

export default InterestSelect;
