import React, { useEffect, useState, useContext } from "react";
import { Link, useNavigate } from "react-router-dom";
// import { dummyProjects } from "../../data/dummyProjects";
import type { Project } from "../../types/Project";
import { resolveCover, swapJpgPng } from "../../utils/getProjectCover";
import { fetchUserProjects } from "../../api/projects";
import api from "../../api/axiosInstance";
import { deleteProject as apiDeleteProject } from "../../api/projectApi";
import ConfirmModal from "../common/ConfirmModal";
import Toast from "../common/Toast";
import { AuthContext } from "../../context/AuthContext";

const STORAGE_KEY = "profile_work_order";
const CACHE_KEY = "my_projects_cache_v1";

const WorkTab: React.FC = () => {
	// ✅ AuthContext에서 사용자 정보 가져오기
	const { email } = useContext(AuthContext);
	
	// 실제: 내 프로젝트 목록
	const [projects, setProjects] = useState<Project[]>([]);
	const [loading, setLoading] = useState<boolean>(true);
	const [confirm, setConfirm] = useState<{ visible: boolean; ownerId?: number; projectId?: number }>(() => ({ visible: false }));
	const [toast, setToast] = useState<{ visible: boolean; message: string; type: 'success' | 'error' | 'info' }>(() => ({ visible: false, message: '', type: 'success' }));

	useEffect(() => {
		let mounted = true;

		// ✅ 캐시 사용하지 않음 (로그인 시 캐시가 삭제되므로)
		// 바로 API 호출하여 현재 사용자의 프로젝트만 가져오기

		// 백그라운드 새로고침 (백엔드 사용자별 목록)
		(async () => {
			try {
				let myId = 0;
				try { myId = Number(localStorage.getItem("userId") || sessionStorage.getItem("userId") || '0'); } catch {}
				if (!myId) {
					try { const me = (await api.get<{ id: number }>("/users/me")).data; myId = me?.id || 0; } catch { myId = 0; }
				}
				if (!myId) { if (mounted) setLoading(false); return; }

				let page = 0;
				const size = 100;
				let last = false;
				const collected: Project[] = [];
				const MAX_PAGES = 10;

				while (!last && page < MAX_PAGES) {
					const res = await fetchUserProjects(myId, page, size);
					const pageItems = res.content || [];
					collected.push(...pageItems);
					last = !!res.last || (page >= (res.totalPages || 0) - 1);
					page += 1;
				}

				// 저장된 순서 적용 (있으면)
				let ordered: Project[] = collected;
				try {
					const rawOrder = localStorage.getItem(STORAGE_KEY);
					if (rawOrder) {
						const order: number[] = JSON.parse(rawOrder);
						const map = new Map(collected.map(p => [p.id, p] as const));
						const seq = order.map(id => map.get(id)).filter(Boolean) as Project[];
						const remaining = collected.filter(p => !order.includes(p.id));
						ordered = [...seq, ...remaining];
					}
				} catch {}

				// 캐시 저장
				try {
					localStorage.setItem(CACHE_KEY, JSON.stringify({ updatedAt: Date.now(), items: ordered }));
				} catch {}

				if (mounted) {
					setProjects(ordered);
					setLoading(false);
				}
			} catch {
				if (mounted) setLoading(false);
			}
		})();

		return () => { mounted = false; };
	}, [email]); // ✅ email이 변경될 때마다 다시 로드

	// 삭제 실행 핸들러 (모달 확인 시 호출)
	const handleConfirmDelete = async () => {
		const ownerId = confirm.ownerId;
		const projectId = confirm.projectId;
		if (!ownerId || !projectId) { setConfirm({ visible: false }); return; }
		try {
			await apiDeleteProject(ownerId, projectId);
			// 목록에서 제거
			setProjects(prev => prev.filter(p => p.id !== projectId));
			// 캐시도 업데이트
			try { localStorage.setItem(CACHE_KEY, JSON.stringify({ updatedAt: Date.now(), items: projects.filter(p => p.id !== projectId) })); } catch {}
			setToast({ visible: true, message: "프로젝트를 삭제했습니다.", type: 'success' });
		} catch (e) {
			setToast({ visible: true, message: "삭제에 실패했습니다.", type: 'error' });
		} finally {
			setConfirm({ visible: false });
			setTimeout(() => setToast(prev => ({ ...prev, visible: false })), 2500);
		}
	};

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
		// 캐시도 업데이트하여 다음 방문 때 즉시 반영
		try { localStorage.setItem(CACHE_KEY, JSON.stringify({ updatedAt: Date.now(), items: next })); } catch {}
		setIsReorderMode(false);
	};
	const handleCancelOrder = () => {
		setOrder(projects.map(p => p.id));
		setIsReorderMode(false);
	};

	if (loading && projects.length === 0) {
		return <div className="min-h-[360px] flex items-center justify-center text-black/60 dark:text-white/60">불러오는 중…</div>;
	}
	if (projects.length === 0) {
		return (
			<div className="min-h-[360px] flex flex-col items-center justify-center text-center">
				<div className="mt-6 text-[16px] md:text-[18px] text-black/80 dark:text-white/80">등록된 작업이 없습니다.</div>
			</div>
		);
	}

	return (
		<div className="min-h-[360px]">
			{/* 헤더 액션 */}
            <div className="flex items-center justify-end mb-4 mt-6">
                <div className="flex gap-2">
					{isReorderMode ? (
						<>
                            <button className="h-[36px] px-4 rounded-[18px] border border-black/15 dark:border-[var(--border-color)] bg-white dark:bg-[var(--surface)] text-black dark:text-white" onClick={handleCancelOrder}>취소</button>
                            <button className="h-[36px] px-4 rounded-[18px] bg-[#11B8A5] text-white" onClick={handleApplyOrder}>변경 완료</button>
						</>
					) : (
                        <button className="h-[36px] px-4 rounded-[18px] border border-black/15 dark:border-[var(--border-color)] bg-white dark:bg-[var(--surface)] text-black dark:text-white" onClick={() => setIsReorderMode(true)}>작업 순서 변경</button>
					)}
				</div>
			</div>

			{/* 삭제 확인 모달 */}
			<ConfirmModal
				visible={confirm.visible}
				title="삭제하기"
				message="정말 이 프로젝트를 삭제할까요? 이 작업은 되돌릴 수 없습니다."
				confirmText="삭제"
				cancelText="취소"
				confirmButtonColor="red"
				onConfirm={handleConfirmDelete}
				onCancel={() => setConfirm({ visible: false })}
			/>
			{/* 삭제 완료 토스트 */}
			<Toast visible={toast.visible} message={toast.message} type={toast.type} size="medium" autoClose={2000} closable={true} onClose={() => setToast(prev => ({ ...prev, visible: false }))} />

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
							// 삭제 요청 모달 열기
							onRequestDelete={(ownerId: number, projectId: number) => setConfirm({ visible: true, ownerId, projectId })}
						/>
					);
				})}
			</div>
		</div>
	);
};

