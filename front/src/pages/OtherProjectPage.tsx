import React, { useState, useContext, useEffect, useMemo } from "react";
import ActionBar from "../components/OtherProject/ActionBar/ActionBar";
import ProjectTopInfo from "../components/OtherProject/ProjectTopInfo";
import ProjectThumbnail from "../components/OtherProject/ProjectThumbnail";
import TagList from "../components/OtherProject/TagList";
import ProjectStatsBox from "../components/OtherProject/ProjectStatsBox";
import UserProfileBox from "../components/OtherProject/UserProfileBox";
import ProjectGrid from "../components/OtherProject/ProjectGrid";
import CommentPanel from "../components/OtherProject/ActionBar/CommentPanel";
import QueenImg from "../assets/images/Queen.jpg";
import { AuthContext } from "../context/AuthContext";
import { useParams, useNavigate } from "react-router-dom";
import { fetchProjectDetail, type ProjectDetailResponse, fetchProjectContents, type ProjectContentResponseItem } from "../api/projectApi";
import api from "../api/axiosInstance";

const MAX_WIDTH = 1440;
const PANEL_WIDTH = 440;
const GAP = 25;
const PROJECT_WIDE = 1440;
const PROJECT_NARROW = 1050;
const ACTIONBAR_WIDTH = 80;

