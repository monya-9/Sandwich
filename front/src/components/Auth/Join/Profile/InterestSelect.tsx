import React, { useEffect, useState } from "react";
import api from "../../../../api/axiosInstance";
import { FALLBACK_INTERESTS_GENERAL } from "../../../../constants/position";

interface Props {
    selected: string[];
    onChange: (val: string[]) => void;
}

const LS_KEY = "meta.interests.GENERAL.v1";

const InterestSelect = ({ selected, onChange }: Props) => {
    const [items, setItems] = useState<string[]>(
        FALLBACK_INTERESTS_GENERAL.map(i => i.name)
    );

    useEffect(() => {
        let mounted = true;
        api
            .get<Array<{ id: number; name: string }>>("/meta/interests", { params: { type: "GENERAL" } })
            .then((res) => {
                if (!mounted) return;
                localStorage.setItem(LS_KEY, JSON.stringify(res.data)); // 캐시
                setItems(res.data.map(i => i.name));
            })
            .catch(() => {
                // 실패 시 폴백도 캐시해둠
                localStorage.setItem(LS_KEY, JSON.stringify(FALLBACK_INTERESTS_GENERAL));
            });
        return () => { mounted = false; };
    }, []);

    const toggle = (item: string) => {
        const next = selected.includes(item)
            ? selected.filter((i) => i !== item)
            : selected.length < 3
                ? [...selected, item]
                : selected; // 최대 3개
        onChange(next);
    };

    return (
        <div className="text-left w-full flex flex-col items-center">
            <p className="font-medium text-gray-700 mb-2 w-full max-w-md">
                관심 분야(최대 3개 선택)
            </p>
            <div className="grid grid-cols-2 gap-x-6 gap-y-2 w-full max-w-md">
                {items.map((item) => (
                    <label key={item} className="flex items-start gap-2 cursor-pointer">
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
