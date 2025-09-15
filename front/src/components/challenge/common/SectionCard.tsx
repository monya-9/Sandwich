// src/components/challenge/common/SectionCard.tsx
import React from "react";

type Props = {
    title?: string;
    headerRight?: React.ReactNode;
    children: React.ReactNode;
    /** 안쪽 카드 div에 붙일 클래스 (패딩 등 오버라이드용) */
    className?: string;
    /** 바깥 section 에 붙일 클래스 (섹션 간 간격 조절용) */
    outerClassName?: string;
    /** 테두리/그림자 표시 여부 (기본 true) */
    bordered?: boolean;
};

export default function SectionCard({
                                        title,
                                        headerRight,
                                        children,
                                        className,
                                        outerClassName,
                                        bordered = true,
                                    }: Props) {
    return (
        <section className={["mb-10", outerClassName || ""].join(" ")}>
            {title && (
                <h2 className="text-2xl font-bold mb-4 text-left ml-[15px]">
                    {title}
                </h2>
            )}
            <div
                className={[
                    "rounded-2xl bg-white p-5 md:p-7",            // 기본 패딩
                    bordered ? "border border-neutral-200 shadow" : "",
                    className || "",                               // 사용자 오버라이드
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