function normalizeUrl(u?: string | null): string {
    return String(u || "").trim().toLowerCase().replace(/[#?].*$/, "");
}

export default function OtherProjectPage() {
    const [commentOpen, setCommentOpen] = useState(false);
    const projectWidth = commentOpen ? PROJECT_NARROW : PROJECT_WIDE;
    const { isLoggedIn } = useContext(AuthContext);
    const nav = useNavigate();
    const [currentUserId, setCurrentUserId] = useState<number | null>(null);

    const { ownerId: ownerIdParam, projectId: projectIdParam } = useParams<{ ownerId?: string; projectId?: string }>();
    const ownerId = ownerIdParam ? Number(ownerIdParam) : undefined;
    const projectId = projectIdParam ? Number(projectIdParam) : undefined;

    const [projectDetail, setProjectDetail] = useState<ProjectDetailResponse | null>(null);
    const [ownerProfile, setOwnerProfile] = useState<{ id: number; nickname?: string; email?: string; profileImage?: string | null }>({ id: 0 });
    const [contents, setContents] = useState<ProjectContentResponseItem[]>([]);

    useEffect(() => {
        if (ownerId && projectId) {
            fetchProjectDetail(ownerId, projectId).then(setProjectDetail).catch(() => {});
            fetchProjectContents(ownerId, projectId).then(setContents).catch(() => setContents([]));
        }
    }, [ownerId, projectId]);

    // 공개 프로필 조회 + 현재 로그인 사용자(me) 조회로 DB 기반 소유자 판단
    useEffect(() => {
        async function loadOwnerAndMe(id?: number) {
            try {
                if (id) {
                    const { data } = await api.get<{ id: number; nickname?: string; email?: string; profileImage?: string }>(`/users/${id}`);
                    setOwnerProfile({ id: data?.id || id, nickname: data?.nickname, email: data?.email, profileImage: (data as any)?.profileImage });
                } else {
                    setOwnerProfile({ id: 0 });
                }
            } catch {
                if (id) setOwnerProfile({ id, nickname: "" }); else setOwnerProfile({ id: 0 });
            }
            // me
            try {
                const token = (typeof window !== 'undefined') ? (localStorage.getItem('accessToken') || sessionStorage.getItem('accessToken')) : null;
                const { data: me } = await api.get<{ id: number }>(`/users/me`, { headers: token ? { Authorization: `Bearer ${token}` } : undefined });
                setCurrentUserId(me?.id ?? null);
            } catch {
                setCurrentUserId(null);
            }
        }
        loadOwnerAndMe(ownerId);
    }, [ownerId]);

    // 메타 파생
    const headerSummary = useMemo(() => {
        const html = projectDetail?.description || "";
        try {
            const div = document.createElement("div");
            div.innerHTML = html;
            const text = (div.textContent || div.innerText || "").replace(/\s+/g, " ").trim();
            return text.length > 140 ? text.slice(0, 140) + "…" : text;
        } catch { return ""; }
    }, [projectDetail?.description]);

    const headerCategories = useMemo(() => {
        const toolsCsv = projectDetail?.tools || "";
        return toolsCsv.split(",").map((s) => s.trim()).filter(Boolean).slice(0, 2);
    }, [projectDetail?.tools]);

    const headerDate = useMemo(() => {
        const d = new Date();
        const y = d.getFullYear();
        const m = String(d.getMonth() + 1).padStart(2, "0");
        const day = String(d.getDate()).padStart(2, "0");
        return `${y}.${m}.${day}`;
    }, []);

    // 소유자 여부 (DB의 /users/me 결과 기반)
    const isOwner = useMemo(() => {
        if (!currentUserId || !ownerId) return false;
        return currentUserId === ownerId;
    }, [currentUserId, ownerId]);

    // 커버 이미지 제외한 본문 콘텐츠
    const normalizedContents = useMemo(() => {
        const cover = normalizeUrl(projectDetail?.coverUrl || projectDetail?.image);
        // 메타 파싱: 첫 TEXT가 <!--PM_META{...}--> 형태면 추출
        try {
            const first = (contents || []).find(c => c.type === 'TEXT' && typeof c.data === 'string' && c.data.startsWith('<!--PM_META'));
            if (first) {
                const json = first.data.replace(/^<!--PM_META/, '').replace(/-->$/, '');
                const meta = JSON.parse(json);
                (window as any).__pmMeta = meta;
            }
        } catch {}
        return (contents || [])
            .filter((it) => {
                if (!it?.data) return false;
                // 메타 TEXT는 숨김
                if (it.type === 'TEXT' && typeof it.data === 'string' && it.data.startsWith('<!--PM_META')) return false;
                if (it.type === "IMAGE") {
                    // data가 JSON({src,...})일 수 있으므로 src 파싱 후 비교
                    let imgSrc = it.data;
                    try { const o = JSON.parse(it.data); if (o && o.src) imgSrc = String(o.src); } catch {}
                    return normalizeUrl(imgSrc) !== cover;
                }
                if (it.type === "TEXT") {
                    const match = /src=\"([^\"]+)\"/i.exec(it.data || "");
                    if (match && match[1]) return normalizeUrl(match[1]) !== cover;
                    return true;
                }
                return true;
            })
            .sort((a, b) => a.order - b.order);
    }, [contents, projectDetail?.coverUrl, projectDetail?.image]);
    const renderContent = (it: ProjectContentResponseItem) => {
        if (it.type === "IMAGE") {
            // data may be raw src or JSON {src,pad,full,padded}
            let src = it.data; let pad = 0; let full = false; let padded = false;
            try { const o = JSON.parse(it.data); src = o.src || src; pad = Number(o.pad || 0); full = !!o.full; padded = !!o.padded; } catch {}
            const cls = `${padded ? 'pm-embed-padded' : ''}${full ? ' pm-embed-full' : ''}`.trim();
            const style = padded ? ({ ['--pm-pad' as any]: `${pad}px` }) : undefined;
            return (
                <div key={`img-${it.id}`} className="pm-preview-content ql-snow">
                    <div className="ql-editor">
                        <img src={src} alt="content" className={cls} style={style as any} />
                    </div>
                </div>
            );
        }
        if (it.type === "VIDEO") {
            let src = it.data; let pad = 0; let full = true; let padded = false;
            try { const o = JSON.parse(it.data); src = o.src || src; pad = Number(o.pad || 0); full = (o.full ?? true); padded = !!o.padded; } catch {}
            const cls = `ql-video${padded ? ' pm-embed-padded' : ''}${full ? ' pm-embed-full' : ''}`;
            const style = { ...(padded ? ({ ['--pm-pad' as any]: `${pad}px` }) : {}), marginTop: 0 } as any;
            return (
                <div key={`vid-${it.id}`} className="pm-preview-content ql-snow">
                    <div className="ql-editor">
                        <iframe className={cls} src={src} style={style} allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen />
                    </div>
                </div>
            );
        }
        // Fallback: if TEXT contains an iframe/img (legacy saved), render as embed
        if (it.type === "TEXT") {
            const html = it.data || "";
            const iframeMatch = html.match(/<iframe[^>]*src=\"([^\"]+)\"[^>]*><\/iframe>/i);
            if (iframeMatch) {
                const src = iframeMatch[1];
                return (
                    <div key={`txt-${it.id}`} className="pm-preview-content ql-snow">
                        <div className="ql-editor">
                            <iframe className="ql-video" src={src} allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen />
                        </div>
                    </div>
                );
            }
            const imgMatch = html.match(/<img[^>]*src=\"([^\"]+)\"[^>]*\/*>/i);
            if (imgMatch) {
                const src = imgMatch[1];
                return (
                    <div key={`txt-${it.id}`} className="pm-preview-content ql-snow">
                        <div className="ql-editor">
                            <img src={src} alt="content" />
                        </div>
                    </div>
                );
            }
        }
        return (
            <div key={`txt-${it.id}`} className="pm-preview-content ql-snow">
                <div className="ql-editor" dangerouslySetInnerHTML={{ __html: it.data }} />
            </div>
        );
    };
    // 하나의 ql-editor로 합쳐 렌더 (간격 규칙 적용용)
    const joinedHtml = useMemo(() => {
        const esc = (s: string) => String(s || '').replace(/\"/g, '&quot;');
        return normalizedContents.map((it) => {
            if (it.type === 'IMAGE') {
                let src = it.data; let pad = 0; let full = false; let padded = false;
                try { const o = JSON.parse(it.data); src = o.src || src; pad = Number(o.pad || 0); full = !!o.full; padded = !!o.padded; } catch {}
                const cls = `${padded ? 'pm-embed-padded' : ''}${full ? ' pm-embed-full' : ''}`.trim();
                const style = padded ? ` style=\"--pm-pad: ${pad}px\"` : '';
                return `<img src=\"${esc(src)}\"${cls ? ` class=\"${cls}\"` : ''}${style} />`;
            }
            if (it.type === 'VIDEO') {
                let src = it.data; let pad = 0; let full = true; let padded = false;
                try { const o = JSON.parse(it.data); src = o.src || src; pad = Number(o.pad || 0); full = (o.full ?? true); padded = !!o.padded; } catch {}
                const cls = `ql-video${padded ? ' pm-embed-padded' : ''}${full ? ' pm-embed-full' : ''}`;
                const style = padded ? ` style=\"--pm-pad: ${pad}px; margin-top: 0\"` : ` style=\"margin-top: 0\"`;
                return `<iframe class=\"${cls}\" src=\"${esc(src)}\"${style} allow=\"accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture\" allowfullscreen></iframe>`;
            }
            // TEXT: 비어있는 문단만 있는 항목은 제거
            if (it.type === 'TEXT') {
                const html = String(it.data || '').trim();
                const collapsed = html
                    .replace(/<p>\s*<br\s*\/?>(\s|&nbsp;|\u00a0)*<\/p>/gi, '')
                    .replace(/<p>\s*(?:&nbsp;|\u00a0|\s)*<\/p>/gi, '')
                    .trim();
                return collapsed;
            }
            return it.data || '';
        }).filter(Boolean).join('\n');
    }, [normalizedContents]);

    const project = {
        qrImageUrl: projectDetail?.qrImageUrl ?? "",
        username: ownerProfile.nickname || "user",
        id: projectId ?? 0,
        name: projectDetail?.title ?? "프로젝트 이름",
        owner: ownerProfile.nickname || "사용자",
        category: headerCategories.join("/") || "",
        ownerId: ownerId ?? 0,
        ownerEmail: ownerProfile.email,
        ownerImageUrl: (ownerProfile as any)?.profileImage as string | undefined,
        shareUrl: projectDetail?.shareUrl,
        coverUrl: projectDetail?.coverUrl,
        isOwner,
    } as const;

    const meta = (window as any).__pmMeta || {};
    const bgColor = meta.bg || '#6c7178';
    const gapPx = typeof meta.gap === 'number' ? meta.gap : 10;
    const styles = (
        <style>
            {`
            .pm-preview-content { --pm-gap: ${gapPx}px; }
            .pm-preview-content .ql-editor { padding: 0; width: 100%; max-width: none; margin-left: 0; margin-right: 0; overflow: visible; }
            /* 기본: 모든 인접 형제 요소 간격은 --pm-gap */
            .pm-preview-content .ql-editor > * + * { margin-top: var(--pm-gap) !important; }
            .pm-preview-content .ql-editor p:has(> br:only-child) { margin: 0 !important; height: 0; line-height: 0; padding: 0; }
            /* 임베드 직후 Quill이 삽입한 빈 문단의 마진 제거(이중 간격 방지) */
            .pm-preview-content .ql-editor p:has(> img:only-child) + p:has(> br:only-child),
            .pm-preview-content .ql-editor p:has(> iframe:only-child) + p:has(> br:only-child) { margin-top: 0 !important; }
            /* 기본 블록 요소의 기본 마진 제거 */
            .pm-preview-content .ql-editor h1,
            .pm-preview-content .ql-editor h2,
            .pm-preview-content .ql-editor h3,
            .pm-preview-content .ql-editor h4,
            .pm-preview-content .ql-editor h5,
            .pm-preview-content .ql-editor h6,
            .pm-preview-content .ql-editor p,
            .pm-preview-content .ql-editor blockquote,
            .pm-preview-content .ql-editor ul,
            .pm-preview-content .ql-editor ol,
            .pm-preview-content .ql-editor pre,
            .pm-preview-content .ql-editor table,
            .pm-preview-content .ql-editor figure { margin: 0; }
            .pm-preview-content img, .pm-preview-content iframe { display: block; margin-left: auto; margin-right: auto; }
            .pm-preview-content img { height: auto !important; max-width: 100% !important; width: auto !important; }
            .pm-preview-content iframe { width: 100% !important; height: auto !important; aspect-ratio: 16 / 9; }
            .pm-preview-content iframe.ql-video { width: 100% !important; max-width: none !important; height: auto !important; aspect-ratio: 16 / 9; display: block; }
            /* 에디터와 동일: 텍스트 블록 좌우 여백 적용 */
            .pm-preview-content .ql-editor > p,
            .pm-preview-content .ql-editor > h1,
            .pm-preview-content .ql-editor > h2,
            .pm-preview-content .ql-editor > h3,
            .pm-preview-content .ql-editor > h4,
            .pm-preview-content .ql-editor > h5,
            .pm-preview-content .ql-editor > h6,
            .pm-preview-content .ql-editor > blockquote,
            .pm-preview-content .ql-editor > pre { margin-left: 80px; margin-right: 80px; }
            /* 임베드만 포함한 문단은 좌우 여백 제거 */
            .pm-preview-content .ql-editor > p:has(> img:only-child),
            .pm-preview-content .ql-editor > p:has(> iframe:only-child) { margin-left: 0; margin-right: 0; }
            .pm-preview-content img.pm-embed-padded,
            .pm-preview-content iframe.pm-embed-padded { padding: 0 var(--pm-pad, 0px) var(--pm-pad, 0px) var(--pm-pad, 0px); margin-bottom: calc(-1 * var(--pm-pad, 0px)); background: transparent; box-sizing: border-box; }
            /* 패딩 임베드 뒤 간격: pad 만큼 추가 */
            .pm-preview-content img.pm-embed-padded + *,
            .pm-preview-content iframe.pm-embed-padded + *,
            .pm-preview-content .ql-editor p:has(> img.pm-embed-padded:only-child) + *,
            .pm-preview-content .ql-editor p:has(> iframe.pm-embed-padded:only-child) + * { margin-top: calc(var(--pm-gap) + var(--pm-pad, 0px)) !important; }
            /* 연속 임베드 간격: 항상 --pm-gap (추가 pad는 첫 요소가 먹었음) */
            .pm-preview-content .ql-editor img + img,
            .pm-preview-content .ql-editor img + iframe,
            .pm-preview-content .ql-editor iframe + img,
            .pm-preview-content .ql-editor iframe + iframe { margin-top: var(--pm-gap) !important; }
            .pm-preview-content img.pm-embed-padded[style*="--pm-pad: 0"] { width: 100% !important; max-width: none !important; }
            `}
        </style>
    );

    return (
        <div className="min-h-screen w-full bg-[#6c7178] font-gmarketsans">
            {styles}
            <main className="w-full flex justify-center min-h-[calc(100vh-64px)] py-12">
                <div className="flex flex-row items-start w-full relative" style={{ maxWidth: MAX_WIDTH }}>
                    <div className="flex flex-row items-start">
                        <section
                            className="bg-white rounded-2xl shadow-2xl px-8 py-8 transition-all duration-300"
                            style={{ width: projectWidth, minWidth: 360, maxWidth: PROJECT_WIDE, marginRight: 0, transition: "all 0.4s cubic-bezier(.62,.01,.3,1)", boxShadow: "0 8px 32px 0 rgba(34,34,34,.16)" }}
                        >
                            <ProjectTopInfo
                                projectName={project.name}
                                userName={project.owner}
                                intro={headerSummary}
                                ownerId={project.ownerId}
                                ownerEmail={project.ownerEmail}
                                ownerImageUrl={project.ownerImageUrl}
                                isOwner={project.isOwner}
                                projectId={project.id}
                            />
                            {false && (
                            <div className="mb-6">
                                <ProjectThumbnail imgUrl={project.coverUrl || QueenImg} />
                                </div>
                            )}
                            {/* 콘텐츠를 상단으로 배치: 한 컨테이너로 합쳐 간격 규칙 적용 + 배경색 적용 */}
                            <div className="mt-6 -mx-8 mb-8">
                                <div className="rounded-xl overflow-hidden" style={{ background: bgColor }}>
                                    <div className="px-0 py-8">
                                        <div className="pm-preview-content ql-snow" style={{ ['--pm-gap' as any]: `${gapPx}px` }}>
                                            <div className="ql-editor" dangerouslySetInnerHTML={{ __html: joinedHtml }} />
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <TagList tags={headerCategories} />
                            <div className="mb-8">
                                <ProjectStatsBox likes={0} views={0} comments={0} projectName={project.name} date={headerDate} category={project.category} />
                            </div>
                            <UserProfileBox 
                                userName={project.owner} 
                                ownerId={project.ownerId} 
                                isOwner={project.isOwner}
                                email={project.ownerEmail}
                                profileImageUrl={project.ownerImageUrl}
                                projectId={project.id}
                            />
                        </section>

                        {!commentOpen && (
                            <div className="hidden lg:flex flex-col" style={{ width: ACTIONBAR_WIDTH, minWidth: ACTIONBAR_WIDTH, marginLeft: GAP, height: "100%", position: "relative" }}>
                                <ActionBar onCommentClick={() => setCommentOpen(true)} project={project} />
                            </div>
                        )}
                    </div>

                    {commentOpen && (
                        <div style={{ width: PANEL_WIDTH, minWidth: PANEL_WIDTH, maxWidth: PANEL_WIDTH, borderRadius: "24px", boxShadow: "0 8px 32px 0 rgba(34,34,34,.14)", borderLeft: "1px solid #eee", background: "white", overflow: "hidden", marginLeft: GAP, height: "100%", transition: "all 0.4s cubic-bezier(.62,.01,.3,1)", display: "flex", flexDirection: "column", alignItems: "stretch" }}>
                            <CommentPanel onClose={() => setCommentOpen(false)} username={project.username} projectId={project.id} projectName={project.name} category={project.category} width={PANEL_WIDTH} isLoggedIn={isLoggedIn} />
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}