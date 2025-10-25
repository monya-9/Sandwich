// src/components/challenge/common/CTAButton.tsx
import React from "react";
import { ArrowRight } from "lucide-react";

/** string 태그("button" | "a") 또는 React 컴포넌트(Link 등) 모두 허용 */
type AsProp = "button" | "a" | React.ElementType;

type Props = {
    children: React.ReactNode;
    as?: AsProp;
    /** a 태그 전용 */
    href?: string;
    /** Link 전용 */
    to?: string;

    onClick?: React.MouseEventHandler<any>;
    disabled?: boolean;
    /** button일 때만 의미 있음 */
    type?: "button" | "submit" | "reset";
    className?: string;
};

export default function CTAButton({
                                      children,
                                      onClick,
                                      as = "button",
                                      href,
                                      to,
                                      disabled = false,
                                      type = "button",
                                      className = "",
                                  }: Props) {
    const base =
        "group inline-flex items-center gap-1 rounded-full border px-3 py-1.5 text-[13px] font-semibold transition " +
        "border-neutral-300 text-neutral-900 hover:border-neutral-400 hover:bg-neutral-50 " +
        "dark:bg-neutral-800 dark:text-white dark:border-neutral-600 dark:hover:bg-neutral-700 dark:hover:border-neutral-500 " +
        (disabled ? "opacity-50 pointer-events-none" : "");

    // 1) a 태그
    if (as === "a") {
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

    // 2) Link 같은 커스텀 컴포넌트
    if (typeof as !== "string") {
        const Comp = as as React.ElementType;
        return (
            <Comp
                className={`${base} ${className}`}
                to={to}
                onClick={disabled ? undefined : onClick}
                aria-disabled={disabled || undefined}
            >
                {children}
                <ArrowRight className="ml-0.5 h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </Comp>
        );
    }

    // 3) 기본 button
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
