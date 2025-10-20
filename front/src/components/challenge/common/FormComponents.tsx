// src/components/challenge/common/FormComponents.tsx
import React from "react";

export const Row = ({ children }: { children: React.ReactNode }) => (
    <div className="flex flex-col gap-1">{children}</div>
);

export const Label = ({ children }: { children: React.ReactNode }) => (
    <label className="text-[13px] font-semibold text-neutral-800 dark:text-white">{children}</label>
);

export const Help = ({ children }: { children: React.ReactNode }) => (
    <p className="text-[12px] text-neutral-500 dark:text-white/70">{children}</p>
);

export const GreenBox = ({ children }: { children: React.ReactNode }) => (
    <div className="rounded-xl border-2 border-emerald-300/70 bg-white dark:bg-[var(--surface)] p-3">{children}</div>
);
