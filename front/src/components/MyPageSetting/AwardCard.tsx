import React, { useEffect, useState } from "react";
import { Star, Eye, EyeOff, MoreHorizontal, Pencil, X } from "lucide-react";
import { AwardApi } from "../../api/awardApi";
import Toast from "../common/Toast";
import ConfirmModal from "../common/ConfirmModal";

export interface AwardItem {
	id: number;
	title: string;
	issuer: string;
	year: number;
	month: number;
	description?: string;
	isRepresentative?: boolean;
}

interface Props {
	item: AwardItem;
	onUpdated?: () => void;
	onEdit?: (item: AwardItem) => void;
}

const Tooltip: React.FC<{ label: string; children: React.ReactNode }> = ({ label, children }) => (
	<div className="relative group inline-flex">
		{children}
		<div className="pointer-events-none absolute -top-9 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-[#111827] text-white text-[12px] rounded py-1 px-2 whitespace-nowrap">
			{label}
			<div className="absolute left-1/2 -translate-x-1/2 top-full w-0 h-0 border-l-4 border-r-4 border-t-4 border-l-transparent border-r-transparent border-t-[#111827]" />
		</div>
	</div>
);

const AwardCard: React.FC<Props> = ({ item, onUpdated, onEdit }) => {
	const [menuOpen, setMenuOpen] = useState(false);
	const [isPrivate, setIsPrivate] = useState(false);
	const [errorToast, setErrorToast] = useState<{ visible: boolean; message: string }>({
		visible: false,
		message: ''
	});
	const [deleteConfirm, setDeleteConfirm] = useState<{ visible: boolean; commentId: number | null }>({
		visible: false,
		commentId: null
	});
    const textMuted = "text-[#9CA3AF] dark:text-white/40";
    const titleCls = `mt-4 text-[18px] font-medium ${isPrivate ? textMuted : "text-[#111827] dark:text-white"}`;
    const subCls = `text-[14px] ${isPrivate ? textMuted : "text-[#6B7280] dark:text-white/60"}`;
	const starCls = isPrivate ? textMuted : (item.isRepresentative ? "text-[#21B284] fill-[#21B284]" : "text-[#6B7280]");
	const period = `${item.year}년 ${parseInt(String(item.month), 10)}월 수상`;

	useEffect(() => {
		try {
			const v = localStorage.getItem(`privacy:award:${item.id}`);
			setIsPrivate(v === "1");
		} catch {}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [item.id]);

	const toggleRepresentative = async () => {
		if (isPrivate) return;
		try {
			await AwardApi.setRepresentative(item.id);
			onUpdated && onUpdated();
		} catch (e) {
			setErrorToast({
				visible: true,
				message: "대표 설정에 실패했습니다."
			});
		}
	};

	const onDeleteClick = () => {
		setDeleteConfirm({
			visible: true,
			commentId: item.id
		});
	};

	const onDeleteConfirm = async () => {
		try {
			await AwardApi.remove(item.id);
			onUpdated && onUpdated();
		} catch (e) {
			setErrorToast({
				visible: true,
				message: "삭제에 실패했습니다."
			});
		} finally {
			setDeleteConfirm({
				visible: false,
				commentId: null
			});
		}
	};

	const onDeleteCancel = () => {
		setDeleteConfirm({
			visible: false,
			commentId: null
		});
	};

	const onTogglePrivate = () => {
		setIsPrivate((prev) => {
			const next = !prev;
			try {
				if (next) localStorage.setItem(`privacy:award:${item.id}`, "1");
				else localStorage.removeItem(`privacy:award:${item.id}`);
				window.dispatchEvent(new CustomEvent("privacy-changed", { detail: { type: "AWARD", id: item.id, isPrivate: next } }));
			} catch {}
			return next;
		});
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
			<ConfirmModal
				visible={deleteConfirm.visible}
				title="수상 삭제"
				message="정말 삭제하시겠습니까?"
				confirmText="삭제"
				cancelText="취소"
				confirmButtonColor="red"
				onConfirm={onDeleteConfirm}
				onCancel={onDeleteCancel}
			/>
			<div className="w-full py-6">
			<div className="min-w-0">
				<div className="flex items-center justify-between">
					<div className={subCls}>{item.issuer}</div>
					<div className="relative shrink-0 flex items-center gap-4 ml-4">
						<Tooltip label="대표 설정">
							<button type="button" onClick={toggleRepresentative} className={`p-1 ${isPrivate ? "cursor-not-allowed" : "hover:opacity-80"}`} disabled={isPrivate}>
								<Star size={22} className={starCls} />
							</button>
						</Tooltip>
						<Tooltip label={isPrivate ? "수상 공개하기" : "수상 비공개하기"}>
							<button type="button" className="p-1 hover:opacity-80" onClick={onTogglePrivate}>
								{isPrivate ? <Eye size={22} className={textMuted} /> : <EyeOff size={22} className="text-[#6B7280]" />}
							</button>
						</Tooltip>
						<div className="relative" onMouseLeave={()=>setMenuOpen(false)}>
							<button type="button" onClick={()=>setMenuOpen(true)} className="p-1 hover:opacity-80">
								<MoreHorizontal size={22} className={isPrivate ? textMuted : "text-[#6B7280]"} />
							</button>
                            {menuOpen && (
                                <div className="absolute right-0 top-full mt-0 w-48 bg-white dark:bg-[var(--surface)] border border-[#E5E7EB] dark:border-[var(--border-color)] rounded-xl shadow-lg py-1 z-10">
                                    <button className="w-full flex items-center gap-2 px-3 h-10 hover:bg-[#F5F7FA] dark:hover:bg-white/5 text-[#111827] dark:text-white" onClick={()=>{ setMenuOpen(false); onEdit && onEdit(item); }}>
                                        <Pencil size={16} className="text-[#6B7280] dark:text-white/70" /> 수정하기
									</button>
                                    <button className="w-full flex items-center gap-2 px-3 h-10 hover:bg-[#F5F7FA] dark:hover:bg-white/5 text-[#EF4444]" onClick={()=>{ setMenuOpen(false); onDeleteClick(); }}>
										<X size={16} /> 삭제하기
									</button>
								</div>
							)}
						</div>
					</div>
				</div>
				<div className={titleCls}>{item.title}</div>
				<div className={`mt-2 ${subCls}`}>{period}</div>
				{item.description ? (
					<div className={`mt-4 text-[16px] ${isPrivate ? textMuted : "text-[#111827] dark:text-white"}`}>{item.description}</div>
				) : null}
			</div>
		</div>
		</>
	);
};

export default AwardCard; 