function ProjectCard({ project, indexInList, isReorderMode, onDragStart, onDragOver, onDrop, onRequestDelete }: {
	project: Project;
	indexInList: number;
	isReorderMode: boolean;
	onDragStart: (e: React.DragEvent<HTMLDivElement>, id: number) => void;
	onDragOver: (e: React.DragEvent<HTMLDivElement>) => void;
	onDrop: (e: React.DragEvent<HTMLDivElement>, id: number) => void;
	onRequestDelete: (ownerId: number, projectId: number) => void;
}) {
	const [menuOpen, setMenuOpen] = useState(false);
	const navigate = useNavigate();
	const [src, setSrc] = useState(() => {
		const cover = (project as any).coverUrl || resolveCover(project, { position: indexInList });
		return cover ? cover : '';
	});
	const [triedAlt, setTriedAlt] = useState(false);
	useEffect(() => {
		const cover = (project as any).coverUrl || resolveCover(project, { position: indexInList });
		setSrc(cover ? cover : '');
		setTriedAlt(false);
	}, [project, indexInList]);
	const onError = () => { if (!triedAlt) { setTriedAlt(true); setSrc(swapJpgPng(src)); } };

	const ownerId = (project as any).owner?.id || (project as any).authorId;
	const goDetail = () => navigate(`/other-project/${ownerId}/${project.id}`);
	const goEdit = () => navigate(`/project/edit/${ownerId}/${project.id}`);

	return (
		<div
			className={`relative rounded-xl overflow-hidden ${isReorderMode ? "cursor-move" : "cursor-pointer"}`}
			{...(isReorderMode ? { draggable: true, onDragStart: (e: any) => onDragStart(e, project.id), onDragOver: (e: any) => onDragOver(e), onDrop: (e: any) => onDrop(e, project.id) } : { onClick: goDetail })}
		>
			<div className="relative w-full aspect-[4/3] bg-gray-200 group" onMouseLeave={() => setMenuOpen(false)}>
				<img src={src} alt={project.title ? project.title : ''} className="absolute inset-0 w-full h-full object-cover" onError={onError} />
				{/* 하단 좌측 제목 오버레이 */}
				<div className="absolute inset-0 bg-gradient-to-t from-black/40 via-black/0 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
				<div className="absolute left-2 bottom-2 text-white text-sm font-semibold opacity-0 group-hover:opacity-100 transition-opacity line-clamp-1">
					{(project as any).title || ''}
				</div>
				{/* 좌상단 점3 메뉴 버튼 (호버 시 표시) */}
                <button type="button" className={`absolute ${isReorderMode ? 'top-2 right-2' : 'top-2 left-2'} w-8 h-8 rounded-full bg-white/90 text-black text-xl flex items-center justify-center shadow ring-1 ring-white/80 opacity-0 group-hover:opacity-100 transition-opacity`} onClick={(e) => { e.stopPropagation(); setMenuOpen(v => !v); }}>
					···
				</button>
                {menuOpen && (
                    <div className={`absolute ${isReorderMode ? 'top-12 right-2' : 'top-12 left-2'} bg-white dark:bg-[var(--surface)] rounded-md shadow-lg border border-black/10 dark:border-[var(--border-color)] overflow-hidden z-10`} onClick={(e) => e.stopPropagation()} onMouseLeave={() => setMenuOpen(false)}>
                        <button className="px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-white/5 w-full text-left text-black dark:text-white" onClick={goEdit}>수정하기</button>
                        <button className="px-4 py-2 text-sm text-red-600 hover:bg-gray-100 dark:hover:bg-white/5 w-full text-left" onClick={() => onRequestDelete(ownerId, (project as any).id)}>삭제하기</button>
					</div>
				)}
                {isReorderMode && (
                    <div className="absolute top-2 left-2 w-6 h-6 rounded-full bg-white dark:bg-[var(--surface)] shadow flex items-center justify-center text-[12px] font-medium text-black/80 dark:text-white">
						{indexInList + 1}
					</div>
				)}
			</div>
		</div>
	);
}

export default WorkTab;
