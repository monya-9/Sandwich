import React, { useState, useEffect } from "react";
import MonthSelect from "./MonthSelect";
import { CareerProjectApi } from "../../api/careerProjectApi";

interface InitialValues {
	title?: string;
	role?: string;
	startYear?: number;
	startMonth?: number;
	endYear?: number | null;
	endMonth?: number | null;
	description?: string;
	isRepresentative?: boolean;
}

interface Props {
	onCancel: () => void;
	onDone: () => void;
	initial?: InitialValues;
	editingId?: number;
}

const ProjectForm: React.FC<Props> = ({ onCancel, onDone, initial, editingId }) => {
	const [projectName, setProjectName] = useState("");
	const [role, setRole] = useState("");
	const [startYear, setStartYear] = useState("");
	const [startMonth, setStartMonth] = useState("01");
	const [endYear, setEndYear] = useState("");
	const [endMonth, setEndMonth] = useState("01");
	const [isOngoing, setIsOngoing] = useState(false);
	const [desc, setDesc] = useState("");
	const [isMain, setIsMain] = useState(false);
	const [saving, setSaving] = useState(false);

	useEffect(() => {
		if (!initial) return;
		setProjectName(initial.title ?? "");
		setRole(initial.role ?? "");
		setStartYear(initial.startYear ? String(initial.startYear) : "");
		setStartMonth(initial.startMonth ? String(initial.startMonth).padStart(2, "0") : "01");
		setIsOngoing(initial.endYear == null);
		setEndYear(initial.endYear ? String(initial.endYear) : "");
		setEndMonth(initial.endMonth ? String(initial.endMonth).padStart(2, "0") : "01");
		setDesc(initial.description ?? "");
		setIsMain(!!initial.isRepresentative);
	}, [initial]);

	const disabledInputCls = isOngoing ? " bg-[#E5E7EB] text-transparent placeholder-transparent cursor-not-allowed" : "";

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
	const startYearError = getYearError(startYear);
	const endYearError = isOngoing ? null : getYearError(endYear);

	// 폼 유효성
	const requiredFilled = projectName.trim().length > 0 && role.trim().length > 0;
	const startValid = !!startYear && !startYearError && startYear.length === 4;
	const endValid = isOngoing ? true : (!!endYear && !endYearError && endYear.length === 4);
	const isValid = requiredFilled && startValid && endValid;
	const completeBtnCls = `px-4 h-[36px] rounded-full text-[14px] ${isValid && !saving ? "bg-[#21B284] text-white" : "bg-[#E5E7EB] text-[#111827]"}`;

	const handleSave = async () => {
		if (saving || !isValid) return;
		setSaving(true);
		try {
			const payload = {
				title: projectName.trim(),
				role: role.trim(),
				startYear: toNumber(startYear) ?? 0,
				startMonth: parseInt(startMonth, 10) || 1,
				endYear: isOngoing ? null : toNumber(endYear),
				endMonth: isOngoing ? null : (parseInt(endMonth, 10) || null),
				description: desc.trim() || undefined,
				isRepresentative: isMain,
			};
			if (editingId) {
				await CareerProjectApi.update(editingId, payload);
			} else {
				await CareerProjectApi.create(payload);
			}
			onDone();
		} catch (e) {
			alert("프로젝트 저장에 실패했습니다.");
		} finally {
			setSaving(false);
		}
	};

	return (
		<div className="space-y-5">
			{/* 프로젝트 이름 / 역할 */}
			<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
				<div>
					<label className="block text-[13px] text-[#6B7280] mb-2">프로젝트 이름 <span className="text-green-500">*</span></label>
					<input type="text" value={projectName} onChange={(e)=>setProjectName(e.target.value)} className="w-full h-[55px] py-0 leading-[55px] rounded-[10px] border border-[#E5E7EB] px-3 outline-none text-[14px] focus:border-[#068334] focus:ring-2 focus:ring-[#068334]/10" placeholder="프로젝트 이름을 입력해주세요." />
				</div>
				<div>
					<label className="block text-[13px] text-[#6B7280] mb-2">역할 <span className="text-green-500">*</span></label>
					<input type="text" value={role} onChange={(e)=>setRole(e.target.value)} className="w-full h-[55px] py-0 leading-[55px] rounded-[10px] border border-[#E5E7EB] px-3 outline-none text-[14px] focus:border-[#068334] focus:ring-2 focus-ring-[#068334]/10" placeholder="프로젝트에서 담당한 역할을 입력해주세요." />
				</div>
			</div>

			{/* 참여 기간 */}
			<div>
				<label className="block text-[13px] text-[#6B7280] mb-2">참여 기간 <span className="text-green-500">*</span></label>
				<div className="flex items-start gap-6 flex-wrap md:flex-nowrap">
					<div className="flex items-start gap-4">
						<div className="relative">
							<input type="text" maxLength={4} value={startYear} onChange={(e)=>setStartYear(e.target.value.replace(/[^0-9]/g, "").slice(0,4))} className={`w-[180px] min-h-[62px] py-0 leading-[62px] rounded-[10px] px-3 pr-8 outline-none text-[14px] border ${startYearError ? "border-[#EF4444] focus:border-[#EF4444] focus:ring-2 focus:ring-[#EF4444]/20" : "border-[#E5E7EB] focus:border-[#068334] focus:ring-2 focus:ring-[#068334]/10"}`} placeholder="시작년도" aria-invalid={!!startYearError} />
							<span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-[#9CA3AF]">{startYear.length}/4</span>
							{startYearError && <p className="mt-1 text-[12px] text-[#EF4444]">{startYearError}</p>}
						</div>
						<MonthSelect value={startMonth} onChange={setStartMonth} className="w-[180px]" />
					</div>
					<span className="text-[#6B7280] text-[14px] mx-2 self-center">-</span>
					<div className="flex items-start gap-4">
						<div className="relative">
							<input type="text" maxLength={4} value={endYear} onChange={(e)=>setEndYear(e.target.value.replace(/[^0-9]/g, "").slice(0,4))} className={`w-[180px] min-h-[62px] py-0 leading-[62px] rounded-[10px] px-3 pr-8 outline-none text-[14px] border ${endYearError ? "border-[#EF4444] focus:border-[#EF4444] focus:ring-2 focus:ring-[#EF4444]/20" : "border-[#E5E7EB] focus:border-[#068334] focus:ring-2 focus:ring-[#068334]/10"}` + disabledInputCls} placeholder="종료년도" disabled={isOngoing} aria-invalid={!!endYearError} />
							<span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-[#9CA3AF]">{endYear.length}/4</span>
							{endYearError && <p className="mt-1 text-[12px] text-[#EF4444]">{endYearError}</p>}
						</div>
						<MonthSelect value={endMonth} onChange={setEndMonth} className="w-[180px]" disabled={isOngoing} />
						<label className="inline-flex items-center gap-2 text-[14px] text-[#111827] ml-4 whitespace-nowrap shrink-0 h-[55px]">
							<input type="checkbox" className="accent-[#068334]" checked={isOngoing} onChange={(e)=>setIsOngoing(e.target.checked)} />
							진행중
						</label>
					</div>
				</div>
			</div>

			{/* 설명 */}
			<div>
				<label className="block text-[13px] text-[#6B7280] mb-2">설명</label>
				<textarea value={desc} onChange={(e)=>setDesc(e.target.value)} rows={6} className="w-full rounded-[10px] border border-[#E5E7EB] p-3 outline-none text-[14px] focus:border-[#068334] focus:ring-2 focus:ring-[#068334]/10" placeholder="프로젝트에서 담당한 업무 및 성과를 작성해주세요." />
			</div>

			{/* 대표 커리어 설정 */}
			<div className="flex items-center justify-between pt-1">
				<label className="inline-flex items-center gap-2 text-[14px] text-[#111827]">
					<input type="checkbox" className="accent-[#068334]" checked={isMain} onChange={(e)=>setIsMain(e.target.checked)} />
					대표 커리어 설정
				</label>
				<div className="inline-flex items-center gap-3">
					<button onClick={onCancel} className="px-4 h-[36px] rounded-full border border-[#E5E7EB] bg-white text-[14px]">취소</button>
					<button onClick={handleSave} disabled={!isValid || saving} className={completeBtnCls}>완료</button>
				</div>
			</div>
		</div>
	);
};

export default ProjectForm; 