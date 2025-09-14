// src/components/challenge/common/CTAButton.tsx
import React from "react";
import { ArrowRight } from "lucide-react";

type Props = {
    children: React.ReactNode;
    as?: "button" | "a";
    href?: string;

    /** React 표준 핸들러로 바꿔서 () => Promise<void> 도 허용되게 */
    onClick?: React.MouseEventHandler<HTMLButtonElement | HTMLAnchorElement>;

    /** 버튼 비활성화 */
    disabled?: boolean;

    /** button 일 때만 의미 있음 (기본: button) */
    type?: "button" | "submit" | "reset";

    className?: string;
};

export default function CTAButton({
                                      children,
                                      onClick,
                                      as = "button",
                                      href,
                                      disabled = false,
                                      type = "button",
                                      className = "",
                                  }: Props) {
    const base =
        "group inline-flex items-center gap-1 rounded-full border px-3 py-1.5 text-[13px] font-semibold transition " +
        "border-neutral-300 text-neutral-900 hover:border-neutral-400 hover:bg-neutral-50 " +
        (disabled ? "opacity-50 pointer-events-none" : "");

    if (as === "a" && href) {
        return (
            <a
                className={`${base} ${className}`}
                href={href}
                onClick={disabled ? undefined : onClick}
                aria-disabled={disabled || undefined}
            >
                {children}
                <ArrowRight className="ml-0.5 h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </a>
        );
    }

    return (
        <button
            type={type}
            className={`${base} ${className}`}
            onClick={disabled ? undefined : onClick}
            disabled={disabled}
        >
            {children}
            <ArrowRight className="ml-0.5 h-4 w-4 transition-transform group-hover:translate-x-0.5" />
        </button>
    );
}
