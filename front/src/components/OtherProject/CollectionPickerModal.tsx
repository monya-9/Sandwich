import React, { useEffect, useState } from "react";
import ReactDOM from "react-dom";
import { X } from "lucide-react";
import { listMyCollectionFolders, type CollectionFolder, createCollectionFolder, addProjectToCollections, getCollectionFolder, removeProjectFromCollection } from "../../api/collections";
import Toast from "../common/Toast";

interface Props {
  open: boolean;
  onClose: () => void;
  onCreateFolder?: () => void; // 호환성 유지
  projectId?: number; // 저장 대상 프로젝트 ID
  initialSelectedIds?: number[]; // 이미 포함된 폴더
  onAfterChange?: (selectedFolderIds: number[]) => void; // 저장/제외 후 콜백
}

export default function CollectionPickerModal({ open, onClose, projectId, initialSelectedIds = [], onAfterChange }: Props) {
  const [loading, setLoading] = useState(false);
  const [folders, setFolders] = useState<CollectionFolder[]>([]);
  const [createOpen, setCreateOpen] = useState(false);
  const [banner, setBanner] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set(initialSelectedIds));
  const [hoveredId, setHoveredId] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [countsById, setCountsById] = useState<Record<number, number>>({});
  const [latestThumbById, setLatestThumbById] = useState<Record<number, string>>({});

  useEffect(() => { setSelectedIds(new Set(initialSelectedIds)); }, [initialSelectedIds, open]);

  useEffect(() => {
    if (!open) return;
    let mounted = true;
    (async () => {
      try {
        setLoading(true);
        const data = await listMyCollectionFolders();
        if (!mounted) return;
        setFolders(data || []);
        await loadDetails(data || []);
      } catch {
        if (mounted) setFolders([]);
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, [open]);

  const pickLatestThumb = (projects: any[]) => {
    if (!projects || projects.length === 0) return "";
    const lastIdx = projects.length - 1;
    return projects[lastIdx]?.thumbnailUrl || "";
  };

  const loadDetails = async (list: CollectionFolder[]) => {
    const ids = list.map(f => f.id).filter(Boolean) as number[];
    if (ids.length === 0) return;
    try {
      const results = await Promise.allSettled(ids.map(id => getCollectionFolder(id) as any));
      const nextCounts: Record<number, number> = {};
      const nextThumb: Record<number, string> = {};
      results.forEach((r, idx) => {
        if (r.status === "fulfilled") {
          const detail: any = r.value;
          const projects: any[] = Array.isArray(detail?.projects) ? detail.projects : [];
          nextCounts[ids[idx]] = projects.length;
          nextThumb[ids[idx]] = pickLatestThumb(projects);
        }
      });
      setCountsById(prev => ({ ...prev, ...nextCounts }));
      setLatestThumbById(prev => ({ ...prev, ...nextThumb }));
    } catch {}
  };

  useEffect(() => {
    const onEsc = (e: KeyboardEvent) => e.key === "Escape" && (createOpen ? setCreateOpen(false) : onClose());
    if (open) document.addEventListener("keydown", onEsc);
    return () => document.removeEventListener("keydown", onEsc);
  }, [open, onClose, createOpen]);

  const openCreate = () => setCreateOpen(true);
  const closeCreate = () => setCreateOpen(false);

  const refreshFolders = async () => {
    try {
      setLoading(true);
      const data = await listMyCollectionFolders();
      setFolders(data || []);
      await loadDetails(data || []);
    } catch {
      setFolders([]);
    } finally {
      setLoading(false);
    }
  };

  const toggleSelect = (id: number) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  // 변경 여부가 있는지 판단 (추가 또는 제거 모두 포함)
  const hasChanges = (() => {
    const orig = new Set(initialSelectedIds);
    // 크기만으로도 변화 감지 가능 (모두 해제 등)
    if (orig.size !== selectedIds.size) return true;
    // 원래 없던 선택이 생겼거나, 원래 있던 선택이 사라진 경우
    for (const id of Array.from(selectedIds)) if (!orig.has(id)) return true;
    for (const id of initialSelectedIds) if (!selectedIds.has(id)) return true;
    return false;
  })();
  const canSave = !!projectId && !saving && hasChanges;

  const performSave = async () => {
    if (!projectId || saving) return;
    const folderIds = Array.from(selectedIds);
    try {
      setSaving(true);
      // 1) 추가/제외 계산
      const allIds = folders.map(f => f.id);
      const originally = new Set(initialSelectedIds);
      const toAdd: number[] = folderIds.filter(id => !originally.has(id));
      const toRemove: number[] = allIds.filter(id => originally.has(id) && !folderIds.includes(id));

      if (toAdd.length > 0) await addProjectToCollections(projectId, toAdd);
      if (toRemove.length > 0) await Promise.all(toRemove.map(fid => removeProjectFromCollection(projectId, fid)));

      // 2) 상세 재조회로 수/썸네일 최신화
      await Promise.all(allIds.map(async (fid) => {
        try {
          const d: any = await getCollectionFolder(fid);
          const projects: any[] = Array.isArray(d?.projects) ? d.projects : [];
          setCountsById(prev => ({ ...prev, [fid]: projects.length }));
          setLatestThumbById(prev => ({ ...prev, [fid]: pickLatestThumb(projects) }));
        } catch {}
      }));

      // 3) 토스트는 닫힌 뒤 뜨도록 예약
      let msg = "컬렉션이 업데이트되었습니다.";
      if (toAdd.length > 0 && toRemove.length === 0) msg = "컬렉션에 저장했습니다.";
      if (toRemove.length > 0 && toAdd.length === 0) msg = "컬렉션에서 제외했습니다.";
      onAfterChange?.(folderIds);
      onClose();
      setTimeout(() => setBanner(msg), 50);
      setTimeout(() => setBanner(null), 2250);
    } catch {
      onClose();
      setTimeout(() => setBanner("처리 중 오류가 발생했습니다."), 50);
      setTimeout(() => setBanner(null), 2250);
    } finally {
      setSaving(false);
    }
  };

  const modalPortal = open ? (
    <div className="fixed inset-0 z-[99998] flex items-center justify-center p-3 sm:p-4" aria-modal="true" role="dialog">
      <div className="absolute inset-0 bg-[rgba(0,0,0,0.55)]" onClick={onClose} />
      {/* 선택 모달 */}
      <div className="relative z-[99999] w-full sm:max-w-[560px] max-w-[95vw] rounded-[12px] bg-white dark:bg-[var(--surface)] shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-4 sm:px-6 h-12 sm:h-14 border-b border-black/10 dark:border-[var(--border-color)]">
          <div className="text-sm sm:text-[16px] font-semibold text-black dark:text-white">컬렉션 추가</div>
          <button aria-label="닫기" onClick={onClose} className="p-1.5 sm:p-2 rounded-md hover:bg-neutral-100 dark:hover:bg-white/5">
            <X className="w-4 h-4 text-black dark:text-white" />
          </button>
        </div>

        {/* Content */}
        <div className="px-4 sm:px-6 py-3 sm:py-4 max-h-[70vh] min-h-[300px] sm:min-h-[420px] overflow-y-auto">
          {loading ? (
            <div className="py-16 text-center text-black/50 text-[14px]">불러오는 중…</div>
          ) : folders.length === 0 ? (
            <div className="w-full h-full flex flex-col items-center justify-center text-center" style={{ minHeight: 280 }}>
              <div className="text-base sm:text-[18px] font-semibold mb-2 text-black dark:text-white px-2">컬렉션 시작하기</div>
              <div className="text-xs sm:text-[13px] text-black/60 dark:text-white/60 px-2">마음에 드는 작업을 개인별로 분류하여 저장해보세요.</div>
              <button
                className="mt-4 sm:mt-6 h-9 sm:h-10 px-4 sm:px-5 rounded-full bg-[#068334] text-white text-sm sm:text-base font-semibold hover:bg-[#05702C]"
                onClick={openCreate}
              >
                컬렉션 폴더 만들기
              </button>
            </div>
          ) : (
            <div className="space-y-2 sm:space-y-3">
              {folders.map((f) => {
                const isSel = selectedIds.has(f.id);
                const isHover = hoveredId === f.id;
                const activeRed = "bg-[#F5333F] text-white"; // 선택 + hover 시
                const activeTeal = "bg-[#1ecad3] text-white"; // 선택 + hover 아웃 시
                const base = "flex items-center gap-2 sm:gap-3 p-2 sm:p-3 rounded-lg cursor-pointer transition-colors";
                const notSel = "bg-white dark:bg-[var(--surface)] border border-black/10 dark:border-[var(--border-color)] hover:bg-neutral-50 dark:hover:bg-white/5";
                const rowClass = `${base} ${isSel ? (isHover ? activeRed : activeTeal) : notSel}`;
                const count = countsById[f.id] ?? (f as any).itemCount ?? 0;
                const lastThumb = latestThumbById[f.id] || "";
                return (
                  <div
                    key={f.id}
                    className={rowClass}
                    onClick={() => toggleSelect(f.id)}
                    onMouseEnter={() => setHoveredId(f.id)}
                    onMouseLeave={() => setHoveredId(prev => (prev === f.id ? null : prev))}
                  >
                    <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-md bg-gray-200 overflow-hidden flex items-center justify-center flex-shrink-0">
                      {lastThumb && <img src={lastThumb} alt="thumb" className="w-full h-full object-cover" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className={`text-sm sm:text-[15px] font-medium truncate ${isSel ? "text-white" : "text-black dark:text-white"}`}>{f.title || "이름 없음"}</div>
                      <div className={`${isSel ? "text-white/90" : "text-black/50 dark:text-white/60"} text-[10px] sm:text-[12px]`}>총 {count}개의 작업  |  {f.private ? "비공개 컬렉션" : "공개 컬렉션"}</div>
                    </div>
                    {isSel && (
                      <div className="ml-auto flex-shrink-0">
                        {isHover ? (
                          <span className="inline-flex items-center justify-center w-7 h-7 sm:w-8 sm:h-8 rounded bg-[#d6202b] text-white text-base sm:text-[18px]">−</span>
                        ) : (
                          <span className="inline-flex items-center justify-center w-7 h-7 sm:w-8 sm:h-8 rounded bg-[#12b9c1] text-white text-sm sm:text-[16px]">✓</span>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-2 sm:py-3 border-t border-black/10 dark:border-[var(--border-color)]">
          <button className="inline-flex items-center gap-1.5 sm:gap-2 text-xs sm:text-[14px] text-black/70 hover:text-black dark:text-white dark:hover:text-white" onClick={openCreate}>
            <span className="inline-block w-4 h-4 sm:w-5 sm:h-5 rounded-full bg-[#068334] text-white text-[10px] sm:text-[12px] font-bold leading-4 sm:leading-5 text-center">+</span>
            폴더 만들기
          </button>
          <button
            className={`h-8 sm:h-9 px-4 sm:px-5 rounded-md bg-[#068334] text-white text-sm sm:text-base ${canSave ? "hover:bg-[#05702C]" : "opacity-50 cursor-not-allowed"}`}
            disabled={!canSave}
            onClick={performSave}
          >
            저장
          </button>
        </div>
      </div>

      {createOpen && (
        <CreateFolderModal
          onClose={closeCreate}
          onCreated={async () => {
            setBanner("컬렉션 폴더가 저장되었습니다.");
            await refreshFolders();
          }}
        />
      )}
    </div>
  ) : null;

  // 토스트는 모달 열림 여부와 무관하게 별도 포털에서 렌더링
  const toastPortal = banner
    ? ReactDOM.createPortal(
        <Toast visible={!!banner} message={banner || ""} type="success" size="medium" autoClose={2200} closable onClose={() => setBanner(null)} />,
        document.body
      )
    : null;

  return <>{modalPortal}{toastPortal}</>;
}

function CreateFolderModal({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const [name, setName] = useState("");
  const [desc, setDesc] = useState("");
  const [isPrivate, setIsPrivate] = useState(false);
  const [saving, setSaving] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || saving) return;
    try {
      setSaving(true);
      await createCollectionFolder({ title: name.trim(), description: desc.trim(), private: isPrivate });
      onClose();
      onCreated();
    } catch {
      onClose();
    } finally {
      setSaving(false);
    }
  };

  return ReactDOM.createPortal(
    <div className="fixed inset-0 z-[99998] flex items-center justify-center p-3 sm:p-4">
      <div className="absolute inset-0 bg-[rgba(0,0,0,0.55)]" onClick={onClose} />
      <div className="relative z-[99999] w-full sm:max-w-[500px] max-w-[95vw] rounded-[12px] bg-white dark:bg-[var(--surface)] shadow-2xl">
        <div className="flex items-center justify-between px-4 sm:px-6 h-12 sm:h-14 border-b border-black/10 dark:border-[var(--border-color)]">
          <div className="text-sm sm:text-[16px] font-semibold text-black dark:text-white">컬렉션 폴더 만들기</div>
          <button aria-label="닫기" onClick={onClose} className="p-1.5 sm:p-2 rounded-md hover:bg-neutral-100 dark:hover:bg-white/5">
            <X className="w-4 h-4 text-black dark:text-white" />
          </button>
        </div>
        <form onSubmit={submit} className="px-4 sm:px-6 py-3 sm:py-4 space-y-3 sm:space-y-4 max-h-[75vh] min-h-[300px] sm:min-h-[420px] overflow-y-auto">
          <div>
            <label className="block text-xs sm:text-[13px] text-black/70 dark:text-white/70 mb-1">컬렉션 이름</label>
            <input value={name} onChange={(e) => setName(e.target.value.slice(0,30))} placeholder="이름을 입력해주세요 (최대 30자)" className="w-full h-10 sm:h-[44px] rounded-md border border-[#D1D5DB] dark:border-[var(--border-color)] px-3 text-sm sm:text-[14px] bg-white dark:bg-[var(--surface)] text-black dark:text-white placeholder:text-black/40 dark:placeholder:text-white/40" />
          </div>
          <div>
            <label className="block text-xs sm:text-[13px] text-black/70 dark:text-white/70 mb-1">컬렉션 소개</label>
            <textarea value={desc} onChange={(e) => setDesc(e.target.value.slice(0,1000))} placeholder="소개를 입력해주세요. (최대 1000자)" className="w-full min-h-[100px] sm:min-h-[120px] rounded-md border border-[#D1D5DB] dark:border-[var(--border-color)] px-3 py-2 text-sm sm:text-[14px] bg-white dark:bg-[var(--surface)] text-black dark:text-white placeholder:text-black/40 dark:placeholder:text-white/40 resize-y" />
          </div>
          <label className="inline-flex items-center gap-2 text-xs sm:text-[13px] text-black/80 dark:text-white/80">
            <input type="checkbox" checked={isPrivate} onChange={(e)=>setIsPrivate(e.target.checked)} className="w-4 h-4" />
            <span>이 폴더를 비공개로 설정</span>
          </label>
          <div className="flex items-center justify-end gap-2 pt-2">
            <button type="button" className="h-9 sm:h-10 px-3 sm:px-4 rounded-md bg-white dark:bg-[var(--surface)] border border-[#D1D5DB] dark:border-[var(--border-color)] text-black/70 dark:text-white text-sm sm:text-base hover:bg-neutral-50 dark:hover:bg-white/5" onClick={onClose}>취소</button>
            <button type="submit" className="h-9 sm:h-10 px-4 sm:px-5 rounded-md bg-[#068334] text-white text-sm sm:text-base hover:bg-[#05702C] disabled:opacity-50" disabled={!name.trim() || saving}>{saving ? "저장 중..." : "확인"}</button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
} 