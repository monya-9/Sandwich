import React, { useEffect } from "react";
import { X } from "lucide-react";

type ModalProps = {
    open: boolean;
    onClose: () => void;
    children: React.ReactNode;
    widthClass?: string;
    paddingClass?: string;
    heightClass?: string;
};

export default function Modal({
                                  open,
                                  onClose,
                                  children,
                                  // 폭은 슬림 유지
                                  widthClass = "w-[300px] sm:w-[320px]",
                                  // 카드 자체 패딩(전체): 10px
                                  paddingClass = "p-[10px]",
                                  // 요청: 높이 더 길게
                                  heightClass = "min-h-[320px], min-h-[320px]",
                              }: ModalProps) {
    useEffect(() => {
        const onEsc = (e: KeyboardEvent) => e.key === "Escape" && onClose();
        if (open) document.addEventListener("keydown", onEsc);
        return () => document.removeEventListener("keydown", onEsc);
    }, [open, onClose]);

    if (!open) return null;

    return (
        <div className="fixed inset-0 z-[100000] flex items-center justify-center p-4" aria-modal="true" role="dialog">
            <div className="absolute inset-0 bg-[rgba(51,51,51,0.7)]" onClick={onClose} />
            <div
                className={[
                    "relative z-[100001] w-full max-w-[92%] rounded-[24px] bg-[#F2F2F2] dark:bg-[#2A2A2A] shadow-2xl",
                    widthClass,
                    heightClass,
                    paddingClass,
                ].join(" ")}
            >
                <button
                    aria-label="닫기"
                    onClick={onClose}
                    className="absolute right-2.5 top-2.5 rounded-full p-1 text-neutral-500 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-700"
                >
                    <X className="h-4.5 w-4.5" />
                </button>
                {children}
            </div>
        </div>
    );
}
