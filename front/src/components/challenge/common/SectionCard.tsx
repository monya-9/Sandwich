// src/components/challenge/common/SectionCard.tsx
import React from "react";

type Props = {
    title?: string;
    headerRight?: React.ReactNode;
    children: React.ReactNode;
    className?: string;
    bordered?: boolean;   // ✅ 추가: 기본 true
};

export default function SectionCard({ title, headerRight, children, className, bordered = true }: Props) {
    return (
        <section className="mb-10">
            {title && (
                <h2 className="text-2xl font-bold mb-4 text-left ml-[15px]">
                    {title}
                </h2>
            )}
            <div
                className={[
                    "rounded-2xl bg-white p-5 md:p-7",
                    bordered ? "border border-neutral-200 shadow" : "",  // ✅ 보더 토글
                    className || ""
                ].join(" ")}
            >
                {headerRight ? (
                    <div className="mb-3 flex items-center justify-between">
                        <div />
                        <div>{headerRight}</div>
                    </div>
                ) : null}
                {children}
            </div>
        </section>
    );
}
