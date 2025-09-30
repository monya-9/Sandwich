import React, { useEffect, useMemo, useRef, useState } from "react";
import { HexColorPicker, HexColorInput } from "react-colorful";

interface SettingsPanelProps {
	backgroundColor: string;
	onBackgroundColorChange: (hex: string) => void;
	contentGapPx: number;
	onContentGapChange: (px: number) => void;
}

// color helpers (cloned to keep Sample independent)
function clamp(n: number, min: number, max: number): number {
	return Math.min(max, Math.max(min, n));
}
function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
	const matched = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
	return matched
		? {
			r: parseInt(matched[1], 16),
			g: parseInt(matched[2], 16),
			b: parseInt(matched[3], 16),
		}
		: null;
}
function rgbToHex(r: number, g: number, b: number): string {
	const toHex = (v: number) => clamp(v, 0, 255).toString(16).padStart(2, "0");
	return `#${toHex(r)}${toHex(g)}${toHex(b)}`.toUpperCase();
}
function rgbToHsl(r: number, g: number, b: number): { h: number; s: number; l: number } {
	r /= 255; g /= 255; b /= 255;
	const max = Math.max(r, g, b), min = Math.min(r, g, b);
	let h = 0, s = 0, l = (max + min) / 2;
	if (max !== min) {
		const d = max - min;
		s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
		switch (max) {
			case r: h = (g - b) / d + (g < b ? 6 : 0); break;
			case g: h = (b - r) / d + 2; break;
			case b: h = (r - g) / d + 4; break;
		}
		h /= 6;
	}
	return { h: Math.round(h * 360), s: Math.round(s * 100), l: Math.round(l * 100) };
}
function hslToRgb(h: number, s: number, l: number): { r: number; g: number; b: number } {
	h = ((h % 360) + 360) % 360; s = clamp(s, 0, 100) / 100; l = clamp(l, 0, 100) / 100;
	if (s === 0) {
		const v = Math.round(l * 255);
		return { r: v, g: v, b: v };
	}
	const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
	const p = 2 * l - q;
	const hk = h / 360;
	const hue2rgb = (p2: number, q2: number, t: number) => {
		if (t < 0) t += 1;
		if (t > 1) t -= 1;
		if (t < 1 / 6) return p2 + (q2 - p2) * 6 * t;
		if (t < 1 / 2) return q2;
		if (t < 2 / 3) return p2 + (q2 - p2) * (2 / 3 - t) * 6;
		return p2;
	};
	const r = Math.round(hue2rgb(p, q, hk + 1 / 3) * 255);
	const g = Math.round(hue2rgb(p, q, hk) * 255);
	const b = Math.round(hue2rgb(p, q, hk - 1 / 3) * 255);
	return { r, g, b };
}

type ColorFormat = "HEX" | "RGB" | "HSL";

