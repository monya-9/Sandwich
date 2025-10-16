import React, { useEffect, useState } from "react";
import SelectDropdown from "./SelectDropdown";
import { EducationApi } from "../../api/educationApi";
import { EducationItem } from "./EducationCard";
import Toast from "../common/Toast";

interface Props {
	onCancel: () => void;
	onDone: () => void;
	initial?: EducationItem;
	editingId?: number;
}

const MAJOR_PREFIX = "__MAJOR__:";
const STATUS_PREFIX = "__STATUS__:";

const EducationForm: React.FC<Props> = ({ onCancel, onDone, initial, editingId }) => {
	const [school, setSchool] = useState("");
	const [degree, setDegree] = useState("학사");
	const [enterYear, setEnterYear] = useState("");
	const [graduateYear, setGraduateYear] = useState("");
	const [status, setStatus] = useState("졸업");
	const [majors, setMajors] = useState<string[]>([""]);
	const [desc, setDesc] = useState("");
	const [isMain, setIsMain] = useState(false);
	const [saving, setSaving] = useState(false);
	const [errorToast, setErrorToast] = useState<{ visible: boolean; message: string }>({
		visible: false,
		message: ''
	});

	const degrees = ["학사","석사","박사","전문학사"]; 
	const statuses = ["졸업","재학","휴학","중퇴"]; 

	useEffect(() => {
		if (!initial) return;
		setSchool(initial.schoolName || "");
		setDegree(initial.degree || "학사");
		setEnterYear(initial.startYear ? String(initial.startYear) : "");
		setGraduateYear(initial.endYear ? String(initial.endYear) : "");
		setIsMain(!!initial.isRepresentative);
		// description에서 전공/상태 추출
		const rawDesc = initial.description || "";
		if (rawDesc) {
			const lines = rawDesc.split("\n");
			let metaMajor = "";
			let metaStatus = "";
			const body: string[] = [];
			for (const line of lines) {
				if (line.startsWith(MAJOR_PREFIX)) metaMajor = line.slice(MAJOR_PREFIX.length);
				else if (line.startsWith(STATUS_PREFIX)) metaStatus = line.slice(STATUS_PREFIX.length);
				else body.push(line);
			}
			if (metaMajor) setMajors(metaMajor.split(",").map(s=>s.trim()).filter(Boolean).length ? metaMajor.split(",").map(s=>s.trim()) : [metaMajor.trim()]);
			if (metaStatus && statuses.includes(metaStatus)) setStatus(metaStatus);
			setDesc(body.join("\n").trim());
		}
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
	const enterYearError = getYearError(enterYear);
	const graduateYearError = getYearError(graduateYear);

	// 폼 유효성
	const firstMajor = (majors[0] || "").trim();
	const requiredFilled = school.trim().length > 0 && degree.trim().length > 0 && firstMajor.length > 0;
	const enterValid = !!enterYear && !enterYearError && enterYear.length === 4;
	const graduateValid = !!graduateYear && !graduateYearError && graduateYear.length === 4;
	const isValid = requiredFilled && enterValid && graduateValid;
    const completeBtnCls = `px-4 h-[36px] rounded-[10px] text-[14px] ${isValid && !saving ? "bg-[#21B284] text-white" : "bg-[#E5E7EB] text-[#111827]"}`;

	const buildDescription = (): string | undefined => {
		const parts: string[] = [];
		const joinedMajors = majors.map(m=>m.trim()).filter(Boolean).join(", ");
		if (joinedMajors) parts.push(`${MAJOR_PREFIX}${joinedMajors}`);
		if (status.trim()) parts.push(`${STATUS_PREFIX}${status.trim()}`);
		if (desc.trim()) parts.push(desc.trim());
		return parts.length ? parts.join("\n") : undefined;
	};

	const handleSave = async () => {
		if (saving || !isValid) return;
		setSaving(true);
		try {
			const payload = {
				schoolName: school.trim(),
				degree,
				startYear: toNumber(enterYear) ?? 0,
				startMonth: 1,
				endYear: toNumber(graduateYear),
				endMonth: 1,
				description: buildDescription(),
				isRepresentative: isMain,
			};
			if (editingId) {
				await EducationApi.update(editingId, payload as any);
			} else {
				await EducationApi.create(payload as any);
			}
			onDone();
		} catch (e) {
			setErrorToast({
				visible: true,
				message: "학력 저장에 실패했습니다."
			});
		} finally {
			setSaving(false);
		}
	};

	const updateMajorAt = (idx: number, value: string) => {
		setMajors(prev => prev.map((m, i) => i === idx ? value : m));
	};
	const addMajor = () => setMajors(prev => (prev[0] && prev[0].trim().length > 0 ? [...prev, ""] : prev));
	const removeLastMajor = () => setMajors(prev => (prev.length > 1 ? prev.slice(0, prev.length - 1) : prev));

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
			{/* 학교 이름 / 학위 */}
			<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label className="block text-[13px] text-[#6B7280] dark:text-white/60 mb-2">학교 이름 <span className="text-green-500">*</span></label>
                    <input type="text" value={school} onChange={(e)=>setSchool(e.target.value)} className="w-full h-[55px] py-0 leading-[55px] rounded-[10px] border border-[#E5E7EB] dark:border-[var(--border-color)] px-3 outline-none text-[14px] focus:border-[#068334] focus:ring-2 focus:ring-[#068334]/10 dark:bg-[var(--surface)] dark:text-white" placeholder="학교 이름을 입력해주세요." />
                </div>
                <div>
                    <label className="block text-[13px] text-[#6B7280] dark:text-white/60 mb-2">학위 <span className="text-green-500">*</span></label>
                    <SelectDropdown value={degree} options={degrees} onChange={setDegree} />
                </div>
			</div>

			{/* 재학 기간 */}
			<div>
                <label className="block text-[13px] text-[#6B7280] dark:text-white/60 mb-2">재학 기간 <span className="text-green-500">*</span></label>
				<div className="grid grid-cols-[minmax(160px,1fr)_minmax(160px,1fr)] gap-2 md:grid-cols-[minmax(180px,1fr)_auto_minmax(180px,1fr)_minmax(200px,auto)] md:gap-x-3 md:gap-y-0 items-start">
					<div className="relative min-w-0">
                        <input type="text" maxLength={4} value={enterYear} onChange={(e)=>setEnterYear(e.target.value.replace(/[^0-9]/g, "").slice(0,4))} className={`w-full min-h-[62px] py-0 leading-[62px] rounded-[10px] px-3 pr-8 outline-none text-[14px] border ${enterYearError ? "border-[#EF4444] focus:border-[#EF4444] focus:ring-2 focus:ring-[#EF4444]/20" : "border-[#E5E7EB] dark:border-[var(--border-color)] focus:border-[#068334] focus:ring-2 focus:ring-[#068334]/10 dark:bg-[var(--surface)] dark:text-white"}`} placeholder="입학년도" aria-invalid={!!enterYearError} />
						<span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-[#9CA3AF]">{enterYear.length}/4</span>
						{enterYearError && <p className="mt-1 text-[12px] text-[#EF4444]">{enterYearError}</p>}
					</div>
					<span className="hidden md:flex items-center justify-center self-center text-[#6B7280] text-[14px] px-1">-</span>
					<div className="relative min-w-0">
                        <input type="text" maxLength={4} value={graduateYear} onChange={(e)=>setGraduateYear(e.target.value.replace(/[^0-9]/g, "").slice(0,4))} className={`w-full min-h-[62px] py-0 leading-[62px] rounded-[10px] px-3 pr-8 outline-none text-[14px] border ${graduateYearError ? "border-[#EF4444] focus:border-[#EF4444] focus:ring-2 focus:ring-[#EF4444]/20" : "border-[#E5E7EB] dark:border-[var(--border-color)] focus:border-[#068334] focus:ring-2 focus:ring-[#068334]/10 dark:bg-[var(--surface)] dark:text-white"}`} placeholder="졸업년도" aria-invalid={!!graduateYearError} />
						<span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-[#9CA3AF]">{graduateYear.length}/4</span>
						{graduateYearError && <p className="mt-1 text-[12px] text-[#EF4444]">{graduateYearError}</p>}
					</div>
                    <SelectDropdown value={status} options={statuses} onChange={setStatus} className="col-span-2 md:col-span-1 w-full lg:w-[200px] lg:flex-none" />
				</div>
			</div>

			{/* 전공 */}
			<div>
                <label className="block text-[13px] text-[#6B7280] dark:text-white/60 mb-2">전공 <span className="text-green-500">*</span></label>
				<div className="flex items-start gap-3">
					<div className="flex-1 space-y-3">
                        <input type="text" value={majors[0]} onChange={(e)=>updateMajorAt(0, e.target.value)} className="w-full h-[55px] py-0 leading-[55px] rounded-[10px] border border-[#E5E7EB] dark:border-[var(--border-color)] px-3 outline-none text-[14px] focus:border-[#068334] focus:ring-2 focus:ring-[#068334]/10 dark:bg-[var(--surface)] dark:text-white" placeholder="예) 시각디자인과" />
						{majors.slice(1).map((m, idx) => (
                            <input key={idx} type="text" value={m} onChange={(e)=>updateMajorAt(idx+1, e.target.value)} className="w-full h-[55px] py-0 leading-[55px] rounded-[10px] border border-[#E5E7EB] dark:border-[var(--border-color)] px-3 outline-none text-[14px] focus:border-[#068334] focus:ring-2 focus:ring-[#068334]/10 dark:bg-[var(--surface)] dark:text-white" placeholder="추가 전공 과목을 입력해주세요." />
						))}
					</div>
					<div className="shrink-0 flex flex-col gap-3">
						<button type="button" onClick={addMajor} disabled={!firstMajor} className={`h-[55px] px-4 rounded-[10px] border ${firstMajor ? "border-[#21B284] text-[#21B284]" : "border-[#E5E7EB] text-[#9CA3AF] cursor-not-allowed"}`}>+ 추가</button>
						{majors.length > 1 && (
							<button type="button" onClick={removeLastMajor} className="h-[55px] px-4 rounded-[10px] border border-[#EF4444] text-[#EF4444]">- 삭제</button>
						)}
					</div>
				</div>
			</div>

			{/* 설명 */}
			<div>
                <label className="block text-[13px] text-[#6B7280] dark:text-white/60 mb-2">설명</label>
                <textarea value={desc} onChange={(e)=>setDesc(e.target.value)} rows={6} className="w-full rounded-[10px] border border-[#E5E7EB] dark:border-[var(--border-color)] p-3 outline-none text-[14px] focus:border-[#068334] focus:ring-2 focus:ring-[#068334]/10 dark:bg-[var(--surface)] dark:text-white" placeholder="이수과목 또는 연구내용을 간단하게 작성해주세요." />
			</div>

            <div className="flex items-center justify-between pt-1">
                <label className="inline-flex items-center gap-2 text-[14px] text-[#111827] dark:text-white">
					<input type="checkbox" className="accent-[#068334]" checked={isMain} onChange={(e)=>setIsMain(e.target.checked)} />
					대표 커리어 설정
				</label>
				<div className="inline-flex items-center gap-3">
                    <button onClick={onCancel} className="px-4 h-[36px] rounded-[10px] border border-[#E5E7EB] dark:border-[var(--border-color)] bg-white dark:bg-[var(--surface)] text-[14px] dark:text-white">취소</button>
					<button onClick={handleSave} disabled={!isValid || saving} className={completeBtnCls}>완료</button>
				</div>
			</div>
		</div>
		</>
	);
};

export default EducationForm; 