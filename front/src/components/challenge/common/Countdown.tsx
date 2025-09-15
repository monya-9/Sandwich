// src/components/challenge/common/Countdown.tsx
import React, { useMemo } from "react";

export default function Countdown({ end }: { end: string | Date }) {
    const text = useMemo(() => {
        const endAt = new Date(end);
        const diff = +endAt - Date.now();
        if (diff <= 0) return "종료";
        const d = Math.floor(diff / (1000 * 60 * 60 * 24));
        const h = Math.floor((diff / (1000 * 60 * 60)) % 24);
        return d > 0 ? `D-${d}` : `${h}시간 남음`;
    }, [end]);

    return (
        <span className="ml-2 rounded-md bg-neutral-900/90 px-2 py-0.5 text-[11px] font-semibold text-white">
      {text}
    </span>
    );
}
