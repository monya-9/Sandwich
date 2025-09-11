import React, { ReactNode, useEffect, useRef, useState } from "react";

interface Props {
    children: ReactNode;
    width?: string;             // Tailwind width
    align?: "right" | "left";   // 정렬 방향
    offsetY?: string;           // Y 간격 (예: 'mt-3')
    className?: string;         // 추가 클래스
    /** (선택) 닫힐 때 부모에게도 알려주고 싶을 때 */
    onRequestClose?: () => void;
}

/** 전역으로 모든 드롭다운 닫기 이벤트 발사 */
export function emitHideDropdowns() {
    window.dispatchEvent(new CustomEvent("hide-dropdowns"));
}

const DropdownWrapper = ({
                             children,
                             width = "w-80",
                             align = "right",
                             offsetY = "mt-3",
                             className = "",
                             onRequestClose,
                         }: Props) => {
    const alignClass = align === "right" ? "right-0" : "left-0";
    const ref = useRef<HTMLDivElement>(null);

    // ✅ 내부 가시성 상태 — 부모가 안닫아줘도 스스로 사라짐
    const [visible, setVisible] = useState(true);
    const close = () => {
        setVisible(false);
        onRequestClose?.();
    };

    // 외부 클릭 시 닫기
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (!ref.current) return;
            if (!ref.current.contains(e.target as Node)) close();
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    // ESC로 닫기
    useEffect(() => {
        const handleKey = (e: KeyboardEvent) => {
            if (e.key === "Escape") close();
        };
        window.addEventListener("keydown", handleKey);
        return () => window.removeEventListener("keydown", handleKey);
    }, []);

    // 전역 이벤트/뒤로가기(popstate)로 닫기
    useEffect(() => {
        window.addEventListener("hide-dropdowns", close);
        window.addEventListener("popstate", close);
        return () => {
            window.removeEventListener("hide-dropdowns", close);
            window.removeEventListener("popstate", close);
        };
    }, []);

    if (!visible) return null;

    return (
        <div
            ref={ref}
            role="menu"
            aria-modal="true"
            className={[
                "absolute top-full",
                alignClass,
                offsetY,
                width,
                "bg-white shadow-xl rounded-xl p-6 z-50 pointer-events-auto",
                className,
            ].join(" ")}
        >
            {children}
        </div>
    );
};

export default DropdownWrapper;
