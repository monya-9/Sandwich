import React, { useEffect, useState } from "react";

const OPTIONS = [
	"프론트엔드",
	"백엔드",
	"풀스택",
	"웹개발",
	"게임",
	"AI/머신러닝",
	"데이터 엔지니어링",
	"임베디드/IOT",
	"DevOps/인프라",
	"웹",
	"시스템 프로그래밍",
	"블록체인",
	"보안/해킹",
] as const;

type Option = typeof OPTIONS[number];

interface Props {
	open: boolean;
	initial: Option[];
	onClose: () => void;
	onConfirm: (values: Option[]) => void;
}

const WorkFieldModal: React.FC<Props> = ({ open, initial, onClose, onConfirm }) => {
	const [selected, setSelected] = useState<Option[]>([]);
	useEffect(() => {
		if (open) setSelected(initial.slice(0, 1));
	}, [open, initial]);

	const toggle = (opt: Option) => {
		setSelected((prev) => {
			const exists = prev.includes(opt);
			if (exists) return [] as Option[]; // 선택 해제
			// 단일 선택: 새 항목 하나만 유지
			return [opt];
		});
	};

	if (!open) return null;

	return (
		<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
			<div className="bg-white rounded-2xl w-full max-w-[420px] sm:max-w-[700px] h-[55vh] sm:h-auto sm:max-h-none max-h-[80vh] border border-[#E5E7EB] shadow-lg font-gmarket relative flex flex-col">
				{/* 헤더 */}
				<div className="px-5 py-4 sm:px-6 border-b flex items-start justify-between shrink-0">
					<div>
						<div className="text-[16px] sm:text-[18px] font-medium text-black">작업분야 설정</div>
						<div className="text-[12px] sm:text-[13px] text-[#6B7280] mt-1">나의 프로필에 노출된 작업 분야를 설정해주세요.</div>
					</div>
					<button
						type="button"
						aria-label="닫기"
						onClick={onClose}
						className="text-[#9CA3AF] hover:text-[#6B7280] text-[28px] sm:text-[34px] leading-none w-8 h-8 sm:w-10 sm:h-10 flex items-center justify-center"
					>
						×
					</button>
				</div>

				{/* 옵션 영역 */}
				<div className="px-5 py-4 sm:px-6 flex-1 overflow-y-auto">
					<div className="flex flex-wrap gap-2 sm:gap-3">
						{OPTIONS.map((opt) => {
							const active = selected.includes(opt);
							return (
								<button
									key={opt}
									type="button"
									aria-pressed={active}
									onClick={() => toggle(opt)}
									className={`h-10 sm:h-11 rounded-[12px] border inline-flex items-center px-3 sm:px-4 text-[13px] sm:text-[14px] justify-start whitespace-nowrap ${
										active
											? "bg-white border-[#22C55E] text-black"
											: "bg-white border-[#E5E7EB] text-black"
									}`}
								>
									<span
										className={`inline-flex items-center justify-center w-4 h-4 rounded-full mr-2 border ${
											active ? "bg-[#1DB8B8] border-[#1DB8B8] text-white" : "bg-white border-[#D1D5DB] text-transparent"
										}`}
									>
										✓
									</span>
									<span>{opt}</span>
								</button>
							);
						})}
					</div>
				</div>

				{/* 풋터 버튼 */}
				<div className="px-5 py-3 sm:px-6 border-t flex items-center justify-end gap-2 shrink-0">
					<button
						type="button"
						onClick={onClose}
						className="px-4 h-9 rounded-full bg-white border border-[#E5E7EB] text-[11px] sm:text-[12px] text-black"
					>
						취소
					</button>
					<button
						type="button"
						onClick={() => onConfirm(selected)}
						className="px-5 h-9 rounded-full bg-[#1DB8B8] text-white text-[11px] sm:text-[12px]"
					>
						확인
					</button>
				</div>
			</div>
		</div>
	);
};

export default WorkFieldModal; 