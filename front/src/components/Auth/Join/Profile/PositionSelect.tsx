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
    FALLBACK_POSITIONS.map((p) => p.name)
  );

  useEffect(() => {
    let mounted = true;

    api
      .get<Array<{ id: number; name: string }>>("/meta/positions")
      .then((res) => {
        if (!mounted) return;

        const data = Array.isArray(res.data) ? res.data : [];
        // ✅ 빈 배열이면 폴백 유지
        const safe = data.length ? data : FALLBACK_POSITIONS;

        localStorage.setItem(LS_KEY, JSON.stringify(safe));
        setItems(safe.map((p) => p.name));
      })
      .catch(() => {
        // 실패 시에도 즉시 폴백 반영 + 캐시 저장
        localStorage.setItem(LS_KEY, JSON.stringify(FALLBACK_POSITIONS));
        setItems(FALLBACK_POSITIONS.map((p) => p.name));
      });

    return () => {
      mounted = false;
    };
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