import React, { useEffect, useState } from "react";
import api from "../../../../api/axiosInstance";
import { FALLBACK_POSITIONS } from "../../../../constants/position";

interface Props {
    selected: string;
    onChange: (val: string) => void;
}

const LS_KEY = "meta.positions.v1";

const PositionSelect = ({ selected, onChange }: Props) => {
    const [items, setItems] = useState<string[]>(
        FALLBACK_POSITIONS.map(p => p.name)
    );

    useEffect(() => {
        let mounted = true;
        api
            .get<Array<{ id: number; name: string }>>("/meta/positions")
            .then((res) => {
                if (!mounted) return;
                localStorage.setItem(LS_KEY, JSON.stringify(res.data)); // 캐시
                setItems(res.data.map(p => p.name));
            })
            .catch(() => {
                localStorage.setItem(LS_KEY, JSON.stringify(FALLBACK_POSITIONS));
            });
        return () => { mounted = false; };
    }, []);

    return (
        <div className="text-left w-full flex flex-col items-center">
            <p className="font-medium text-gray-700 mb-2 w-full max-w-md">포지션</p>
            <div className="grid grid-cols-2 gap-x-6 gap-y-2 w-full max-w-md">
                {items.map((item) => (
                    <label key={item} className="flex items-start gap-2 cursor-pointer">
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
