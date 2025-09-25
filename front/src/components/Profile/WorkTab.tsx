import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { dummyProjects } from "../../data/dummyProjects";
import type { Project } from "../../types/Project";
import { resolveCover, swapJpgPng } from "../../utils/getProjectCover";

const STORAGE_KEY = "profile_work_order";

const WorkTab: React.FC = () => {
	// 데모: 메인 페이지 더미 프로젝트 사용
	const baseProjects: Project[] = useMemo(() => dummyProjects.slice(0, 2), []);

	// 저장된 순서 적용
	const [projects, setProjects] = useState<Project[]>(() => {
		try {
			const raw = localStorage.getItem(STORAGE_KEY);
			if (!raw) return baseProjects;
			const order: number[] = JSON.parse(raw);
			const map = new Map(baseProjects.map(p => [p.id, p] as const));
			const ordered = order.map(id => map.get(id)).filter(Boolean) as Project[];
			const remaining = baseProjects.filter(p => !order.includes(p.id));
			return [...ordered, ...remaining];
		} catch {
			return baseProjects;
		}
	});

	// 드래그 정렬 모드
	const [isReorderMode, setIsReorderMode] = useState(false);
	const [order, setOrder] = useState<number[]>(() => projects.map(p => p.id));
	useEffect(() => { setOrder(projects.map(p => p.id)); }, [projects]);

	const onDragStart = (e: React.DragEvent<HTMLDivElement>, id: number) => {
		e.dataTransfer.setData("text/plain", String(id));
		e.dataTransfer.effectAllowed = "move";
	};
	const onDragOver = (e: React.DragEvent<HTMLDivElement>) => { e.preventDefault(); e.dataTransfer.dropEffect = "move"; };
	const onDrop = (e: React.DragEvent<HTMLDivElement>, targetId: number) => {
		e.preventDefault();
		const draggedId = Number(e.dataTransfer.getData("text/plain"));
		if (!draggedId || draggedId === targetId) return;
		setOrder(prev => {
			const next = prev.filter(x => x !== draggedId);
			let insertIndex = next.indexOf(targetId);
			const fromIdx = prev.indexOf(draggedId);
			const toIdx = prev.indexOf(targetId);
			if (fromIdx < toIdx) insertIndex += 1; // 아래로 이동 시 타겟 뒤에 삽입
			next.splice(insertIndex, 0, draggedId);
			return [...next];
		});
	};

	const handleApplyOrder = () => {
		const idToProject = new Map(projects.map(p => [p.id, p] as const));
		const next = order.map(id => idToProject.get(id)).filter(Boolean) as Project[];
		setProjects(next);
		localStorage.setItem(STORAGE_KEY, JSON.stringify(order));
		setIsReorderMode(false);
	};
	const handleCancelOrder = () => {
		setOrder(projects.map(p => p.id));
		setIsReorderMode(false);
	};

	if (projects.length === 0) {
		return (
			<div className="min-h-[360px] flex flex-col items-center justify-center text-center">
				<div className="mt-6 text-[16px] md:text-[18px] text-black/90">작업 시작이 어렵고 막막하신가요?</div>
				<div className="mt-2 text-[14px] md:text-[15px] text-black/70 leading-relaxed">
					커뮤니티에서 다른 창작자와 디자이너들에게 조언을 구하고
					<br />
					노트폴리오에서 즐거운 창작 생활을 시작해 보세요!
				</div>
				<div className="mt-6 flex items-center gap-3">
					<Link to="/community" className="h-[44px] px-5 rounded-[22px] bg-[#068334] text-white text-[14px] flex items-center">커뮤니티 바로가기</Link>
					<Link to="/project/sample" className="h-[44px] px-5 rounded-[22px] border border-black/20 text-[14px] flex items-center text-black">새로운 작업 업로드</Link>
				</div>
			</div>
		);
	}

	return (
		<div className="min-h-[360px]">
			{/* 헤더 액션 */}
			<div className="flex items-center justify-between mb-4">
				<h3 className="text-[15px] font-medium text-black/90">모든 작업 목록</h3>
				<div className="flex gap-2">
					{isReorderMode ? (
						<>
							<button className="h-[36px] px-4 rounded-[18px] border border-black/15 bg-white" onClick={handleCancelOrder}>취소</button>
							<button className="h-[36px] px-4 rounded-[18px] bg-[#11B8A5] text-white" onClick={handleApplyOrder}>변경 완료</button>
						</>
					) : (
						<button className="h-[36px] px-4 rounded-[18px] border border-black/15 bg-white" onClick={() => setIsReorderMode(true)}>작업 순서 변경</button>
					)}
				</div>
			</div>

			{/* 그리드 */}
			<div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
				{(isReorderMode ? order.map(id => projects.find(p => p.id === id)!).filter(Boolean) : projects).map((project, idx) => {
					const indexInList = isReorderMode ? order.indexOf(project.id) : idx;
					return (
						<ProjectCard
							key={project.id}
							project={project}
							indexInList={indexInList}
							isReorderMode={isReorderMode}
							onDragStart={onDragStart}
							onDragOver={onDragOver}
							onDrop={onDrop}
						/>
					);
				})}
			</div>
		</div>
	);
};

function ProjectCard({ project, indexInList, isReorderMode, onDragStart, onDragOver, onDrop }: {
	project: Project;
	indexInList: number;
	isReorderMode: boolean;
	onDragStart: (e: React.DragEvent<HTMLDivElement>, id: number) => void;
	onDragOver: (e: React.DragEvent<HTMLDivElement>) => void;
	onDrop: (e: React.DragEvent<HTMLDivElement>, id: number) => void;
}) {
	const [src, setSrc] = useState(() => {
		const cover = resolveCover(project, { position: indexInList });
		return cover ? cover : '';
	});
	const [triedAlt, setTriedAlt] = useState(false);
	useEffect(() => {
		const cover = resolveCover(project, { position: indexInList });
		setSrc(cover ? cover : '');
		setTriedAlt(false);
	}, [project, indexInList]);
	const onError = () => { if (!triedAlt) { setTriedAlt(true); setSrc(swapJpgPng(src)); } };

	return (
		<div
			className={`relative rounded-xl overflow-hidden ${isReorderMode ? "cursor-move" : "cursor-pointer"}`}
			{...(isReorderMode ? { draggable: true, onDragStart: (e: any) => onDragStart(e, project.id), onDragOver: (e: any) => onDragOver(e), onDrop: (e: any) => onDrop(e, project.id) } : {})}
		>
			<div className="relative w-full aspect-[4/3] bg-gray-200">
				<img src={src} alt={project.title ? project.title : ''} className="absolute inset-0 w-full h-full object-cover" onError={onError} />
				{isReorderMode && (
					<div className="absolute top-2 left-2 w-6 h-6 rounded-full bg-white shadow flex items-center justify-center text-[12px] font-medium text-black/80">
						{indexInList + 1}
					</div>
				)}
			</div>
		</div>
	);
}

export default WorkTab;
