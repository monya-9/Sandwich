import React, { useMemo, useRef, useState, useEffect } from "react";

interface Props {
	value: string;
	onChange: (v: string) => void;
	className?: string;
	disabled?: boolean;
}

const MonthSelect: React.FC<Props> = ({ value, onChange, className = "", disabled = false }) => {
	const months = useMemo(() => ["01","02","03","04","05","06","07","08","09","10","11","12"], []);
	const [open, setOpen] = useState(false);
	const wrapperRef = useRef<HTMLDivElement>(null);

	useEffect(() => {
		const onDoc = (e: MouseEvent) => {
			if (!wrapperRef.current) return;
			if (!wrapperRef.current.contains(e.target as Node)) setOpen(false);
		};
		document.addEventListener("mousedown", onDoc);
		return () => document.removeEventListener("mousedown", onDoc);
	}, []);

	useEffect(() => { if (disabled) setOpen(false); }, [disabled]);

    const buttonBase = "w-full h-[55px] rounded-[10px] border border-[#E5E7EB] dark:border-[var(--border-color)] px-3 text-left text-[14px] leading-[55px] pr-9 bg-white dark:bg-[var(--surface)] dark:text-white";
    const disabledCls = disabled ? " bg-[#E5E7EB] dark:bg-[var(--border-color)] text-transparent cursor-not-allowed" : "";

	return (
		<div ref={wrapperRef} className={`relative ${className}`}>
            <button type="button" aria-expanded={open} onClick={() => !disabled && setOpen(!open)} className={buttonBase + disabledCls} disabled={disabled}>
				<span>{value}</span>
                <span className={`absolute right-3 top-1/2 -translate-y-1/2 transition-transform ${open ? "rotate-180" : "rotate-0"} w-0 h-0 border-l-[4px] border-r-[4px] border-t-[6px] border-l-transparent border-r-transparent border-t-[#111827] dark:border-t-white/80`} />
			</button>
			{open && !disabled && (
                <div className="absolute z-20 mt-2 w-full bg-white dark:bg-[var(--surface)] border border-[#E5E7EB] dark:border-[var(--border-color)] rounded-[10px] shadow-md max-h-[180px] overflow-y-auto">
					<ul className="py-0">
						{months.map((m) => (
							<li key={m}>
                                <button type="button" onClick={() => { onChange(m); setOpen(false); }} className={`w-full text-left px-3 h-[36px] leading-[36px] text-[14px] hover:bg-[#F5F7FA] dark:hover:bg-white/5 ${m===value?"bg-[#F5F7FA] dark:bg-white/5":""} dark:text-white`}>
									{m}
								</button>
							</li>
						))}
					</ul>
				</div>
			)}
		</div>
	);
};

export default MonthSelect; 