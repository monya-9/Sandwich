import React, { useEffect, useState, useMemo } from "react";
import SelectDropdown from "./SelectDropdown";
import { EducationApi, EducationLevel, EducationStatus, MajorItem } from "../../api/educationApi";
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
	const [level, setLevel] = useState<EducationLevel>("UNIVERSITY");
	const [degree, setDegree] = useState("학사");
	const [status, setStatus] = useState<EducationStatus>("GRADUATED");
	const [enterYear, setEnterYear] = useState("");
	const [graduateYear, setGraduateYear] = useState("");
	const [majors, setMajors] = useState<MajorItem[]>([]);
	const [newMajorName, setNewMajorName] = useState("");
	const [desc, setDesc] = useState("");
	const [isMain, setIsMain] = useState(false);
	const [saving, setSaving] = useState(false);
	const [errorToast, setErrorToast] = useState<{ visible: boolean; message: string }>({
		visible: false,
		message: ''
	});

	const levels: { value: EducationLevel; label: string }[] = [
		{ value: "HIGH_SCHOOL", label: "고등학교" },
		{ value: "UNIVERSITY", label: "대학교" },
		{ value: "GRADUATE", label: "대학원" },
		{ value: "BOOTCAMP", label: "부트캠프" },
		{ value: "OTHER", label: "기타" }
	];

	const degrees = ["학사","석사","박사","전문학사"]; 
	const statuses = useMemo(() => [
		{ value: "ENROLLED" as EducationStatus, label: "재학" },
		{ value: "GRADUATED" as EducationStatus, label: "졸업" },
		{ value: "LEAVE" as EducationStatus, label: "휴학" },
		{ value: "DROPPED" as EducationStatus, label: "중퇴" }
	], []); 

	useEffect(() => {
		if (!initial) return;
		setSchool(initial.schoolName || "");
		setLevel(initial.level || "UNIVERSITY");
		setDegree(initial.degree || "학사");
		setStatus(initial.status || "GRADUATED");
		setEnterYear(initial.startYear ? String(initial.startYear) : "");
		setGraduateYear(initial.endYear ? String(initial.endYear) : "");
		setIsMain(!!initial.isRepresentative);
		
		// 전공 데이터 로드 (수정 모드일 때만)
		if (editingId) {
			loadMajors(editingId);
		}
		
		// description에서 상태 추출 (전공은 API에서 관리하므로 제거)
		const rawDesc = initial.description || "";
		if (rawDesc) {
			const lines = rawDesc.split("\n");
			let metaStatus = "";
			const body: string[] = [];
			for (const line of lines) {
				if (line.startsWith(STATUS_PREFIX)) metaStatus = line.slice(STATUS_PREFIX.length);
				else if (!line.startsWith(MAJOR_PREFIX)) body.push(line);
			}
			if (metaStatus && statuses.some(s => s.value === metaStatus)) setStatus(metaStatus as EducationStatus);
			setDesc(body.join("\n").trim());
		}
	}, [initial, editingId, statuses]);

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
	// 고등학교는 degree와 전공이 선택사항이므로 조건 수정
	const requiredFilled = school.trim().length > 0 && 
		(level !== "HIGH_SCHOOL" && level !== "BOOTCAMP" ? degree.trim().length > 0 : true) && 
		(level !== "HIGH_SCHOOL" ? majors.length > 0 : true);
	const enterValid = !!enterYear && !enterYearError && enterYear.length === 4;
	const graduateValid = !!graduateYear && !graduateYearError && graduateYear.length === 4;
	const isValid = requiredFilled && enterValid && graduateValid;
    const completeBtnCls = `px-4 h-[36px] rounded-[10px] text-[14px] ${isValid && !saving ? "bg-[#21B284] text-white" : "bg-[#E5E7EB] text-[#111827]"}`;

	const buildDescription = (): string | undefined => {
		const parts: string[] = [];
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
				level,
				status,
				degree: level === "HIGH_SCHOOL" || level === "BOOTCAMP" ? undefined : degree,
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

	const addMajor = async () => {
		if (!newMajorName.trim() || !editingId) return;
		
		try {
			const response = await EducationApi.addMajor(editingId, newMajorName.trim());
			setMajors(prev => [...prev, response.data]);
			setNewMajorName("");
		} catch (error) {
			setErrorToast({
				visible: true,
				message: "전공 추가에 실패했습니다."
			});
		}
	};

	const removeMajor = async (majorId: number) => {
		try {
			await EducationApi.removeMajor(majorId);
			setMajors(prev => prev.filter(m => m.id !== majorId));
		} catch (error) {
			setErrorToast({
				visible: true,
				message: "전공 삭제에 실패했습니다."
			});
		}
	};

	const loadMajors = async (educationId: number) => {
		try {
			const response = await EducationApi.getMajors(educationId);
			setMajors(response.data);
		} catch (error) {
			console.error("전공 목록 로드 실패:", error);
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
			{/* 학력 레벨 */}
			<div>
				<label className="block text-[13px] text-[#6B7280] dark:text-white/60 mb-2">학력 레벨 <span className="text-green-500">*</span></label>
				<SelectDropdown 
					value={levels.find(l => l.value === level)?.label || "대학교"} 
					options={levels.map(l => l.label)} 
					onChange={(label) => {
						const selectedLevel = levels.find(l => l.label === label);
						if (selectedLevel) setLevel(selectedLevel.value);
					}} 
				/>
			</div>

			{/* 기관명 / 학위 */}
			<div className={`grid gap-4 ${level === "HIGH_SCHOOL" || level === "BOOTCAMP" ? "grid-cols-1" : "grid-cols-1 md:grid-cols-2"}`}>
                <div>
                    <label className="block text-[13px] text-[#6B7280] dark:text-white/60 mb-2">
						{level === "BOOTCAMP" ? "기관명" : "학교 이름"} <span className="text-green-500">*</span>
					</label>
                    <input 
						type="text" 
						value={school} 
						onChange={(e)=>setSchool(e.target.value)} 
						className="w-full h-[55px] py-0 leading-[55px] rounded-[10px] border border-[#E5E7EB] dark:border-[var(--border-color)] px-3 outline-none text-[14px] focus:border-[#068334] focus:ring-2 focus:ring-[#068334]/10 dark:bg-[var(--surface)] dark:text-white" 
						placeholder={level === "BOOTCAMP" ? "예) 코드스쿼드, 위코드" : "학교 이름을 입력해주세요."} 
					/>
                </div>
                {level !== "HIGH_SCHOOL" && level !== "BOOTCAMP" && (
					<div>
						<label className="block text-[13px] text-[#6B7280] dark:text-white/60 mb-2">학위 <span className="text-green-500">*</span></label>
						<SelectDropdown value={degree} options={degrees} onChange={setDegree} />
					</div>
				)}
			</div>

			{/* 기간 */}
			<div>
                <label className="block text-[13px] text-[#6B7280] dark:text-white/60 mb-2">
					{level === "BOOTCAMP" ? "수강 기간" : "재학 기간"} <span className="text-green-500">*</span>
				</label>
				<div className="grid grid-cols-[minmax(160px,1fr)_minmax(160px,1fr)] gap-2 md:grid-cols-[minmax(180px,1fr)_auto_minmax(180px,1fr)_minmax(200px,auto)] md:gap-x-3 md:gap-y-0 items-start">
					<div className="relative min-w-0">
                        <input 
							type="text" 
							maxLength={4} 
							value={enterYear} 
							onChange={(e)=>setEnterYear(e.target.value.replace(/[^0-9]/g, "").slice(0,4))} 
							className={`w-full min-h-[62px] py-0 leading-[62px] rounded-[10px] px-3 pr-8 outline-none text-[14px] border ${enterYearError ? "border-[#EF4444] focus:border-[#EF4444] focus:ring-2 focus:ring-[#EF4444]/20" : "border-[#E5E7EB] dark:border-[var(--border-color)] focus:border-[#068334] focus:ring-2 focus:ring-[#068334]/10 dark:bg-[var(--surface)] dark:text-white"}`} 
							placeholder={level === "BOOTCAMP" ? "시작년도" : "입학년도"} 
							aria-invalid={!!enterYearError} 
						/>
						<span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-[#9CA3AF]">{enterYear.length}/4</span>
						{enterYearError && <p className="mt-1 text-[12px] text-[#EF4444]">{enterYearError}</p>}
					</div>
					<span className="hidden md:flex items-center justify-center self-center text-[#6B7280] text-[14px] px-1">-</span>
					<div className="relative min-w-0">
                        <input 
							type="text" 
							maxLength={4} 
							value={graduateYear} 
							onChange={(e)=>setGraduateYear(e.target.value.replace(/[^0-9]/g, "").slice(0,4))} 
							className={`w-full min-h-[62px] py-0 leading-[62px] rounded-[10px] px-3 pr-8 outline-none text-[14px] border ${graduateYearError ? "border-[#EF4444] focus:border-[#EF4444] focus:ring-2 focus:ring-[#EF4444]/20" : "border-[#E5E7EB] dark:border-[var(--border-color)] focus:border-[#068334] focus:ring-2 focus:ring-[#068334]/10 dark:bg-[var(--surface)] dark:text-white"}`} 
							placeholder={level === "BOOTCAMP" ? "완료년도" : "졸업년도"} 
							aria-invalid={!!graduateYearError} 
						/>
						<span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-[#9CA3AF]">{graduateYear.length}/4</span>
						{graduateYearError && <p className="mt-1 text-[12px] text-[#EF4444]">{graduateYearError}</p>}
					</div>
                    <SelectDropdown 
						value={statuses.find(s => s.value === status)?.label || "졸업"} 
						options={statuses.map(s => s.label)} 
						onChange={(label) => {
							const selectedStatus = statuses.find(s => s.label === label);
							if (selectedStatus) setStatus(selectedStatus.value);
						}} 
						className="col-span-2 md:col-span-1 w-full lg:w-[200px] lg:flex-none" 
					/>
				</div>
			</div>

			{/* 전공/과정 - 고등학교가 아닐 때만 표시 */}
			{level !== "HIGH_SCHOOL" && (
				<div>
					<label className="block text-[13px] text-[#6B7280] dark:text-white/60 mb-2">
						{level === "BOOTCAMP" ? "과정명" : "전공"} <span className="text-green-500">*</span>
					</label>
					
					{/* 기존 전공 칩들 */}
					{majors.length > 0 && (
						<div className="flex flex-wrap gap-2 mb-3">
							{majors.map((major) => (
								<div key={major.id} className="inline-flex items-center gap-2 px-3 py-2 bg-[#F3F4F6] dark:bg-[#374151] rounded-lg text-[14px]">
									<span>{major.name}</span>
									<button
										type="button"
										onClick={() => removeMajor(major.id)}
										className="text-[#6B7280] hover:text-[#EF4444] transition-colors"
									>
										×
									</button>
								</div>
							))}
						</div>
					)}
					
					{/* 새 전공 추가 (수정 모드일 때만) */}
					{editingId && (
						<div className="flex gap-2">
							<input
								type="text"
								value={newMajorName}
								onChange={(e) => setNewMajorName(e.target.value)}
								className="flex-1 h-[55px] py-0 leading-[55px] rounded-[10px] border border-[#E5E7EB] dark:border-[var(--border-color)] px-3 outline-none text-[14px] focus:border-[#068334] focus:ring-2 focus:ring-[#068334]/10 dark:bg-[var(--surface)] dark:text-white"
								placeholder={level === "BOOTCAMP" ? "새 과정명을 입력하세요" : "새 전공을 입력하세요"}
								onKeyPress={(e) => {
									if (e.key === 'Enter') {
										e.preventDefault();
										addMajor();
									}
								}}
							/>
							<button
								type="button"
								onClick={addMajor}
								disabled={!newMajorName.trim()}
								className={`h-[55px] px-4 rounded-[10px] border ${
									newMajorName.trim() 
										? "border-[#21B284] text-[#21B284] hover:bg-[#21B284] hover:text-white" 
										: "border-[#E5E7EB] text-[#9CA3AF] cursor-not-allowed"
								} transition-colors`}
							>
								+ 추가
							</button>
						</div>
					)}
				</div>
			)}

			{/* 설명 - 고등학교가 아닐 때만 표시 */}
			{level !== "HIGH_SCHOOL" && (
				<div>
					<label className="block text-[13px] text-[#6B7280] dark:text-white/60 mb-2">설명</label>
					<textarea 
						value={desc} 
						onChange={(e)=>setDesc(e.target.value)} 
						rows={6} 
						className="w-full rounded-[10px] border border-[#E5E7EB] dark:border-[var(--border-color)] p-3 outline-none text-[14px] focus:border-[#068334] focus:ring-2 focus:ring-[#068334]/10 dark:bg-[var(--surface)] dark:text-white" 
						placeholder={level === "BOOTCAMP" ? "수강한 기술 스택이나 프로젝트 내용을 간단하게 작성해주세요." : "이수과목 또는 연구내용을 간단하게 작성해주세요."} 
					/>
				</div>
			)}

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