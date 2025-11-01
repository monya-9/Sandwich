import React, { useEffect, useState } from "react";
import axios from "axios";

interface Props {
    value: string;
    onChange: (val: string) => void;
}

const NameInput = ({ value, onChange }: Props) => {
    const [isDuplicate, setIsDuplicate] = useState<boolean | null>(null);
    const [checking, setChecking] = useState(false);

    useEffect(() => {
        if (!value.trim()) {
            setIsDuplicate(null);
            return;
        }

        const delayDebounce = setTimeout(async () => {
            setChecking(true);
            try {
                const res = await axios.get(`/api/users/check-nickname?value=${value}`);
                    setIsDuplicate(res.data); // boolean 값 직접 사용
            } catch (error) {
                setIsDuplicate(null);
            } finally {
                setChecking(false);
            }
        }, 500);

        return () => clearTimeout(delayDebounce);
    }, [value]);

    const getBorderClass = () => {
        if (!value.trim()) return "border-gray-300 focus:ring-gray-200";
        if (checking) return "border-yellow-400 focus:ring-yellow-100";
        if (isDuplicate === false) return "border-green-500 focus:ring-green-200";
        if (isDuplicate === true) return "border-red-500 focus:ring-red-200";
        return "border-gray-300 focus:ring-gray-200";
    };

    const getMessage = () => {
        if (!value.trim()) return null;
        if (checking) return <span className="text-yellow-600">닉네임 확인 중...</span>;
        if (isDuplicate === false) return <span className="text-green-600">✔ 사용 가능한 닉네임입니다.</span>;
        if (isDuplicate === true) return <span className="text-red-600">❌ 이미 사용 중인 닉네임입니다.</span>;
        return null;
    };

    return (
        <div className="w-full">
            <label className="block text-left font-medium text-gray-700 mb-1">닉네임</label>
            <div className="relative">
                <input
                    type="text"
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    maxLength={22}
                    placeholder="닉네임을 입력해주세요."
                    className={`w-full px-4 py-2 border rounded text-black placeholder-gray-400 focus:outline-none focus:ring-2 pr-16 ${getBorderClass()}`}
                />
                <span className="absolute right-4 top-1/2 transform -translate-y-1/2 text-sm text-gray-500 select-none">
                    {value.length}/22
                </span>
            </div>
            <div className="flex justify-start mt-1 text-sm">
                {getMessage()}
            </div>
        </div>
    );
};

export default NameInput;
