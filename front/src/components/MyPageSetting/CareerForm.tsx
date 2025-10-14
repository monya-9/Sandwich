import React, { useState, useEffect } from "react";
import MonthSelect from "./MonthSelect";
import { CareerApi } from "../../api/careerApi";
import Toast from "../common/Toast";

interface InitialValues {
	role?: string;
	companyName?: string;
	startYear?: number;
	startMonth?: number;
	endYear?: number | null;
	endMonth?: number | null;
	isWorking?: boolean;
	description?: string;
	isRepresentative?: boolean;
}

interface Props {
	onCancel: () => void;
	onDone: () => void;
	initial?: InitialValues;
	editingId?: number;
}

const CareerForm: React.FC<Props> = ({ onCancel, onDone, initial, editingId }) => {
	const [role, setRole] = useState("");
	const [company, setCompany] = useState("");
	const [joinYear, setJoinYear] = useState("");
	const [joinMonth, setJoinMonth] = useState("01");
	const [leaveYear, setLeaveYear] = useState("");
	const [leaveMonth, setLeaveMonth] = useState("01");
	const [isCurrent, setIsCurrent] = useState(false);
	const [desc, setDesc] = useState("");
	const [isMainCareer, setIsMainCareer] = useState(false);
	const [saving, setSaving] = useState(false);
	const [errorToast, setErrorToast] = useState<{ visible: boolean; message: string }>({
		visible: false,
		message: ''
	});

	useEffect(() => {
		if (!initial) return;
		setRole(initial.role ?? "");
		setCompany(initial.companyName ?? "");
		setJoinYear(initial.startYear ? String(initial.startYear) : "");
		setJoinMonth(initial.startMonth ? String(initial.startMonth).padStart(2, "0") : "01");
		setIsCurrent(!!initial.isWorking);
		setLeaveYear(initial.endYear ? String(initial.endYear) : "");
		setLeaveMonth(initial.endMonth ? String(initial.endMonth).padStart(2, "0") : "01");
		setDesc(initial.description ?? "");
		setIsMainCareer(!!initial.isRepresentative);
	}, [initial]);

	const disabledInputCls = isCurrent ? " bg-[#E5E7EB] text-transparent placeholder-transparent cursor-not-allowed" : "";

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
	const joinYearError = getYearError(joinYear);
	const leaveYearError = isCurrent ? null : getYearError(leaveYear);

	// 폼 유효성
	const requiredFilled = role.trim().length > 0 && company.trim().length > 0;
	const joinValid = !!joinYear && !joinYearError && joinYear.length === 4;
	const leaveValid = isCurrent ? true : (!!leaveYear && !leaveYearError && leaveYear.length === 4);
	const isValid = requiredFilled && joinValid && leaveValid;
	const completeBtnCls = `px-4 h-[36px] rounded-full text-[14px] ${isValid && !saving ? "bg-[#21B284] text-white" : "bg-[#E5E7EB] text-[#111827]"}`;

	const handleSave = async () => {
		if (saving || !isValid) return;
		setSaving(true);
		try {
			const payload = {
				role: role.trim(),
				companyName: company.trim(),
				startYear: toNumber(joinYear) ?? 0,
				startMonth: toNumber(joinMonth) ?? 1,
				endYear: isCurrent ? null : toNumber(leaveYear),
				endMonth: isCurrent ? null : toNumber(leaveMonth) ?? null,
				isWorking: isCurrent,
				description: desc.trim() || undefined,
				isRepresentative: isMainCareer,
			};
			if (editingId) {
				await CareerApi.update(editingId, payload);
			} else {
				await CareerApi.create(payload);
			}
			onDone();
		} catch (e) {
			setErrorToast({
				visible: true,
				message: "경력 저장에 실패했습니다."
			});
		} finally {
			setSaving(false);
		}
	};

	return (
		<>
			<Toast
				visible={errorToast.visible}
				message={errorToast.message}
				type="error"
				size="medium"
				autoClose={3000}
				closable={true}
				onClose={() => setErrorToast(prev => ({ ...prev, visible: false }))}
			/>
			<div className="space-y-5">
			{/* 역할 / 회사 이름 */}
			<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
				<div>
					<label className="block text-[13px] text-[#6B7280] mb-2">역할 <span className="text-green-500">*</span></label>
					<div className="relative">
						<input type="text" value={role} onChange={(e)=>setRole(e.target.value)} className="w-full h-[55px] py-0 leading-[55px] rounded-[10px] border border-[#E5E7EB] px-3 outline-none text-[14px] focus:border-[#068334] focus:ring-2 focus:ring-[#068334]/10" placeholder="회사에서 담당한 역할을 입력해주세요." />
					</div>
				</div>
				<div>
					<label className="block text-[13px] text-[#6B7280] mb-2">회사 이름 <span className="text-green-500">*</span></label>
					<input type="text" value={company} onChange={(e)=>setCompany(e.target.value)} className="w-full h-[55px] py-0 leading-[55px] rounded-[10px] border border-[#E5E7EB] px-3 outline-none text-[14px] focus:border-[#068334] focus:ring-2 focus:ring-[#068334]/10" placeholder="회사 이름을 입력해주세요." />
				</div>
			</div>

			{/* 재직 기간 */}
			<div>
				<label className="block text-[13px] text-[#6B7280] mb-2">재직 기간 <span className="text-green-500">*</span></label>
					{/* 기본 레이아웃: 모바일은 세로, md 이상은 그리드로 좌/하이픈/우/체크박스 */}
					<div className="flex flex-col gap-3 md:grid md:grid-cols-[1fr_1fr_auto_1fr_1fr_auto] md:items-start md:gap-x-3 md:gap-y-0">
					{/* 왼쪽(입사) */}
					<div className="flex items-start gap-2 flex-1 min-w-0 md:contents">
						<div className="relative basis-1/2 md:basis-auto min-w-0">
							<input type="text" maxLength={4} value={joinYear} onChange={(e)=>setJoinYear(e.target.value.replace(/[^0-9]/g, "").slice(0,4))} className={`w-full min-h-[62px] py-0 leading-[62px] rounded-[10px] px-3 pr-8 outline-none text-[14px] border ${joinYearError ? "border-[#EF4444] focus:border-[#EF4444] focus:ring-2 focus:ring-[#EF4444]/20" : "border-[#E5E7EB] focus:border-[#068334] focus:ring-2 focus:ring-[#068334]/10"}`} placeholder="입사년도" aria-invalid={!!joinYearError} />
							<span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-[#9CA3AF]">{joinYear.length}/4</span>
							{joinYearError && <p className="mt-1 text-[12px] text-[#EF4444]">{joinYearError}</p>}
						</div>
						<MonthSelect value={joinMonth} onChange={setJoinMonth} className="basis-1/2 md:basis-auto min-w-0" />
					</div>
					{/* 구분자: md 이상에서만 표시 (auto 폭) */}
					<span className="hidden md:flex items-center justify-center self-center text-[#6B7280] text-[14px] px-1">-</span>
					{/* 오른쪽(퇴사) */}
					<div className="flex items-start gap-2 flex-1 min-w-0 md:contents">
						{/* 퇴사 년/월을 그룹으로 묶어 좌측과 동일 가용폭 확보 */}
						<div className="flex flex-1 min-w-0 gap-2 md:contents md:pr-0">
							<div className="relative basis-1/2 md:basis-auto min-w-0">
								<input type="text" maxLength={4} value={leaveYear} onChange={(e)=>setLeaveYear(e.target.value.replace(/[^0-9]/g, "").slice(0,4))} className={`w-full min-h-[62px] py-0 leading-[62px] rounded-[10px] px-3 pr-8 outline-none text-[14px] border ${leaveYearError ? "border-[#EF4444] focus:border-[#EF4444] focus:ring-2 focus:ring-[#EF4444]/20" : "border-[#E5E7EB] focus:border-[#068334] focus:ring-2 focus:ring-[#068334]/10"}` + disabledInputCls} placeholder="퇴사년도" disabled={isCurrent} aria-invalid={!!leaveYearError} />
								<span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-[#9CA3AF]">{leaveYear.length}/4</span>
								{leaveYearError && <p className="mt-1 text-[12px] text-[#EF4444]">{leaveYearError}</p>}
							</div>
							<MonthSelect value={leaveMonth} onChange={setLeaveMonth} className="basis-1/2 md:basis-auto min-w-0" disabled={isCurrent} />
						</div>
						<label className="hidden md:inline-flex items-center gap-2 text-[14px] text-[#111827] ml-0 whitespace-nowrap shrink-0 h-[55px]">
							<input type="checkbox" className="accent-[#068334]" checked={isCurrent} onChange={(e)=>setIsCurrent(e.target.checked)} />
							재직중
						</label>
					</div>
				</div>
				{/* 재직중 체크박스: md 미만에서는 아래 행으로 분리 */}
				<div className="mt-3 md:hidden">
					<label className="inline-flex items-center gap-2 text-[14px] text-[#111827] h-[55px]">
						<input type="checkbox" className="accent-[#068334]" checked={isCurrent} onChange={(e)=>setIsCurrent(e.target.checked)} />
						재직중
					</label>
				</div>
			</div>

			{/* 설명 */}
			<div>
				<label className="block text-[13px] text-[#6B7280] mb-2">설명</label>
				<textarea value={desc} onChange={(e)=>setDesc(e.target.value)} rows={6} className="w-full rounded-[10px] border border-[#E5E7EB] p-3 outline-none text-[14px] focus:border-[#068334] focus:ring-2 focus:ring-[#068334]/10" placeholder="회사에서 담당한 업무 및 성과를 작성해주세요." />
			</div>

			{/* 대표 커리어 설정 + 액션 버튼 (한 줄 정렬) */}
			<div className="flex items-center justify-between pt-1">
				<label className="inline-flex items-center gap-2 text-[14px] text-[#111827]">
					<input type="checkbox" className="accent-[#068334]" checked={isMainCareer} onChange={(e)=>setIsMainCareer(e.target.checked)} />
					대표 커리어 설정
				</label>
				<div className="inline-flex items-center gap-3">
					<button onClick={onCancel} className="px-4 h-[36px] rounded-full border border-[#E5E7EB] bg-white text-[14px]">취소</button>
					<button onClick={handleSave} disabled={!isValid || saving} className={completeBtnCls}>완료</button>
				</div>
			</div>
		</div>
		</>
	);
};

export default CareerForm; 