import React from "react";

type Props = {
	value: string;
	onChange: (v: string) => void;
};

export default function BackgroundColorControl({ value, onChange }: Props) {
	return (
		<div className="flex items-center gap-2">
			<label className="text-sm">배경 색상</label>
			<input type="color" value={value} onChange={(e) => onChange(e.target.value)} />
			<input className="border rounded px-2 py-1 w-[120px]" value={value} onChange={(e) => onChange(e.target.value)} />
		</div>
	);
} 