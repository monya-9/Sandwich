// src/pages/challenge/components/ChallengeCard.tsx
import React from "react";
import SectionCard from "./common/SectionCard";
import CTAButton from "./common/CTAButton";

export type ChallengeType = "CODE" | "PORTFOLIO";

export type ChallengeCardData = {
    id: string | number;
    type: ChallengeType;
    title: string;
    subtitle?: string;
    description?: React.ReactNode;
    ctaLabel: string;
    ctaHref?: string; // 옵션: 상세/참여 링크
};

export default function ChallengeCard({ item }: { item: ChallengeCardData }) {
    return (
        <SectionCard title={item.title}>
            {item.subtitle && (
                <div className="mb-3 text-[15px] font-semibold text-neutral-900">
                    {item.subtitle}
                </div>
            )}
            <div className="flex flex-col items-start justify-between gap-4 md:flex-row md:items-center">
                <div className="max-w-[680px] text-[14px] leading-6 text-neutral-800">
                    {item.description}
                </div>
                {item.ctaHref ? (
                    <CTAButton as="a" href={item.ctaHref}>{item.ctaLabel}</CTAButton>
                ) : (
                    <CTAButton>{item.ctaLabel}</CTAButton>
                )}
            </div>
        </SectionCard>
    );
}
