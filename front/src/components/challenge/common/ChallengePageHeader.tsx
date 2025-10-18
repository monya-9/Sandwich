// src/components/challenge/common/ChallengePageHeader.tsx
import React from "react";
import { ChevronLeft } from "lucide-react";

interface ChallengePageHeaderProps {
    title: string;
    onBack: () => void;
    actionButton?: React.ReactNode;
}

export function ChallengePageHeader({ title, onBack, actionButton }: ChallengePageHeaderProps) {
    return (
        <div className="mb-4 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
                <button
                    onClick={onBack}
                    className="mr-1 inline-flex h-8 w-8 items-center justify-center rounded-full hover:bg-neutral-100"
                    aria-label="뒤로가기"
                >
                    <ChevronLeft className="h-5 w-5" />
                </button>
                <h1 className="text-[22px] font-extrabold tracking-[-0.01em] md:text-[24px]">
                    {title}
                </h1>
            </div>
            {actionButton}
        </div>
    );
}
