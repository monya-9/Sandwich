import React, { useEffect, useRef, useState } from "react";

interface Props {
	value: string;
	options: string[];
	onChange: (v: string) => void;
	className?: string;
	maxVisible?: number; // 기본 6행
}

const SelectDropdown: React.FC<Props> = ({ value, options, onChange, className = "", maxVisible = 6 }) => {
	const [open, setOpen] = useState(false);
	const ref = useRef<HTMLDivElement>(null);

	useEffect(() => {
		const handler = (e: MouseEvent) => {
			if (!ref.current) return;
			if (!ref.current.contains(e.target as Node)) setOpen(false);
		};
		document.addEventListener("mousedown", handler);
		return () => document.removeEventListener("mousedown", handler);
	}, []);

	const itemHeight = 36; // px
	const maxHeight = itemHeight * maxVisible;

	return (
		<div ref={ref} className={`relative ${className}`}>
			<button type="button" aria-expanded={open} onClick={() => setOpen(!open)} className="w-full h-[55px] rounded-[10px] border border-[#E5E7EB] px-3 text-left text-[14px] leading-[55px] pr-9">
				<span>{value}</span>
				<span className={`absolute right-3 top-1/2 -translate-y-1/2 transition-transform ${open ? "rotate-180" : "rotate-0"} w-0 h-0 border-l-[4px] border-r-[4px] border-t-[6px] border-l-transparent border-r-transparent border-t-[#111827]`} />
			</button>
			{open && (
				<div className="absolute z-20 mt-2 w-full bg-white border border-[#E5E7EB] rounded-[10px] shadow-md overflow-y-auto" style={{ maxHeight }}>
					<ul className="py-0">
						{options.map(opt => (
							<li key={opt}>
								<button type="button" onClick={() => { onChange(opt); setOpen(false); }} className={`w-full text-left px-3 h-[36px] leading-[36px] text-[14px] hover:bg-[#F5F7FA] ${opt===value?"bg-[#F5F7FA]":""}`}>{opt}</button>
							</li>
						))}
					</ul>
				</div>
			)}
		</div>
	);
};

export default SelectDropdown; 