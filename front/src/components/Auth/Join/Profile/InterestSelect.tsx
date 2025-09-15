import React, { useEffect, useState } from "react";
import api from "../../../../api/axiosInstance";
import {
  FALLBACK_INTERESTS_GENERAL,
} from "../../../../constants/position";

interface Props {
  selected: string[];
  onChange: (vals: string[]) => void;
}

// GENERAL 용 키(네가 쓰던 키 유지)
const LS_KEY = "meta.interests.GENERAL.v1";

export default function InterestSelect({ selected, onChange }: Props) {
  const [items, setItems] = useState<string[]>(
    FALLBACK_INTERESTS_GENERAL.map((i) => i.name)
  );

  useEffect(() => {
    let mounted = true;

    api
      .get<Array<{ id: number; name: string }>>("/meta/interests?type=GENERAL")
      .then((res) => {
        if (!mounted) return;

        const data = Array.isArray(res.data) ? res.data : [];
        // ✅ 빈 배열이면 폴백 유지
        const safe = data.length ? data : FALLBACK_INTERESTS_GENERAL;

        localStorage.setItem(LS_KEY, JSON.stringify(safe));
        setItems(safe.map((i) => i.name));
      })
      .catch(() => {
        localStorage.setItem(
          LS_KEY,
          JSON.stringify(FALLBACK_INTERESTS_GENERAL)
        );
        setItems(FALLBACK_INTERESTS_GENERAL.map((i) => i.name));
      });

    return () => {
      mounted = false;
    };
  }, []);

  const toggle = (name: string) => {
    if (selected.includes(name)) {
      onChange(selected.filter((n) => n !== name));
    } else {
      onChange([...selected, name]);
    }
  };

  return (
    <div className="text-left w-full flex flex-col items-center">
      <p className="font-medium text-gray-700 mb-2 w-full max-w-md">
        관심 분야(최대 3개 선택)
      </p>
      <div className="grid grid-cols-2 gap-x-6 gap-y-2 w-full max-w-md">
        {items.map((name) => {
          const checked = selected.includes(name);
          return (
            <label key={name} className="flex items-start gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={checked}
                onChange={() => toggle(name)}
                className="mt-0.5 accent-green-600"
              />
              <span className="text-sm text-gray-800 leading-5">{name}</span>
            </label>
          );
        })}
      </div>
    </div>
  );
}

