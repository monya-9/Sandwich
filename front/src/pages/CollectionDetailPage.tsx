import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { getCollectionFolder, deleteCollectionFolder, type CollectionFolder, updateCollectionFolder } from "../api/collections";
import ConfirmModal from "../components/common/ConfirmModal";
import Toast from "../components/common/Toast";
import ReactDOM from "react-dom";
import { X } from "lucide-react";
import { fetchProjectFeed } from "../api/projects";

export default function CollectionDetailPage() {
  const { id } = useParams<{ id: string }>();
  const folderId = id ? Number(id) : 0;
  const navigate = useNavigate();

  const [folder, setFolder] = useState<CollectionFolder | null>(null);
  const [detail, setDetail] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [banner, setBanner] = useState<string | null>(null);
  const [editOpen, setEditOpen] = useState(false);
  const [name, setName] = useState("");
  const [desc, setDesc] = useState("");
  const [isPrivate, setIsPrivate] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        setLoading(true);
        const data = await getCollectionFolder(folderId);
        if (!alive) return;
        setDetail(data);
        setFolder({
          id: folderId,
          title: (data as any)?.title || "",
          description: (data as any)?.description || "",
          private: !!(((data as any)?.private) ?? ((data as any)?.isPrivate)),
          itemCount: Array.isArray((data as any)?.projects) ? (data as any).projects.length : 0,
        } as any);
      } catch {
        if (alive) { setFolder(null); setDetail(null); }
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => { alive = false; };
  }, [folderId]);

  const onDelete = async () => {
    setConfirmOpen(false);
    try {
      await deleteCollectionFolder(folderId);
      setBanner("컬렉션 폴더가 삭제되었습니다.");
      setTimeout(() => { setBanner(null); navigate(-1); }, 1200);
    } catch {
      setBanner("삭제 중 오류가 발생했습니다.");
      setTimeout(() => setBanner(null), 2500);
    }
  };

  const openEdit = () => {
    if (!folder) return;
    setName(folder.title || "");
    setDesc((folder as any).description || "");
    setIsPrivate(!!(((folder as any).private) ?? ((folder as any).isPrivate)));
    setEditOpen(true);
  };

  const onSubmitEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || saving) return;
    try {
      setSaving(true);
      await updateCollectionFolder(folderId, { title: name.trim(), description: desc.trim(), private: isPrivate });
      setBanner("컬렉션 폴더가 저장되었습니다.");
      setEditOpen(false);
      const updated = await getCollectionFolder(folderId);
      setDetail(updated);
      setFolder({
        id: folderId,
        title: (updated as any)?.title || "",
        description: (updated as any)?.description || "",
        private: !!(((updated as any)?.private) ?? ((updated as any)?.isPrivate)),
        itemCount: Array.isArray((updated as any)?.projects) ? (updated as any).projects.length : 0,
      } as any);
      setTimeout(() => setBanner(null), 2500);
    } catch {
      setBanner("처리 중 오류가 발생했습니다.");
      setTimeout(() => setBanner(null), 2500);
    } finally {
      setSaving(false);
    }
  };

  if (!id || folderId <= 0) {
    return (
      <div className="p-8 text-center">
        <div className="text-lg">잘못된 경로입니다.</div>
        <button className="mt-4 underline" onClick={() => navigate(-1)}>뒤로가기</button>
      </div>
    );
  }

  const projectsRaw: Array<{ id: number; title: string; thumbnailUrl?: string; ownerId?: number }> = Array.isArray((detail as any)?.projects) ? (detail as any).projects : [];
  // 최신이 왼쪽으로 오도록 최신순 정렬(응답이 오래→최신 순이라 가정하여 역순 처리)
  const projects = projectsRaw.slice().reverse();

  const goProject = async (p: { id: number; ownerId?: number }) => {
    const direct = Number(p.ownerId || 0);
    if (direct > 0) { navigate(`/other-project/${direct}/${p.id}`); return; }
    // 보강: 최신 피드에서 해당 프로젝트의 owner 탐색
    try {
      const feed = await fetchProjectFeed({ page: 0, size: 200, sort: 'latest' });
      const match = (feed.content || []).find((it: any) => it?.id === p.id);
      const resolved = (match as any)?.owner?.id || (match as any)?.authorId;
      if (resolved) { navigate(`/other-project/${resolved}/${p.id}`); return; }
    } catch {}
    setBanner("작성자 정보를 찾을 수 없습니다.");
    setTimeout(() => setBanner(null), 2000);
  };

  return (
    <div className="w-full flex justify-center">
      <Toast visible={!!banner} message={banner || ""} type="success" size="medium" autoClose={2000} closable={true} onClose={() => setBanner(null)} />
      <div className="w-full min-h-screen bg-white dark:bg-[var(--bg)] font-gmarket px-4 md:px-8 xl:px-14 pb-16 text-black dark:text-white">
        <div className="max-w-[1100px] mx-auto pt-20">
          {/* Header */}
          <div className="flex items-start justify-between mt-10">
            <div>
              <div className="text-[20px] font-semibold">{folder?.title || "컬렉션"}</div>
              <div className="mt-1 text-black/60 dark:text-white/60 text-[13px]">총 {projects.length}개의 작업  |  {(((folder as any)?.private) ?? ((folder as any)?.isPrivate)) ? "비공개 컬렉션" : "공개 컬렉션"}</div>
              {folder?.description && (
                <div className="mt-1 text-black/80 dark:text-white/80 text-[14px]">{folder.description}</div>
              )}
            </div>
            <div className="flex items-center gap-2 mt-6">
              <button className="px-3 h-9 rounded-md border border-[#D1D5DB] dark:border-[var(--border-color)] bg-white dark:bg-[var(--surface)] text-black/80 dark:text-white hover:bg-neutral-50 dark:hover:bg-white/5" onClick={openEdit}>폴더 수정하기</button>
              <button className="px-3 h-9 rounded-md bg-[#F6323E] text-white hover:bg-[#e42b36]" onClick={() => setConfirmOpen(true)}>폴더 삭제하기</button>
            </div>
          </div>

          {projects.length === 0 ? (
            <div className="w-full flex flex-col items-center justify-center" style={{ minHeight: "calc(100vh - 300px)" }}>
              <div className="text-black/80 text-[14px]">아직 컬렉션된 작업이 없습니다.</div>
              <div className="mt-1 text-black/60 text-[13px]">크리에이티브를 발견하고 수집해보세요.</div>
              <button onClick={() => navigate("/")} className="mt-6 h-10 px-5 rounded-full border border-[#D1D5DB] bg-white text-black/80 hover:bg-neutral-50">발견 페이지로 이동</button>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mt-10">
              {projects.map((p) => (
                <div key={p.id} className="relative rounded-xl overflow-hidden cursor-pointer group" onClick={() => goProject(p)}>
                  <div className="relative w-full aspect-[4/3] bg-gray-200">
                    {p.thumbnailUrl && (
                      <img src={p.thumbnailUrl} alt={p.title} className="absolute inset-0 w-full h-full object-cover" />
                    )}
                  </div>
                  <div className="mt-2 px-1 text-[14px] font-medium line-clamp-1 text-black dark:text-white">{p.title}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Edit Modal: same style as Collections tab (portal) */}
      {editOpen && ReactDOM.createPortal(
        <div className="fixed inset-0 z-[20050] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-[rgba(0,0,0,0.55)]" onClick={() => setEditOpen(false)} />
          <div className="relative z-[20051] w-full max-w-[500px] rounded-[12px] bg-white dark:bg-[var(--surface)] shadow-2xl">
            <div className="flex items-center justify-between px-6 h-14 border-b border-black/10 dark:border-[var(--border-color)]">
              <div className="text-[16px] font-semibold text-black dark:text-white">컬렉션 폴더 수정하기</div>
              <button aria-label="닫기" onClick={() => setEditOpen(false)} className="p-2 rounded-md hover:bg-neutral-100">
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={onSubmitEdit} className="px-6 py-4 space-y-4 max-h-[70vh] min-h-[420px] overflow-y-auto">
              <div>
                <label className="block text-[13px] text-black/70 dark:text-white/70 mb-1">컬렉션 이름</label>
                <input value={name} onChange={(e) => setName(e.target.value.slice(0,30))} placeholder="이름을 입력해주세요 (최대 30자)" className="w-full h-[44px] rounded-md border border-[#D1D5DB] dark:border-[var(--border-color)] px-3 text-[14px] bg-white dark:bg-[var(--surface)] dark:text-white" />
              </div>
              <div>
                <label className="block text-[13px] text-black/70 dark:text-white/70 mb-1">컬렉션 소개</label>
                <textarea value={desc} onChange={(e) => setDesc(e.target.value.slice(0,1000))} placeholder="소개를 입력해주세요. (최대 1000자)" className="w-full min-h-[120px] rounded-md border border-[#D1D5DB] dark:border-[var(--border-color)] px-3 py-2 text-[14px] bg-white dark:bg-[var(--surface)] dark:text-white resize-y" />
              </div>
              <label className="inline-flex items-center gap-2 text-[13px] text-black/80 dark:text-white/80">
                <input type="checkbox" checked={isPrivate} onChange={(e)=>setIsPrivate(e.target.checked)} />
                <span>이 폴더를 비공개로 설정</span>
              </label>
              <div className="flex items-center justify-end gap-2 pt-2">
                <button type="button" className="h-10 px-4 rounded-md bg-white dark:bg-[var(--surface)] border border-[#D1D5DB] dark:border-[var(--border-color)] text-black/70 dark:text-white hover:bg-neutral-50 dark:hover:bg-white/5" onClick={() => setEditOpen(false)}>취소</button>
                <button type="submit" className="h-10 px-5 rounded-md bg-[#068334] text-white hover:bg-[#05702C] disabled:opacity-50" disabled={!name.trim() || saving}>{saving ? "저장 중..." : "완료"}</button>
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
        onConfirm={onDelete}
        onCancel={() => setConfirmOpen(false)}
      />
    </div>
  );
} 