// src/components/challenge/common/CTAButton.tsx
import React from "react";
import { ArrowRight } from "lucide-react";

type Props = {
    children: React.ReactNode;  // 라벨
    onClick?: () => void;
    as?: "button" | "a";
    href?: string;
};

export default function CTAButton({ children, onClick, as = "button", href }: Props) {
    const base =
        "group inline-flex items-center gap-1 rounded-full border border-neutral-300 px-3 py-1.5 text-[13px] font-semibold text-neutral-900 hover:border-neutral-400 hover:bg-neutral-50";
    if (as === "a" && href) {
        return (
            <a className={base} href={href} onClick={onClick}>
                {children}
                <ArrowRight className="ml-0.5 h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </a>
        );
    }
    return (
        <button className={base} onClick={onClick}>
            {children}
            <ArrowRight className="ml-0.5 h-4 w-4 transition-transform group-hover:translate-x-0.5" />
        </button>
    );
}
