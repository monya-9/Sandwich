import React, { useState } from "react";
import { FiPlus } from "react-icons/fi";
import Modal from "../common/modal/Modal";

const CollectionsTab: React.FC = () => {
	const [open, setOpen] = useState(false);
	const [name, setName] = useState("");
	const [desc, setDesc] = useState("");
	const [isPrivate, setIsPrivate] = useState(false);

	const resetAndClose = () => { setOpen(false); setTimeout(() => { setName(""); setDesc(""); setIsPrivate(false); }, 150); };
	const onSubmit = (e: React.FormEvent) => { e.preventDefault(); /* TODO: API 연동 */ resetAndClose(); };

	return (
		<div className="min-h-[360px] flex items-start justify-center text-center">
			<div className="w-full">
				{/* 상단 안내 박스 */}
				<button
					onClick={() => setOpen(true)}
					className="mt-6 w-full rounded-[8px] border border-dashed border-[#D1D5DB] bg-[#F8FAFB] px-6 py-8 text-black/80 hover:bg-[#F3F6F8]"
				>
					<div className="flex flex-col items-center gap-2">
						<div className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-[#E8F7EE]">
							<FiPlus className="text-[#068334]" />
						</div>
						<div className="text-[14px] md:text-[15px] font-medium">컬렉션 폴더 추가</div>
						<div className="text-[12px] md:text-[13px] text-black/60">마음에 드는 작업을 개인별로 분류하여 저장해보세요.</div>
					</div>
				</button>

				{/* 리스트: 초기엔 비어 있음(더미 제거) */}
				<div className="mt-6 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 text-left">
					<div className="text-[13px] text-black/50 col-span-full text-center py-10">등록된 컬렉션이 없습니다.</div>
				</div>

				<Modal open={open} onClose={resetAndClose} widthClass="w-[500px]" paddingClass="p-6 bg-white rounded-[12px] shadow-xl" heightClass="min-h-[00px]">
					<div className="text-left">
						<div className="text-[18px] font-semibold mb-4">컬렉션 폴더 만들기</div>
						<form onSubmit={onSubmit} className="space-y-4">
							<div>
								<label className="block text-[13px] text-black/70 mb-1">컬렉션 이름</label>
								<input value={name} onChange={(e) => setName(e.target.value.slice(0,30))} placeholder="이름을 입력해주세요 (최대 30자)" className="w-full h-[44px] rounded-md border border-[#D1D5DB] px-3 text-[14px] bg-white" />
							</div>
							<div>
								<label className="block text-[13px] text-black/70 mb-1">컬렉션 소개</label>
								<textarea value={desc} onChange={(e) => setDesc(e.target.value.slice(0,1000))} placeholder="소개를 입력해주세요. (최대 1000자)" className="w-full min-h-[120px] rounded-md border border-[#D1D5DB] px-3 py-2 text-[14px] bg-white resize-y" />
							</div>
							<label className="inline-flex items-center gap-2 text-[13px] text-black/80">
								<input type="checkbox" checked={isPrivate} onChange={(e)=>setIsPrivate(e.target.checked)} />
								<span>이 폴더를 비공개로 설정</span>
							</label>
							<div className="flex items-center justify-end gap-2 pt-2">
								<button type="button" className="h-10 px-4 rounded-md bg-white border border-[#D1D5DB] text-black/70 hover:bg-neutral-50" onClick={resetAndClose}>취소</button>
								<button type="submit" className="h-10 px-5 rounded-md bg-[#068334] text-white hover:bg-[#05702C] disabled:opacity-50" disabled={!name.trim()}>확인</button>
							</div>
						</form>
					</div>
				</Modal>
			</div>
		</div>
	);
};

export default CollectionsTab;
