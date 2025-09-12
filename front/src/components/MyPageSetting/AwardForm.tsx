import React, { useState, useEffect } from "react";
import MonthSelect from "./MonthSelect";
import { AwardApi } from "../../api/awardApi";

interface Props {
	onCancel: () => void;
	onDone: () => void;
	initial?: {
		title?: string;
		issuer?: string;
		year?: number;
		month?: number;
		description?: string;
		isRepresentative?: boolean;
	};
	editingId?: number;
}

const AwardForm: React.FC<Props> = ({ onCancel, onDone, initial, editingId }) => {
	const [category, setCategory] = useState("");
	const [name, setName] = useState("");
	const [org, setOrg] = useState("");
	const [year, setYear] = useState("");
	const [month, setMonth] = useState("01");
	const [desc, setDesc] = useState("");
	const [isMain, setIsMain] = useState(false);
	const [saving, setSaving] = useState(false);

	useEffect(() => {
		if (!initial) return;
		// title을 '부문(이름)' 형태에서 분리
		const t = (initial.title ?? "").trim();
		const openIdx = t.lastIndexOf("(");
		const closeIdx = t.endsWith(")") ? t.length - 1 : -1;
		if (openIdx > 0 && closeIdx > openIdx) {
			setCategory(t.substring(0, openIdx).trim());
			setName(t.substring(openIdx + 1, closeIdx).trim());
		} else {
			setCategory("");
			setName(t);
		}
		setOrg(initial.issuer ?? "");
		setYear(initial.year ? String(initial.year) : "");
		setMonth(initial.month ? String(initial.month).padStart(2, "0") : "01");
		setDesc(initial.description ?? "");
		setIsMain(!!initial.isRepresentative);
	}, [initial]);

	const toNumber = (s: string): number | null => {
		const n = parseInt((s || "").trim(), 10);
		return Number.isFinite(n) ? n : null;
	};

	// 연도 유효성 검사
	const currentYear = new Date().getFullYear();
	const getYearError = (s: string): string | null => {
		if (!s) return null;
		if (s.length !== 4 || Number.isNaN(parseInt(s, 10))) return "날짜입력 형식이 아닙니다.";
		if (parseInt(s, 10) > currentYear) return "이번년도 이전으로 설정해주세요.";
		return null;
	};
	const yearError = getYearError(year);

	// 폼 유효성
	const requiredFilled = name.trim().length > 0 && org.trim().length > 0;
	const yearValid = !!year && !yearError && year.length === 4;
	const isValid = requiredFilled && yearValid;
	const completeBtnCls = `px-4 h-[36px] rounded-[10px] text-[14px] ${isValid && !saving ? "bg-[#21B284] text-white" : "bg-[#E5E7EB] text-[#111827]"}`;

	const buildTitle = () => {
		const n = name.trim();
		const c = category.trim();
		return c ? `${c}(${n})` : n;
	};

	const handleSave = async () => {
		if (saving || !isValid) return;
		setSaving(true);
		try {
			const payload = {
				title: buildTitle(),
				issuer: org.trim(),
				year: toNumber(year) ?? 0,
				month: parseInt(month, 10) || 1,
				description: desc.trim() || undefined,
				isRepresentative: isMain,
			};
			if (editingId) {
				await AwardApi.update(editingId, payload);
			} else {
				await AwardApi.create(payload);
			}
			onDone();
		} catch (e) {
			alert("수상 저장에 실패했습니다.");
		} finally {
			setSaving(false);
		}
	};

	return (
		<div className="space-y-5">
			{/* 수상 부문 / 이름 */}
			<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
				<div>
					<label className="block text-[13px] text-[#6B7280] mb-2">수상 부문</label>
					<input type="text" value={category} onChange={(e)=>setCategory(e.target.value)} className="w-full h-[55px] py-0 leading-[55px] rounded-[10px] border border-[#E5E7EB] px-3 outline-none text-[14px] focus:border-[#068334] focus:ring-2 focus:ring-[#068334]/10" placeholder="예) 학술대회" />
				</div>
				<div>
					<label className="block text-[13px] text-[#6B7280] mb-2">이름 <span className="text-green-500">*</span></label>
					<input type="text" value={name} onChange={(e)=>setName(e.target.value)} className="w-full h-[55px] py-0 leading-[55px] rounded-[10px] border border-[#E5E7EB] px-3 outline-none text-[14px] focus:border-[#068334] focus:ring-2 focus:ring-[#068334]/10" placeholder="예) 최우수상" />
				</div>
			</div>

			{/* 수상 기관 / 수상일 */}
			<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
				<div>
					<label className="block text-[13px] text-[#6B7280] mb-2">수상 기관 <span className="text-green-500">*</span></label>
					<input type="text" value={org} onChange={(e)=>setOrg(e.target.value)} className="w-full h-[55px] py-0 leading-[55px] rounded-[10px] border border-[#E5E7EB] px-3 outline-none text-[14px] focus:border-[#068334] focus:ring-2 focus:ring-[#068334]/10" placeholder="예) 한국정보과학회" />
				</div>
				<div>
					<label className="block text-[13px] text-[#6B7280] mb-2">수상일 <span className="text-green-500">*</span></label>
					<div className="flex items-start gap-4">
						<div className="relative">
							<input type="text" maxLength={4} value={year} onChange={(e)=>setYear(e.target.value.replace(/[^0-9]/g, "").slice(0,4))} className={`w-[200px] min-h-[62px] py-0 leading-[62px] rounded-[10px] px-3 pr-8 outline-none text-[14px] border ${yearError ? "border-[#EF4444] focus:border-[#EF4444] focus:ring-2 focus:ring-[#EF4444]/20" : "border-[#E5E7EB] focus:border-[#068334] focus:ring-2 focus:ring-[#068334]/10"}`} placeholder="수상년도" aria-invalid={!!yearError} />
							<span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-[#9CA3AF]">{year.length}/4</span>
							{yearError && <p className="mt-1 text-[12px] text-[#EF4444]">{yearError}</p>}
						</div>
						<MonthSelect value={month} onChange={setMonth} className="w-[200px]" />
					</div>
				</div>
			</div>

			{/* 설명 */}
			<div>
				<label className="block text-[13px] text-[#6B7280] mb-2">설명</label>
				<textarea value={desc} onChange={(e)=>setDesc(e.target.value)} rows={6} className="w-full rounded-[10px] border border-[#E5E7EB] p-3 outline-none text-[14px] focus:border-[#068334] focus:ring-2 focus:ring-[#068334]/10" placeholder="예) 맞춤형 대외활동 플랫폼 서비스를 개발하여 론칭하였습니다." />
			</div>

			<div className="flex items-center justify-between pt-1">
				<label className="inline-flex items-center gap-2 text-[14px] text-[#111827]">
					<input type="checkbox" checked={isMain} onChange={(e)=>setIsMain(e.target.checked)} />
					대표 커리어 설정
				</label>
				<div className="inline-flex items-center gap-3">
					<button onClick={onCancel} className="px-4 h-[36px] rounded-[10px] border border-[#E5E7EB] bg-white text-[14px]">취소</button>
					<button onClick={handleSave} disabled={!isValid || saving} className={completeBtnCls}>완료</button>
				</div>
			</div>
		</div>
	);
};

export default AwardForm; 