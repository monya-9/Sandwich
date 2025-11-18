import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { fetchProjectDetail, fetchProjectContents, type ProjectDetailResponse, type ProjectContentResponseItem } from "../api/projectApi";
import ActionBar from "../components/OtherProject/ActionBar/ActionBar";
import ProjectStatsBox from "../components/OtherProject/ProjectStatsBox";
import api from "../api/axiosInstance";

const RIGHT_BAR_WIDTH = 80;

function normalizeUrl(u?: string | null): string {
  return String(u || "").trim().toLowerCase().replace(/[#?].*$/, "");
}

export default function ProjectDetailLightboxPage() {
  const nav = useNavigate();
  const { ownerId: ownerIdParam, projectId: projectIdParam } = useParams<{ ownerId?: string; projectId?: string }>();
  const ownerId = ownerIdParam ? Number(ownerIdParam) : undefined;
  const projectId = projectIdParam ? Number(projectIdParam) : undefined;

  const [projectDetail, setProjectDetail] = useState<ProjectDetailResponse | null>(null);
  const [contents, setContents] = useState<ProjectContentResponseItem[]>([]);
  const [others, setOthers] = useState<Array<{ id: number; coverUrl?: string; title?: string }>>([]);
  const [author, setAuthor] = useState<{ id: number; nickname?: string } | null>(null);

  useEffect(() => {
    if (!ownerId || !projectId) return;
    fetchProjectDetail(ownerId, projectId).then(setProjectDetail).catch(() => {});
    fetchProjectContents(ownerId, projectId).then(setContents).catch(() => setContents([]));
    (async () => {
      try {
        const { data } = await api.get(`/projects/${projectId}/related/author-others`, { params: { size: 3 } });
        const mapped = (data?.content || []).map((r: any) => ({ id: r.id, coverUrl: r.coverUrl, title: r.title }));
        setOthers(mapped);
      } catch {}
      try {
        const { data } = await api.get(`/users/${ownerId}`);
        setAuthor({ id: data?.id, nickname: data?.nickname });
      } catch {}
    })();
  }, [ownerId, projectId]);

  const normalizedHtml = useMemo(() => {
    const cover = normalizeUrl(projectDetail?.coverUrl || projectDetail?.image);
    return (contents || [])
      .filter((it) => {
        if (!it?.data) return false;
        if (it.type === "IMAGE") {
          let imgSrc = it.data; try { const o = JSON.parse(it.data); if (o?.src) imgSrc = o.src; } catch {}
          return normalizeUrl(imgSrc) !== cover;
        }
        if (it.type === "TEXT") {
          const match = /src=\"([^\"]+)\"/i.exec(it.data || "");
          if (match && match[1]) return normalizeUrl(match[1]) !== cover; return true;
        }
        return true;
      })
      .sort((a, b) => a.order - b.order)
      .map((it) => {
        if (it.type === "IMAGE") {
          let src = it.data; try { const o = JSON.parse(it.data); src = o.src || src; } catch {}
          return `<img loading=\"lazy\" src=\"${src}\" />`;
        }
        if (it.type === "VIDEO") {
          let src = it.data; try { const o = JSON.parse(it.data); src = o.src || src; } catch {}
          return `<iframe class=\"ql-video\" src=\"${src}\" allow=\"accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture\" allowfullscreen></iframe>`;
        }
        return it.data || "";
      })
      .join("\n");
  }, [contents, projectDetail?.coverUrl, projectDetail?.image]);

  // 사용자 설정 메타(배경색 등) 파싱
  const meta = useMemo(() => {
    try {
      const first = (contents || []).find(
        (c) => c.type === "TEXT" && typeof c.data === "string" && c.data.startsWith("<!--PM_META")
      );
      if (first) {
        const json = first.data.replace(/^<!--PM_META/, "").replace(/-->$/, "");
        return JSON.parse(json);
      }
    } catch {}
    return {} as any;
  }, [contents]);
  const pageBg = (meta as any)?.bg || "#f5f6f8";

  const closeLightbox = () => { try { nav(-1); } catch { nav("/search"); } };

  return (
    <div className="min-h-screen w-full bg-[#f5f6f8] dark:bg-black">
      <div className="w-full flex justify-center items-start">
        <div className="flex flex-row items-start w-full" style={{ maxWidth: 1440 }}>
          {/* 캔버스 영역 */}
          <div className="flex-1 overflow-x-hidden">
            <div className="max-w-[1200px] mx-auto py-6 px-6">
              <div className="ql-snow">
                <div className="ql-editor" dangerouslySetInnerHTML={{ __html: normalizedHtml }} />
              </div>
              <div className="mt-6">
                <ProjectStatsBox likes={0} views={0} comments={0} projectName={projectDetail?.title || ""} date={new Date().toLocaleDateString()} category={projectDetail?.tools || ""} projectId={projectId} />
              </div>
              {/* 작성자 하단 섹션 */}
              <div className="mt-12 border-t dark:border-[var(--border-color)] pt-8">
                <div className="text-center font-bold text-[18px] text-black dark:text-white">{author?.nickname || "사용자"}</div>
                <div className="mt-6">
                  {others.length > 0 ? (
                    <div className="grid grid-cols-3 gap-4">
                      {others.slice(0, 3).map((it) => (
                        <div key={it.id} className="aspect-square bg-gray-100 dark:bg-white/5 rounded overflow-hidden cursor-pointer border border-black/5 dark:border-[var(--border-color)]" onClick={() => nav(`/other-project/${ownerId}/${it.id}`)}>
                          <img src={it.coverUrl || ""} alt={it.title || "work"} className="w-full h-full object-cover" />
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center text-gray-500 dark:text-white/60">등록된 다른 작업이 없습니다.</div>
                  )}
                </div>
              </div>
            </div>
          </div>
          {/* 우측 액션바 */}
          <div style={{ width: RIGHT_BAR_WIDTH, minWidth: RIGHT_BAR_WIDTH }} className="hidden lg:flex">
            {projectDetail && (
              <ActionBar project={{
                qrImageUrl: projectDetail.qrImageUrl || "",
                id: projectId || 0,
                name: projectDetail.title || "",
                owner: author?.nickname || "",
                category: projectDetail.tools || "",
                ownerId: ownerId || 0,
                shareUrl: projectDetail.shareUrl,
                coverUrl: projectDetail.coverUrl,
                isOwner: false,
                deployEnabled: projectDetail.deployEnabled,
                qrCodeEnabled: projectDetail.qrCodeEnabled,
                demoUrl: projectDetail.demoUrl,
                frontendBuildCommand: projectDetail.frontendBuildCommand,
                backendBuildCommand: projectDetail.backendBuildCommand,
              }} onCommentClick={() => {}} />
            )}
          </div>
        </div>
      </div>
    </div>
  );
} 