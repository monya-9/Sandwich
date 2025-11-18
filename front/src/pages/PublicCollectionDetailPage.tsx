import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { getCollectionFolder, type CollectionFolder } from "../api/collections";
import Toast from "../components/common/Toast";
import { fetchProjectFeed } from "../api/projects";

export default function PublicCollectionDetailPage() {
  const { userId: userIdParam, id } = useParams<{ userId: string; id: string }>();
  const folderId = id ? Number(id) : 0;
  const navigate = useNavigate();

  const [folder, setFolder] = useState<CollectionFolder | null>(null);
  const [detail, setDetail] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [banner, setBanner] = useState<string | null>(null);

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

  if (!id || folderId <= 0) {
    return (
      <div className="p-8 text-center bg-white dark:bg-[var(--bg)] min-h-screen">
        <div className="text-lg text-black dark:text-white">잘못된 경로입니다.</div>
        <button className="mt-4 underline text-black dark:text-white" onClick={() => navigate(-1)}>뒤로가기</button>
      </div>
    );
  }

  const projectsRaw: Array<{ id: number; title: string; thumbnailUrl?: string; ownerId?: number }> = Array.isArray((detail as any)?.projects) ? (detail as any).projects : [];
  const projects = projectsRaw.slice().reverse();

  const goProject = async (p: { id: number; ownerId?: number }) => {
    const direct = Number(p.ownerId || 0);
    if (direct > 0) { navigate(`/other-project/${direct}/${p.id}`); return; }
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
      <div className="w-full min-h-screen bg-white dark:bg-[var(--bg)] font-gmarket px-4 md:px-8 xl:px-14 pb-16">
        <div className="max-w-[1100px] mx-auto pt-20">
          {/* Header */}
          <div className="flex items-start justify-between mt-10">
            <div>
              <div className="text-[20px] font-semibold text-black dark:text-white">{folder?.title || "컬렉션"}</div>
              <div className="mt-1 text-black/60 dark:text-white/60 text-[13px]">총 {projects.length}개의 작업  |  {(((folder as any)?.private) ?? ((folder as any)?.isPrivate)) ? "비공개 컬렉션" : "공개 컬렉션"}</div>
              {folder?.description && (
                <div className="mt-1 text-black/80 dark:text-white/80 text-[14px]">{folder.description}</div>
              )}
            </div>
          </div>

          {loading ? (
            <div className="w-full flex items-center justify-center min-h-[320px] text-black/60 dark:text-white/60">불러오는 중…</div>
          ) : projects.length === 0 ? (
            <div className="w-full flex flex-col items-center justify-center" style={{ minHeight: "calc(100vh - 300px)" }}>
              <div className="text-black/80 dark:text-white/80 text-[14px]">아직 컬렉션된 작업이 없습니다.</div>
              <button onClick={() => navigate(`/users/${userIdParam}`)} className="mt-6 h-10 px-5 rounded-full border border-[#D1D5DB] dark:border-[var(--border-color)] bg-white dark:bg-[var(--surface)] text-black/80 dark:text-white/80 hover:bg-neutral-50 dark:hover:bg-white/5">프로필로 돌아가기</button>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mt-10">
              {projects.map((p) => (
                <div key={p.id} className="relative rounded-xl overflow-hidden cursor-pointer group" onClick={() => goProject(p)}>
                  <div className="relative w-full aspect-[4/3] bg-gray-200 dark:bg-[#1a1d20]">
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
    </div>
  );
} 