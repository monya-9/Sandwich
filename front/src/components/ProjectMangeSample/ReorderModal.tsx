import React, { useEffect, useState } from "react";
import { RiText } from "react-icons/ri";
import { FaImage } from "react-icons/fa";
import { IoMdVideocam } from "react-icons/io";

type Block = { id: string; type: 'text' | 'image' | 'video'; html: string; text?: string };

type Props = {
	open: boolean;
	blocks: Block[];
	onConfirm: (ids: string[]) => void;
	onClose: () => void;
};

export default function ReorderModal({ open, blocks, onConfirm, onClose }: Props) {
	const [order, setOrder] = useState(blocks.map(i => i.id));
	useEffect(() => { setOrder(blocks.map(i => i.id)); }, [blocks]);
	if (!open) return null;
	const onDragStart = (e: React.DragEvent<HTMLDivElement>, id: string) => {
		e.dataTransfer.setData('text/plain', id);
		e.dataTransfer.effectAllowed = 'move';
	};
	const onDragOver = (e: React.DragEvent<HTMLDivElement>) => { e.preventDefault(); e.dataTransfer.dropEffect = 'move'; };
	const onDrop = (e: React.DragEvent<HTMLDivElement>, targetId: string) => {
		e.preventDefault();
		const draggedId = e.dataTransfer.getData('text/plain');
		if (!draggedId || draggedId === targetId) return;
		const fromIdx = order.indexOf(draggedId);
		const toIdx = order.indexOf(targetId);
		const next = order.filter(i => i !== draggedId);
		let insertIndex = next.indexOf(targetId);
		if (fromIdx < toIdx) insertIndex += 1;
		next.splice(insertIndex, 0, draggedId);
		setOrder(next);
	};
	const removeFromOrder = (id: string) => { setOrder(prev => prev.filter(x => x !== id)); };
	const needsScroll = order.length >= 3;
	return (
		<div className="fixed inset-0 z-[9999] flex items-center justify-center">
			<div className="absolute inset-0 bg-black/40" onClick={onClose} />
			<div className="relative bg-white w-[650px] max-w-[95%] rounded-xl shadow-xl max-h-[90vh] overflow-auto">
				<div className="px-6 py-4 border-b text-[18px] font-semibold">콘텐츠 재정렬</div>
				<div className="p-6">
					<p className="text-sm text-gray-600 mb-3">마우스 드래그로 콘텐츠 순서를 변경하거나 삭제할 수 있습니다.</p>
					<div className={needsScroll ? "flex flex-col gap-2 mb-5 max-h-[50vh] overflow-auto pr-1" : "flex flex-col gap-2 mb-5"}>
						{order.map(id => {
							const item = blocks.find(i => i && i.id === id);
							if (!item) return null;
							return (
								<div key={id}
									className="flex items-center gap-3 border rounded-lg px-3 py-3 bg-white select-none"
									draggable
									onDragStart={(e) => onDragStart(e, id)}
									onDragOver={onDragOver}
									onDrop={(e) => onDrop(e, id)}>
									<span className="cursor-move text-lg">≡</span>
									<span className="w-8 h-8 flex items-center justify-center rounded-md bg-gray-100">{item.type === 'text' ? <RiText className="text-[18px]" /> : item.type === 'image' ? <FaImage className="text-[18px]" /> : <IoMdVideocam className="text-[18px]" />}</span>
									<span className="text-[15px] flex-1">{item.type === 'text' ? (item.text ? (item.text.slice(0, 20) + ((item.text.length > 20) ? "…" : "")) : "텍스트") : item.type === 'image' ? "이미지" : "동영상"}</span>
									<button className="h-8 px-3 rounded-md border border-gray-300 hover:bg-gray-50" onClick={() => removeFromOrder(id)} type="button">삭제</button>
								</div>
							);
						})}
					</div>
					<div className="flex justify-end gap-2 border-t pt-4">
						<button className="h-10 px-5 rounded-md border border-gray-300 hover:bg-gray-50" onClick={onClose}>취소</button>
						<button className="h-10 px-5 rounded-md bg-black text-white" onClick={() => onConfirm(order)}>완료</button>
					</div>
				</div>
			</div>
		</div>
	);
} 