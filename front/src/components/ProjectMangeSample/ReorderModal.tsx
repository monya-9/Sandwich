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

// Extract first <img> src from given HTML
function extractFirstImageSrc(html: string): string | null {
	try {
		const div = document.createElement('div');
		div.innerHTML = html;
		const img = div.querySelector('img');
		return (img && (img.getAttribute('src') || img.getAttribute('data-src'))) || null;
	} catch { return null; }
}

// Extract first <iframe> src from given HTML
function extractFirstIframeSrc(html: string): string | null {
	try {
		const div = document.createElement('div');
		div.innerHTML = html;
		const iframe = div.querySelector('iframe');
		return iframe?.getAttribute('src') || null;
	} catch { return null; }
}

// Derive a thumbnail URL for common video providers (YouTube/Vimeo). Returns null if unknown.
function deriveVideoThumb(src: string | null): string | null {
	if (!src) return null;
	try {
		// YouTube
		let m = src.match(/(?:youtube\.com\/embed\/|youtu\.be\/)([A-Za-z0-9_-]{6,})/);
		if (!m) m = src.match(/[?&]v=([A-Za-z0-9_-]{6,})/);
		if (m && m[1]) return `https://img.youtube.com/vi/${m[1]}/hqdefault.jpg`;
		// Vimeo
		const v = src.match(/player\.vimeo\.com\/video\/(\d+)/);
		if (v && v[1]) return `https://vumbnail.com/${v[1]}.jpg`;
		return null;
	} catch { return null; }
}

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
							// Build previews
							const imgSrc = item.type === 'image' ? extractFirstImageSrc(item.html) : null;
							const vidThumb = item.type === 'video' ? deriveVideoThumb(extractFirstIframeSrc(item.html)) : null;
							return (
								<div key={id}
									className="flex items-center gap-3 border rounded-lg px-3 py-3 bg-white select-none"
									draggable
									onDragStart={(e) => onDragStart(e, id)}
									onDragOver={onDragOver}
									onDrop={(e) => onDrop(e, id)}>
									<span className="cursor-move text-lg">≡</span>
									{item.type === 'text' && (
										<div className="relative w-[72px] h-[56px]">
											<div className="w-full h-full rounded object-cover bg-gray-100 border border-gray-200 flex items-center justify-center">
												<RiText className="w-5 h-5 text-gray-600" />
											</div>
										</div>
									)}
									{item.type === 'image' && (
										imgSrc ? (
											<img src={imgSrc} alt="이미지 미리보기" className="w-[72px] h-[56px] rounded object-cover bg-gray-100" />
										) : (
											<span className="w-[72px] h-[56px] flex items-center justify-center rounded-md bg-gray-100 text-gray-500"><FaImage className="text-[18px]" /></span>
										)
									)}
									{item.type === 'video' && (
										vidThumb ? (
											<div className="relative w-[72px] h-[56px]">
												<img src={vidThumb} alt="동영상 썸네일" className="w-full h-full rounded object-cover bg-gray-100" />
												<span className="absolute inset-0 flex items-center justify-center text-white/95"><IoMdVideocam className="w-5 h-5 drop-shadow" /></span>
											</div>
										) : (
											<span className="w-[72px] h-[56px] flex items-center justify-center rounded-md bg-gray-100 text-gray-500"><IoMdVideocam className="text-[18px]" /></span>
										)
									)}
									<span className="text-[15px] flex-1 flex items-center gap-2 min-w-0">
										<span className="text-gray-700 whitespace-nowrap text-[14px] font-medium">
											{item.type === 'text' ? '텍스트' : item.type === 'image' ? '이미지' : '동영상'}
										</span>
										<span className="text-gray-500 truncate">
											{item.type === 'text' ? (item.text ? (item.text.slice(0, 30) + ((item.text.length > 30) ? '…' : '')) : '') : ''}
										</span>
									</span>
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