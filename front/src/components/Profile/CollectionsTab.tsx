import React, { useEffect, useState } from "react";
import { FiPlus } from "react-icons/fi";
import ReactDOM from "react-dom";
import { X } from "lucide-react";
// import Modal from "../common/modal/Modal"; // 기본 모달 사용 제거
import { createCollectionFolder, listMyCollectionFolders, type CollectionFolder, updateCollectionFolder, deleteCollectionFolder, getCollectionFolder } from "../../api/collections";
import ConfirmModal from "../common/ConfirmModal";
import Toast from "../common/Toast";
import { useNavigate } from "react-router-dom";
import { Lock } from "lucide-react";

const CollectionsTab: React.FC = () => {
	const [open, setOpen] = useState(false);
	const [name, setName] = useState("");
	const [desc, setDesc] = useState("");
	const [isPrivate, setIsPrivate] = useState(false);
	const [banner, setBanner] = useState<string | null>(null);
	const [saving, setSaving] = useState(false);
	const [folders, setFolders] = useState<CollectionFolder[]>([]);
	const [loading, setLoading] = useState(true);
	const [menuOpenId, setMenuOpenId] = useState<number | null>(null);
	const [editingId, setEditingId] = useState<number | null>(null);
	const [confirmOpen, setConfirmOpen] = useState(false);
	const [confirmId, setConfirmId] = useState<number | null>(null);
	const [coverByFolderId, setCoverByFolderId] = useState<Record<number, string>>({});
	const [coversByFolderId, setCoversByFolderId] = useState<Record<number, string[]>>({});
	const [cachedCovers, setCachedCovers] = useState<Record<number, string[]>>(() => {
		try { const raw = localStorage.getItem("collectionFolderThumbs"); return raw ? JSON.parse(raw) : {}; } catch { return {}; }
	});
	const navigate = useNavigate();

	const resetAndClose = () => { setOpen(false); setTimeout(() => { setEditingId(null); setName(""); setDesc(""); setIsPrivate(false); }, 150); };

	const loadCoversFor = async (list: CollectionFolder[]) => {
		const ids = list.map(f => f.id).filter(Boolean) as number[];
		if (ids.length === 0) return;
		try {
			// 0) 캐시 먼저 즉시 반영
			setCoversByFolderId(prev => ({ ...ids.reduce((acc, id) => ({ ...acc, [id]: cachedCovers[id] || [] }), {}), ...prev }));
			const results = await Promise.allSettled(ids.map(id => getCollectionFolder(id) as any));
			const nextCover: Record<number, string> = {};
			const nextCovers: Record<number, string[]> = {};
			const nextCounts: Record<number, number> = {};
			results.forEach((r, idx) => {
				if (r.status === "fulfilled") {
					const detail: any = r.value;
					let projects: any[] = Array.isArray(detail?.projects) ? detail.projects : [];
					// 최신 등록 순으로 정렬(가정: 오래→최신이면 reverse)
					if (projects.length > 1) {
						projects = projects.slice().reverse();
					}
					const first = projects[0] || null;
					nextCover[ids[idx]] = first?.thumbnailUrl || "";
					nextCovers[ids[idx]] = projects.slice(0,4).map(p => p.thumbnailUrl).filter(Boolean);
					nextCounts[ids[idx]] = projects.length;
				}
			});
			setCoverByFolderId(prev => ({ ...prev, ...nextCover }));
			setCoversByFolderId(prev => ({ ...prev, ...nextCovers }));
			setFolders(prev => prev.map(f => (nextCounts[f.id] !== undefined ? { ...f, itemCount: nextCounts[f.id] } : f)) as any);
			try { localStorage.setItem("collectionFolderThumbs", JSON.stringify(nextCovers)); } catch {}
		} catch {}
	};

	const normalizeFolders = (data: any[]): CollectionFolder[] => {
		return (Array.isArray(data) ? data : []).map((f: any) => ({
			...f,
			private: !!(f?.private ?? f?.isPrivate),
		}));
	};

	const loadFolders = async () => {
		try {
			setLoading(true);
			const data = await listMyCollectionFolders();
			const normalized = normalizeFolders(Array.isArray(data) ? data : []);
			setFolders(normalized);
			await loadCoversFor(normalized);
		} catch {
			setFolders([]);
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => { loadFolders(); }, []);

	// 외부에서 저장 이벤트 발생 시 해당 폴더의 커버/카운트 새로고침
	useEffect(() => {
		const handler = (e: any) => {
			const { folderId } = (e?.detail || {}) as { folderId?: number };
			if (!folderId) return;
			// 카운트만 먼저 낙관적 갱신
			setFolders(prev => prev.map(f => f.id === folderId ? { ...f, itemCount: (f.itemCount || 0) + 1 } : f));
			// 커버 새로고침
			getCollectionFolder(folderId).then((detail: any) => {
				const first = Array.isArray(detail?.projects) ? detail.projects[0] : null;
				setCoverByFolderId(prev => ({ ...prev, [folderId]: first?.thumbnailUrl || prev[folderId] || "" }));
			}).catch(() => {});
		};
		window.addEventListener("collection:item-saved", handler as any);
		return () => window.removeEventListener("collection:item-saved", handler as any);
	}, []);

	const onSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		if (!name.trim() || saving) return;
		try {
			setSaving(true);
			if (editingId) {
				await updateCollectionFolder(editingId, { title: name.trim(), description: desc.trim(), private: isPrivate });
			} else {
				await createCollectionFolder({ title: name.trim(), description: desc.trim(), private: isPrivate });
			}
			resetAndClose();
			setBanner("컬렉션 폴더가 저장되었습니다.");
			loadFolders();
			setTimeout(() => setBanner(null), 2500);
		} catch (err) {
			setBanner("처리 중 오류가 발생했습니다.");
			setTimeout(() => setBanner(null), 2500);
		} finally {
			setSaving(false);
		}
	};

	const onEdit = async (id: number) => {
		try {
			const f = await getCollectionFolder(id);
			setEditingId(id);
			setName((f as any).title || "");
			setDesc((f as any).description || "");
			setIsPrivate(!!(((f as any)?.private) ?? ((f as any)?.isPrivate)));
			setOpen(true);
		} catch {
			setBanner("폴더 정보를 불러오지 못했습니다."); setTimeout(() => setBanner(null), 2500);
		}
	};

	const askDelete = (id: number) => { setConfirmId(id); setConfirmOpen(true); };
	const performDelete = async () => {
		const id = confirmId; setConfirmOpen(false); setConfirmId(null);
		if (!id) return;
		try {
			await deleteCollectionFolder(id);
			setBanner("컬렉션 폴더가 삭제되었습니다.");
			loadFolders();
			setTimeout(() => setBanner(null), 2500);
		} catch {
			setBanner("삭제 중 오류가 발생했습니다."); setTimeout(() => setBanner(null), 2500);
		}
	};

	return (
		<div className="min-h-[360px] flex items-start justify-center text-center">
			<div className="w-full">
				<Toast visible={!!banner} message={banner || ""} type="success" size="medium" autoClose={2500} closable={true} onClose={() => setBanner(null)} />
				{/* 상단 안내 박스 */}
				<button
					onClick={() => { setEditingId(null); setOpen(true); }}
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

				{/* 리스트: 프로젝트 카드 크기와 동일한 그리드/카드 구조 */}
				<div className="mt-6 grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 text-left">
					{loading ? (
						<div className="text-[13px] text-black/50 col-span-full text-center py-10">불러오는 중…</div>
					) : folders.length === 0 ? (
						<div className="text-[13px] text-black/50 col-span-full text-center py-10">등록된 컬렉션이 없습니다.</div>
					) : (
						folders.map((f) => (
							<div key={f.id}>
								<div className="relative rounded-xl overflow-hidden cursor-pointer group" onMouseLeave={() => setMenuOpenId(null)} onClick={() => navigate(`/collections/${f.id}`)}>
									<div className="relative w-full aspect-[4/3] bg-gray-200">
										{/* 2x2 프리뷰: 최대 4개 */}
										<div className="absolute inset-0">
											{coversByFolderId[f.id]?.[0] && (
												<div className="absolute left-0 top-0 w-1/2 h-1/2 overflow-hidden">
													<img src={coversByFolderId[f.id][0]} alt="thumb1" className="w-full h-full object-cover" />
												</div>
											)}
											{coversByFolderId[f.id]?.[1] && (
												<div className="absolute left-1/2 top-0 w-1/2 h-1/2 overflow-hidden">
													<img src={coversByFolderId[f.id][1]} alt="thumb2" className="w-full h-full object-cover" />
												</div>
											)}
											{coversByFolderId[f.id]?.[2] && (
												<div className="absolute left-0 top-1/2 w-1/2 h-1/2 overflow-hidden">
													<img src={coversByFolderId[f.id][2]} alt="thumb3" className="w-full h-full object-cover" />
												</div>
											)}
											{coversByFolderId[f.id]?.[3] && (
												<div className="absolute left-1/2 top-1/2 w-1/2 h-1/2 overflow-hidden">
													<img src={coversByFolderId[f.id][3]} alt="thumb4" className="w-full h-full object-cover" />
												</div>
											)}
											{/* 중앙 구분선 */}
											{(coversByFolderId[f.id]?.length ?? 0) > 0 && (
												<>
													<div className="pointer-events-none absolute left-1/2 top-0 -translate-x-1/2 w-[2px] h-full bg-white/90" />
													<div className="pointer-events-none absolute left-0 top-1/2 -translate-y-1/2 w-full h-[2px] bg-white/90" />
												</>
											)}
										</div>
									</div>
									{/* 하단 그라데이션 오버레이 */}
									<div className="absolute inset-0 bg-gradient-to-t from-black/40 via-black/0 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
									{/* 좌상단 점3 메뉴 버튼 */}
									<button
										className="absolute top-2 left-2 w-8 h-8 rounded-full bg-white/90 text-black text-xl flex items-center justify-center shadow opacity-0 group-hover:opacity-100 transition-opacity"
										onClick={(e) => { e.stopPropagation(); setMenuOpenId(v => v === f.id ? null : f.id); }}
										aria-label="폴더 메뉴"
									>
										···
									</button>
									{menuOpenId === f.id && (
										<div className="absolute top-12 left-2 bg-white rounded-md shadow-lg border border-black/10 overflow-hidden z-10" onClick={(e) => e.stopPropagation()}>
											<button className="px-4 py-2 text-sm hover:bg-gray-100 w-full text-left" onClick={() => onEdit(f.id)}>수정하기</button>
											<button className="px-4 py-2 text-sm text-red-600 hover:bg-gray-100 w-full text-left" onClick={() => askDelete(f.id)}>삭제하기</button>
										</div>
									)}
								</div>
								<div className="mt-2 px-1">
									<div className="text-[15px] font-medium line-clamp-1">{f.title || "이름 없음"}</div>
									<div className="text-[12px] text-black/50 inline-flex items-center gap-1">총 {(f.itemCount ?? 0)}개의 작업  |  {f.private ? (<><Lock className="w-3 h-3" /> 비공개 컬렉션</>) : "공개 컬렉션"}</div>
								</div>
							</div>
					))
					)}
				</div>

				{/* 커스텀 포털 모달: OtherProject와 동일 스타일 */}
				{open && ReactDOM.createPortal(
					<div className="fixed inset-0 z-[20050] flex items-center justify-center p-4">
						<div className="absolute inset-0 bg-[rgba(0,0,0,0.55)]" onClick={resetAndClose} />
						<div className="relative z-[20051] w-full max-w-[500px] rounded-[12px] bg-white shadow-2xl">
							<div className="flex items-center justify-between px-6 h-14 border-b border-black/10">
								<div className="text-[16px] font-semibold">{editingId ? "컬렉션 폴더 수정하기" : "컬렉션 폴더 만들기"}</div>
								<button aria-label="닫기" onClick={resetAndClose} className="p-2 rounded-md hover:bg-neutral-100">
									<X className="w-4 h-4" />
								</button>
							</div>
							<form onSubmit={onSubmit} className="px-6 py-4 space-y-4 max-h-[70vh] min-h-[420px] overflow-y-auto">
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
									<button type="submit" className="h-10 px-5 rounded-md bg-[#068334] text-white hover:bg-[#05702C] disabled:opacity-50" disabled={!name.trim() || saving}>{saving ? "저장 중..." : (editingId ? "완료" : "확인")}</button>
								</div>
							</form>
						</div>
					</div>,
					document.body
				)}

				<ConfirmModal
					visible={confirmOpen}
					title="삭제 확인"
					message="이 컬렉션 폴더를 삭제하시겠습니까?"
					confirmText="삭제"
					cancelText="취소"
					confirmButtonColor="red"
					onConfirm={performDelete}
					onCancel={() => setConfirmOpen(false)}
				/>
			</div>
		</div>
	);
};

export default CollectionsTab;
