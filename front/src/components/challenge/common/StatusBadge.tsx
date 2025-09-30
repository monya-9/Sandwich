// src/components/challenge/common/StatusBadge.tsx
import React from "react";

export default function StatusBadge({ label }: { label: string }) {
    return (
        <span className="inline-flex items-center rounded-full border border-neutral-300 bg-white px-2.5 py-1 text-[11px] font-medium text-neutral-700 shadow">
      {label}
    </span>
    );
}