const SettingsPanel: React.FC<SettingsPanelProps> = ({ backgroundColor, onBackgroundColorChange, contentGapPx, onContentGapChange }) => {
	const containerRef = useRef<HTMLDivElement | null>(null);
	const inputWrapRef = useRef<HTMLDivElement | null>(null);
	const [isPickerOpen, setIsPickerOpen] = useState(false);
	const [hexValue, setHexValue] = useState<string>((backgroundColor || "#FFFFFF").toUpperCase());
	const [format, setFormat] = useState<ColorFormat>("HEX");
	const [dropdownOpen, setDropdownOpen] = useState(false);

	useEffect(() => {
		setHexValue((backgroundColor || "#FFFFFF").toUpperCase());
	}, [backgroundColor]);

	const rgb = useMemo(() => hexToRgb(hexValue) || { r: 255, g: 255, b: 255 }, [hexValue]);
	const hsl = useMemo(() => rgbToHsl(rgb.r, rgb.g, rgb.b), [rgb]);

	const handleTextChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const value = e.target.value.toUpperCase();
		const fullHexRegex = /^#([0-9A-F]{6})$/;
		setHexValue(value);
		if (fullHexRegex.test(value)) {
			onBackgroundColorChange(value);
		}
	};

	const handleBlur = () => {
		const fullHexRegex = /^#([0-9A-F]{6})$/;
		if (!fullHexRegex.test(hexValue)) {
			setHexValue((backgroundColor || "#FFFFFF").toUpperCase());
		}
	};

	useEffect(() => {
		const onDown = (e: MouseEvent) => {
			if (!containerRef.current) return;
			if (!containerRef.current.contains(e.target as Node)) {
				setIsPickerOpen(false);
				setDropdownOpen(false);
			}
		};
		const onEsc = (e: KeyboardEvent) => {
			if (e.key === "Escape") { setIsPickerOpen(false); setDropdownOpen(false); }
		};
		document.addEventListener("mousedown", onDown);
		document.addEventListener("keydown", onEsc);
		return () => {
			document.removeEventListener("mousedown", onDown);
			document.removeEventListener("keydown", onEsc);
		};
	}, []);

	const onPick = (val: string) => {
		const upper = val.toUpperCase();
		setHexValue(upper);
		onBackgroundColorChange(upper);
	};

	const onRgbChange = (part: "r" | "g" | "b", value: string) => {
		const n = Number(value.replace(/[^\d]/g, ""));
		const next = { ...rgb, [part]: clamp(n || 0, 0, 255) } as typeof rgb;
		const hex = rgbToHex(next.r, next.g, next.b).toUpperCase();
		setHexValue(hex);
		onBackgroundColorChange(hex);
	};
	const onHslChange = (part: "h" | "s" | "l", value: string) => {
		const n = Number(value.replace(/[^\d]/g, ""));
		const next = { ...hsl, [part]: part === "h" ? clamp(n || 0, 0, 360) : clamp(n || 0, 0, 100) } as typeof hsl;
		const { r, g, b } = hslToRgb(next.h, next.s, next.l);
		const hex = rgbToHex(r, g, b).toUpperCase();
		setHexValue(hex);
		onBackgroundColorChange(hex);
	};

	return (
		<div className="border border-[#ADADAD] rounded-[10px] p-[24px]" ref={containerRef}>
			<label className="block text-[#ADADAD] text-[20px] mb-1">배경색상 설정</label>
			<div className="mb-[24px] relative">
				<div className="relative" ref={inputWrapRef} onClick={() => setIsPickerOpen(true)}>
					<div className="absolute top-0 bottom-0 left-[20%] w-px bg-[#D1D5DB] pointer-events-none z-20" />
					<input
						type="text"
						className="w-full h-10 border border-[#ADADAD] rounded pr-3 text-black placeholder:text-[#9CA3AF]"
						style={{
							paddingLeft: "calc(20% + 12px)",
							background:
								`linear-gradient(to right, ${hexValue} 0%, ${hexValue} 20%, transparent 20%, transparent 100%)`
						}}
						value={hexValue}
						onChange={handleTextChange}
						onBlur={handleBlur}
						placeholder="#FFFFFF"
					/>
				</div>
				{isPickerOpen && (
					<div className="absolute left-0 right-0 top-full mt-2 z-50 rounded-lg shadow-xl bg-white p-3 border border-[#E5E7EB]">
						<div className="absolute -top-1 left-10 w-3 h-3 rotate-45 bg-white border-l border-t border-[#E5E7EB]" />
						<HexColorPicker color={hexValue} onChange={onPick} style={{ width: "100%" }} />
						<div className="mt-3">
							<div className="flex items-center gap-2">
								{format === "HEX" && (
									<HexColorInput
										color={hexValue}
										onChange={(v: string) => onPick(v.toUpperCase())}
										prefixed
										className="flex-1 h-8 border border-[#D1D5DB] rounded px-2 text-black"
									/>
								)}
								{format === "RGB" && (
									<div className="flex gap-2">
										<input className="w-16 h-8 border border-[#D1D5DB] rounded px-2 text-black" value={rgb.r} onChange={(e) => onRgbChange("r", e.target.value)} />
										<input className="w-16 h-8 border border-[#D1D5DB] rounded px-2 text-black" value={rgb.g} onChange={(e) => onRgbChange("g", e.target.value)} />
										<input className="w-16 h-8 border border-[#D1D5DB] rounded px-2 text-black" value={rgb.b} onChange={(e) => onRgbChange("b", e.target.value)} />
									</div>
								)}
								{format === "HSL" && (
									<div className="flex gap-2">
										<input className="w-16 h-8 border border-[#D1D5DB] rounded px-2 text-black" value={hsl.h} onChange={(e) => onHslChange("h", e.target.value)} />
										<input className="w-16 h-8 border border-[#D1D5DB] rounded px-2 text-black" value={hsl.s} onChange={(e) => onHslChange("s", e.target.value)} />
										<input className="w-16 h-8 border border-[#D1D5DB] rounded px-2 text-black" value={hsl.l} onChange={(e) => onHslChange("l", e.target.value)} />
									</div>
								)}
								<div className="relative">
									<button type="button" className="w-8 h-8 border border-[#D1D5DB] rounded flex items-center justify-center" onClick={() => setDropdownOpen((v) => !v)}>
										<span className="select-none">▾</span>
									</button>
									{dropdownOpen && (
										<div className="absolute right-0 top-full mt-1 bg-white border border-[#E5E7EB] rounded shadow-md z-10">
											{(["HEX", "RGB", "HSL"] as ColorFormat[]).map((f) => (
												<button
													key={f}
													className={`px-3 py-1 text-sm w-24 text-left hover:bg-gray-100 ${f === format ? "font-semibold" : ""}`}
													onClick={() => { setFormat(f); setDropdownOpen(false); }}
												>
													{f}
												</button>
											))}
										</div>
									)}
								</div>
							</div>
							<div className="mt-2 text-xs text-[#6B7280] select-none">{format}</div>
						</div>
					</div>
				)}
			</div>

			<label className="block text-[#ADADAD] text-[20px] mb-1">콘텐츠 간격 설정</label>
			<div className="flex items-center gap-3">
				<input
					type="range"
					min={0}
					max={100}
					step={1}
					value={contentGapPx}
					onChange={(e) => onContentGapChange(Number(e.target.value))}
					className="w-[215px] accent-black"
				/>
				<span className="text-[15px]">{contentGapPx}px</span>
			</div>
		</div>
	);
};

export default SettingsPanel; 