import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../../api/axiosInstance";
import { getCollectionFolder } from "../../api/collections";

type Folder = {
  id: number;
  title: string;
  description?: string | null;
  private: boolean;
  itemCount?: number;
};

export default function PublicCollectionsGrid() {
  const { id } = useParams<{ id: string }>();
  const userId = id ? Number(id) : 0;
  const [loading, setLoading] = useState(true);
  const [folders, setFolders] = useState<Folder[]>([]);
  const [coversById, setCoversById] = useState<Record<number, string[]>>(() => {
    try { const raw = localStorage.getItem("publicCollectionThumbs"); return raw ? JSON.parse(raw) : {}; } catch { return {}; }
  });
  const [countsById, setCountsById] = useState<Record<number, number>>({});
  const navigate = useNavigate();

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        setLoading(true);
        const { data } = await api.get<Folder[]>(`/collections/folders/user/${userId}`);
        if (!alive) return;
        const list = Array.isArray(data) ? data : [];
        setFolders(list);
        // 캐시 즉시 반영 후 상세 병렬 조회
        const ids = list.map(f => f.id);
        setCoversById(prev => ({ ...ids.reduce((a, id) => ({ ...a, [id]: prev[id] || [] }), {}), ...prev }));
        const results = await Promise.allSettled(ids.map(id => getCollectionFolder(id) as any));
        const nextCovers: Record<number, string[]> = {};
        const nextCounts: Record<number, number> = {};
        results.forEach((r, idx) => {
          if (r.status === "fulfilled") {
            const detail: any = r.value;
            let projects: any[] = Array.isArray(detail?.projects) ? detail.projects : [];
            if (projects.length > 1) projects = projects.slice().reverse(); // 최신순 좌측
            nextCovers[ids[idx]] = projects.slice(0,4).map(p => p.thumbnailUrl).filter(Boolean);
            nextCounts[ids[idx]] = projects.length;
          }
        });
        if (alive) {
          setCoversById(prev => ({ ...prev, ...nextCovers }));
          setCountsById(prev => ({ ...prev, ...nextCounts }));
          try { localStorage.setItem("publicCollectionThumbs", JSON.stringify({ ...coversById, ...nextCovers })); } catch {}
        }
      } catch {
        if (alive) setFolders([]);
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => { alive = false; };
  }, [userId]);

  if (loading) {
    return (
      <div className="min-h-[360px] flex flex-col items-center justify-center text-center">
        <div className="mt-6 text-[16px] md:text-[18px] text-black/80">불러오는 중…</div>
      </div>
    );
  }

  if (!folders || folders.length === 0) {
    return (
      <div className="min-h-[360px] flex flex-col items-center justify-center text-center">
        <div className="mt-6 text-[16px] md:text-[18px] text-black/80">아직 공개 컬렉션이 없습니다.</div>
      </div>
    );
  }

  return (
    <div className="mt-6 grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
      {folders.map((f) => (
        <div key={f.id} className="relative rounded-xl border border-[#E5E7EB] overflow-hidden cursor-pointer group bg-white" onClick={() => navigate(`/collections/${f.id}`)}>
          <div className="relative w-full aspect-[4/3] bg-gray-200">
            <div className="absolute inset-0">
              {coversById[f.id]?.[0] && (
                <div className="absolute left-0 top-0 w-1/2 h-1/2 overflow-hidden">
                  <img src={coversById[f.id][0]} alt="thumb1" className="w-full h-full object-cover" />
                </div>
              )}
              {coversById[f.id]?.[1] && (
                <div className="absolute left-1/2 top-0 w-1/2 h-1/2 overflow-hidden">
                  <img src={coversById[f.id][1]} alt="thumb2" className="w-full h-full object-cover" />
                </div>
              )}
              {coversById[f.id]?.[2] && (
                <div className="absolute left-0 top-1/2 w-1/2 h-1/2 overflow-hidden">
                  <img src={coversById[f.id][2]} alt="thumb3" className="w-full h-full object-cover" />
                </div>
              )}
              {coversById[f.id]?.[3] && (
                <div className="absolute left-1/2 top-1/2 w-1/2 h-1/2 overflow-hidden">
                  <img src={coversById[f.id][3]} alt="thumb4" className="w-full h-full object-cover" />
                </div>
              )}
            </div>
          </div>
          <div className="mt-2 px-2 py-2">
            <div className="text-[15px] font-medium line-clamp-1">{f.title || "이름 없음"}</div>
            <div className="text-[12px] text-black/50">총 {(countsById[f.id] ?? f.itemCount ?? 0)}개의 작업  |  공개 컬렉션</div>
          </div>
        </div>
      ))}
    </div>
  );
} 