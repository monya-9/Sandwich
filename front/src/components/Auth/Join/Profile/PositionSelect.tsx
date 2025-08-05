const positions = [
    "프론트엔드",
    "백엔드",
    "풀스택",
    "모바일 앱",
    "게임",
    "AI/머신러닝",
    "데이터 엔지니어링",
    "임베디드/IOT",
    "DevOps/인프라",
    "웹",
    "시스템 프로그래밍",
    "블록체인",
    "보안/해킹"
];

interface Props {
    selected: string;
    onChange: (val: string) => void;
}

const PositionSelect = ({ selected, onChange }: Props) => {
    return (
        <div className="text-left w-full flex flex-col items-center">
            <p className="font-medium text-gray-700 mb-2 w-full max-w-md">포지션</p>

            <div className="grid grid-cols-2 gap-x-6 gap-y-2 w-full max-w-md">
                {positions.map((item) => (
                    <label
                        key={item}
                        className="flex items-start gap-2 cursor-pointer"
                    >
                        <input
                            type="radio"
                            name="position"
                            value={item}
                            checked={selected === item}
                            onChange={() => onChange(item)}
                            className="mt-0.5 accent-green-600"
                        />
                        <span className="text-sm text-gray-800 leading-5">{item}</span>
                    </label>
                ))}
            </div>
        </div>
    );
};

export default PositionSelect;
