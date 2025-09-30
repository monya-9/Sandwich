import React, { useEffect, useMemo, useState } from "react";
import { resolveCover, swapJpgPng } from "../../utils/getProjectCover";
import { fetchUserProjects, type Project } from "../../api/projects";
import { fetchProjectFeed } from "../../api/projects";
import { useNavigate } from "react-router-dom";

function Img({ src, alt }: { src: string; alt: string }) {
  const [url, setUrl] = React.useState(src);
  const [triedAlt, setTriedAlt] = React.useState(false);
  return (
    <img
      src={url}
      alt={alt}
      className="absolute inset-0 w-full h-full object-cover"
      onError={() => {
        if (!triedAlt) {
          setUrl(swapJpgPng(url));
          setTriedAlt(true);
        }
      }}
    />
  );
}

export default function PublicWorkGrid({ userId }: { userId: number }) {
  const [items, setItems] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    let mounted = true;
    if (!userId) { setItems([]); setLoading(false); return; }
    (async () => {
      try {
        setLoading(true);
        const res = await fetchUserProjects(userId, 0, 24);
        let list = res.content || [];
        // 폴백: 비어 있거나 엔드포인트 미구현/오류 시, 일반 피드를 받아 클라이언트 필터링(임시)
        if ((!list || list.length === 0)) {
          try {
            const feed = await fetchProjectFeed({ page: 0, size: 200, sort: 'latest' });
            list = (feed.content || []).filter((p: any) => (p?.owner?.id === userId) || (p?.authorId === userId));
          } catch {}
        }
        if (!mounted) return;
        setItems(list || []);
      } catch {
        // 최종 실패 시 빈 목록
        if (mounted) setItems([]);
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, [userId]);

  if (!userId) return null;

  return (
    <div className="min-h-[360px]">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-[15px] font-medium text-black/90">모든 작업 목록</h3>
      </div>
      {loading ? (
        <div className="py-10 text-center text-black/60">불러오는 중…</div>
      ) : items.length === 0 ? (
        <div className="py-12 text-center text-black/50">등록된 작업이 없습니다.</div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {items.map((p, idx) => {
            const cover = (p as any).coverUrl || resolveCover(p as any, { position: idx });
            const coverUrl = cover ? cover : '';
            const title = (p as any).title ? (p as any).title : '';
            const ownerId = (p as any).owner?.id || (p as any).authorId || userId;
            const goDetail = () => navigate(`/other-project/${ownerId}/${(p as any).id}`);
            return (
              <div key={p.id} className="relative rounded-xl overflow-hidden cursor-pointer" onClick={goDetail}>
                <div className="relative w-full aspect-[4/3] bg-gray-200 group">
                  <Img src={coverUrl} alt={title} />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-black/0 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                  <div className="absolute left-2 bottom-2 text-white text-sm font-semibold opacity-0 group-hover:opacity-100 transition-opacity line-clamp-1">
                    {title}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
} 