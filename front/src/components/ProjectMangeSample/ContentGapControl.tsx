import React from "react";

type Props = {
	value: number;
	onChange: (v: number) => void;
};

export default function ContentGapControl({ value, onChange }: Props) {
	return (
		<div className="flex items-center gap-2">
			<label className="text-sm">콘텐츠 간격</label>
			<input type="range" min={0} max={80} value={value} onChange={(e) => onChange(parseInt(e.target.value, 10))} />
			<span className="text-sm w-8 text-right">{value}px</span>
		</div>
	);
} 