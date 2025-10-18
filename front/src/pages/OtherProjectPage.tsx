import React, { useState, useContext, useEffect, useMemo } from "react";
import ActionBar from "../components/OtherProject/ActionBar/ActionBar";
import ProjectTopInfo from "../components/OtherProject/ProjectTopInfo";
import ProjectThumbnail from "../components/OtherProject/ProjectThumbnail";
import TagList from "../components/OtherProject/TagList";
import ProjectStatsBox from "../components/OtherProject/ProjectStatsBox";
import ProjectGrid from "../components/OtherProject/ProjectGrid";
import CommentPanel from "../components/OtherProject/ActionBar/CommentPanel";
import QueenImg from "../assets/images/Queen.jpg";
import { AuthContext } from "../context/AuthContext";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { fetchProjectDetail, type ProjectDetailResponse, fetchProjectContents, type ProjectContentResponseItem } from "../api/projectApi";
import api from "../api/axiosInstance";

const MAX_WIDTH = 1440;
const PANEL_WIDTH = 440;
const GAP = 25;
const PROJECT_WIDE = 1440;
const PROJECT_NARROW = 1050;
const ACTIONBAR_WIDTH = 80;

function normalizeUrl(u?: string | null): string {
    return String(u || "").trim().toLowerCase().replace(/[?#].*$/, "");
}

// 캐시 유틸: userId별 프로필 정보를 저장/조회 (24h TTL)
const USER_CACHE_PREFIX = "userCache:";
const USER_CACHE_TTL_MS = 24 * 60 * 60 * 1000;
function loadCachedUser(userId?: number) {
    try {
        if (!userId) return null;
        const raw = localStorage.getItem(USER_CACHE_PREFIX + userId);
        if (!raw) return null;
        const parsed = JSON.parse(raw);
        if (!parsed || typeof parsed.ts !== "number" || !parsed.data) return null;
        if (Date.now() - parsed.ts > USER_CACHE_TTL_MS) return null;
        return parsed.data as { id: number; nickname?: string; email?: string; profileImage?: string };
    } catch { return null; }
}
function saveCachedUser(data?: { id: number; nickname?: string; email?: string; profileImage?: string }) {
    try {
        if (!data || !data.id) return;
        localStorage.setItem(USER_CACHE_PREFIX + data.id, JSON.stringify({ ts: Date.now(), data }));
    } catch {}
}

export default function OtherProjectPage() {
    const [commentOpen, setCommentOpen] = useState(false);
    const projectWidth = commentOpen ? PROJECT_NARROW : PROJECT_WIDE;
    const { isLoggedIn } = useContext(AuthContext);
    const nav = useNavigate();
    const location = useLocation();
    const forcePage = !!(location.state as any)?.page; // 상세페이지로 이동에서만 true

    const { ownerId: ownerIdParam, projectId: projectIdParam } = useParams<{ ownerId?: string; projectId?: string }>();
    const ownerId = ownerIdParam ? Number(ownerIdParam) : undefined;
    const projectId = projectIdParam ? Number(projectIdParam) : undefined;

    const [currentUserId, setCurrentUserId] = useState<number | null>(null);
    const [projectDetail, setProjectDetail] = useState<ProjectDetailResponse | null>(null);
    const [ownerProfile, setOwnerProfile] = useState<{ id: number; nickname?: string; email?: string; profileImage?: string | null }>(() => ({ id: ownerId || 0 }));
    const [contents, setContents] = useState<ProjectContentResponseItem[]>([]);
    const [initialFollow, setInitialFollow] = useState<boolean | undefined>(undefined);
    // 카운트 상태 (뷰는 API가 별도 없으므로 일단 0 유지)
    const [likesCount, setLikesCount] = useState(0);
    const [commentsCount, setCommentsCount] = useState(0);

    useEffect(() => {
        if (ownerId && projectId) {
            fetchProjectDetail(ownerId, projectId).then(setProjectDetail).catch(() => {});
            fetchProjectContents(ownerId, projectId).then(setContents).catch(() => setContents([]));
        }
    }, [ownerId, projectId]);

    // 좋아요 카운트 불러오기
    useEffect(() => {
        if (!projectId) return;
        (async () => {
            try {
                const res = await api.get(`/likes`, { params: { targetType: "PROJECT", targetId: projectId } });
                setLikesCount(res.data?.likeCount || 0);
            } catch {
                setLikesCount(0);
            }
        })();
    }, [projectId]);

    // 댓글 카운트 불러오기 (username 필요)
    useEffect(() => {
        if (!ownerProfile?.nickname || !projectId) return;
        (async () => {
            try {
                const { fetchComments } = await import("../api/commentApi");
                const res = await fetchComments(ownerProfile.nickname as string, projectId);
                const list: any[] = res?.data || [];
                const total = list.reduce((acc, c) => acc + 1 + ((c?.subComments?.length as number) || 0), 0);
                setCommentsCount(total);
            } catch {
                setCommentsCount(0);
            }
        })();
    }, [ownerProfile?.nickname, projectId]);

    useEffect(() => {
        // 1) 즉시 스토리지에서 me.id를 읽어 초기 렌더에 소유자 버튼을 최대한 빨리 노출
        try {
            const storedId = Number(localStorage.getItem("userId") || sessionStorage.getItem("userId") || "0");
            if (storedId) setCurrentUserId(storedId);
        } catch {}

        // 1.5) 작성자 캐시 즉시 반영
            try {
            if (ownerId) {
                // 내 자신이면 로컬 스토리지의 닉네임/이메일 선반영
                const myId = Number(localStorage.getItem("userId") || sessionStorage.getItem("userId") || "0");
                if (myId && myId === ownerId) {
                    const nick = localStorage.getItem("userNickname") || sessionStorage.getItem("userNickname") || undefined;
                    const email = localStorage.getItem("userEmail") || sessionStorage.getItem("userEmail") || undefined;
                    const profileImage = localStorage.getItem("userProfileImage") || sessionStorage.getItem("userProfileImage") || undefined;
                    setOwnerProfile(prev => ({ id: ownerId, nickname: nick || prev.nickname, email: email || prev.email, profileImage: (profileImage as any) ?? prev.profileImage }));
                }
                const cached = loadCachedUser(ownerId);
                if (cached) setOwnerProfile(prev => ({ id: ownerId, nickname: cached.nickname || prev.nickname, email: cached.email || prev.email, profileImage: (cached.profileImage as any) ?? prev.profileImage }));
            }
        } catch {}

        async function loadOwnerAndMe(id?: number) {
            try {
                const token = (typeof window !== 'undefined') ? (localStorage.getItem('accessToken') || sessionStorage.getItem('accessToken')) : null;
                // 2) owner, me, follow-status를 병렬로 조회 (가능한 경우)
                const ownerReq = id ? api.get<{ id: number; nickname?: string; email?: string; profileImage?: string }>(`/users/${id}`) : Promise.resolve({ data: undefined } as any);
                const meReq = api.get<{ id: number }>(`/users/me`, { headers: token ? { Authorization: `Bearer ${token}` } : undefined });
                const followReq = (token && id) ? api.get<{ isFollowing: boolean }>(`/users/${id}/follow-status`) : Promise.resolve({ data: { isFollowing: false } } as any);

                const [ownerRes, meRes, followRes] = await Promise.allSettled([ownerReq, meReq, followReq]);

                if (ownerRes.status === 'fulfilled' && ownerRes.value?.data) {
                    const d: any = ownerRes.value.data;
                    const next = { id: d?.id || id || 0, nickname: d?.nickname, email: d?.email, profileImage: d?.profileImage };
                    setOwnerProfile(next);
                    saveCachedUser(next);
                } else {
                    setOwnerProfile(id ? { id, nickname: ownerProfile.nickname } : { id: 0 });
                }

                if (meRes.status === 'fulfilled') {
                    const me = (meRes.value as any).data as { id: number };
                setCurrentUserId(me?.id ?? null);
                } else {
                    setCurrentUserId((prev) => prev ?? null);
                }

                if (followRes.status === 'fulfilled') {
                    setInitialFollow(!!((followRes.value as any).data?.isFollowing));
                } else {
                    setInitialFollow(false);
                }
            } catch {
                setCurrentUserId((prev) => prev ?? null);
                if (id) setOwnerProfile(prev => ({ id, nickname: prev.nickname })); else setOwnerProfile({ id: 0 });
                setInitialFollow(false);
            }
        }
        loadOwnerAndMe(ownerId);
    }, [ownerId]);

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
        return toolsCsv.split(",").map((s) => s.trim()).filter(Boolean);
    }, [projectDetail?.tools]);

    const headerDate = useMemo(() => {
        const d = new Date();
        const y = d.getFullYear();
        const m = String(d.getMonth() + 1).padStart(2, "0");
        const day = String(d.getDate()).padStart(2, "0");
        return `${y}.${m}.${day}`;
    }, []);

    const isOwner = useMemo(() => {
        if (!ownerId) return false;
        // currentUserId는 스토리지 선반영 + API 갱신으로 점진적 보정
        return (currentUserId ?? 0) === ownerId;
    }, [currentUserId, ownerId]);

    const normalizedContents = useMemo(() => {
        const cover = normalizeUrl(projectDetail?.coverUrl || projectDetail?.image);
        return (contents || [])
            .filter((it) => {
                if (!it?.data) return false;
                if (it.type === 'TEXT' && typeof it.data === 'string' && it.data.startsWith('<!--PM_META')) return false;
                if (it.type === "IMAGE") {
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
            if (it.type === 'TEXT') {
                const html = String(it.data || '').trim();
                const collapsed = html
                    .replace(/<p>\s*<br\s*\/?>((\s|&nbsp;|\u00a0)*)<\/p>/gi, '')
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
        initialIsFollowing: initialFollow,
    } as const;

    // 사용자 설정 메타: 배경/간격
    const metaFromContents = useMemo(() => {
        try {
            const first = (contents || []).find(
                (c) => c.type === 'TEXT' && typeof c.data === 'string' && c.data.startsWith('<!--PM_META')
            );
            if (first) {
                const json = first.data.replace(/^<!--PM_META/, '').replace(/-->$/, '');
                return JSON.parse(json);
            }
        } catch {}
        return {} as any;
    }, [contents]);
    const pageBg = (metaFromContents as any)?.bg || '#ffffff';
    const gapPx = typeof (metaFromContents as any)?.gap === 'number' ? (metaFromContents as any).gap : 10;
    const styles = (
        <style>
            {`
            .pm-preview-content { --pm-gap: ${gapPx}px; }
            .pm-preview-content .ql-editor { padding: 0; width: 100%; max-width: none; margin-left: 0; margin-right: 0; overflow: visible; }
            .pm-preview-content .ql-editor > * + * { margin-top: var(--pm-gap) !important; }
            .pm-preview-content .ql-editor p:has(> br:only-child) { margin: 0 !important; height: 0; line-height: 0; padding: 0; }
            .pm-preview-content .ql-editor p:has(> img:only-child) + p:has(> br:only-child),
            .pm-preview-content .ql-editor p:has(> iframe:only-child) + p:has(> br:only-child) { margin-top: 0 !important; }
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
            .pm-preview-content .ql-editor > p,
            .pm-preview-content .ql-editor > h1,
            .pm-preview-content .ql-editor > h2,
            .pm-preview-content .ql-editor > h3,
            .pm-preview-content .ql-editor > h4,
            .pm-preview-content .ql-editor > h5,
            .pm-preview-content .ql-editor > h6,
            .pm-preview-content .ql-editor > blockquote,
            .pm-preview-content .ql-editor > pre { margin-left: 80px; margin-right: 80px; }
            .pm-preview-content .ql-editor > p:has(> img:only-child),
            .pm-preview-content .ql-editor > p:has(> iframe:only-child) { margin-left: 0; margin-right: 0; }
            .pm-preview-content img.pm-embed-padded,
            .pm-preview-content iframe.pm-embed-padded { padding: 0 var(--pm-pad, 0px) var(--pm-pad, 0px) var(--pm-pad, 0px); margin-bottom: calc(-1 * var(--pm-pad, 0px)); background: transparent; box-sizing: border-box; }
            .pm-preview-content img.pm-embed-padded + *,
            .pm-preview-content iframe.pm-embed-padded + *,
            .pm-preview-content .ql-editor p:has(> img.pm-embed-padded:only-child) + *,
            .pm-preview-content .ql-editor p:has(> iframe.pm-embed-padded:only-child) + * { margin-top: calc(var(--pm-gap) + var(--pm-pad, 0px)) !important; }
            .pm-preview-content .ql-editor img + img,
            .pm-preview-content .ql-editor img + iframe,
            .pm-preview-content .ql-editor iframe + img,
            .pm-preview-content .ql-editor iframe + iframe { margin-top: var(--pm-gap) !important; }
            .pm-preview-content img.pm-embed-padded[style*="--pm-pad: 0"] { width: 100% !important; max-width: none !important; }
            `}
        </style>
    );

    // forcePage=true일 때만 페이지 형식, 그 외(기본)는 모달
    if (forcePage) {
        return (
            <div className="min-h-screen w-full bg-[#f5f6f8] font-gmarketsans">
                {styles}
                <style>{`.op-actionbar, .op-actionbar * { color: #000 !important; }`}</style>
                <main className="w-full flex justify-center min-h-[calc(100vh-64px)] py-12">
                    <div className="flex flex-row items-start w-full relative" style={{ maxWidth: MAX_WIDTH }}>
                        <div className="flex flex-row items-start">
                            <section className="bg-white rounded-2xl shadow-2xl px-8 py-8 transition-all duration-300" style={{ width: projectWidth, minWidth: 360, maxWidth: PROJECT_WIDE, marginRight: 0, transition: "all 0.4s cubic-bezier(.62,.01,.3,1)", boxShadow: "0 8px 32px 0 rgba(34,34,34,.16)" }}>
                                <ProjectTopInfo projectName={project.name} userName={project.owner} intro={headerSummary} ownerId={project.ownerId} ownerEmail={project.ownerEmail} ownerImageUrl={project.ownerImageUrl} isOwner={project.isOwner} projectId={project.id} initialIsFollowing={initialFollow} />
                                <div className="mt-6 -mx-8 mb-8">
                                    <div className="rounded-xl overflow-hidden" style={{ background: pageBg }}>
                                        <div className="px-0 py-8">
                                            <div className="pm-preview-content ql-snow" style={{ ['--pm-gap' as any]: `${gapPx}px` }}>
                                                <div className="ql-editor" dangerouslySetInnerHTML={{ __html: joinedHtml }} />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <TagList tags={headerCategories} />
                                <div className="mb-8">
                                    <ProjectStatsBox
                                        likes={likesCount}
                                        views={0}
                                        comments={commentsCount}
                                        projectName={project.name}
                                        date={headerDate}
                                        category={project.category}
                                        projectId={project.id}
                                        ownerName={project.owner}
                                        ownerEmail={project.ownerEmail}
                                        ownerImageUrl={project.ownerImageUrl}
                                        ownerId={project.ownerId}
                                    />
                                </div>
                            </section>
                            {!commentOpen && (
                                <div className={`hidden lg:flex flex-col ${forcePage ? 'op-actionbar' : ''}`} style={{ width: ACTIONBAR_WIDTH, minWidth: ACTIONBAR_WIDTH, marginLeft: GAP, height: "100%", position: "relative" }}>
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

    // 기본: 모달 레이아웃
    return (
        <div className="fixed inset-0 z-[10000] font-gmarketsans">
            {styles}
            <div className="absolute inset-0 bg-black/70" onClick={() => { try { nav(-1); } catch { nav('/search'); } }} />
            <div className="relative z-10 w-full h-full flex justify-center items-start overflow-y-auto py-12" onClick={() => { try { nav(-1); } catch { nav('/search'); } }}>
                <div className="flex flex-row items-start w-full relative px-4" style={{ maxWidth: MAX_WIDTH }}>
                    <div className="flex flex-row items-start">
                        <section className="bg-white rounded-2xl shadow-2xl px-8 py-8 transition-all duration-300" style={{ width: projectWidth, minWidth: 360, maxWidth: PROJECT_WIDE, marginRight: 0, transition: "all 0.4s cubic-bezier(.62,.01,.3,1)", boxShadow: "0 8px 32px 0 rgba(34,34,34,.16)" }} onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
                            <ProjectTopInfo projectName={project.name} userName={project.owner} intro={headerSummary} ownerId={project.ownerId} ownerEmail={project.ownerEmail} ownerImageUrl={project.ownerImageUrl} isOwner={project.isOwner} projectId={project.id} initialIsFollowing={initialFollow} />
                            <div className="mt-6 -mx-8 mb-8">
                                <div className="rounded-xl overflow-hidden" style={{ background: pageBg }}>
                                    <div className="px-0 py-8">
                                        <div className="pm-preview-content ql-snow" style={{ ['--pm-gap' as any]: `${gapPx}px` }}>
                                            <div className="ql-editor" dangerouslySetInnerHTML={{ __html: joinedHtml }} />
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <TagList tags={headerCategories} />
                                <div className="mb-8">
                                <ProjectStatsBox
                                    likes={likesCount}
                                    views={0}
                                    comments={commentsCount}
                                    projectName={project.name}
                                    date={headerDate}
                                    category={project.category}
                                    projectId={project.id}
                                    ownerName={project.owner}
                                    ownerEmail={project.ownerEmail}
                                    ownerImageUrl={project.ownerImageUrl}
                                    ownerId={project.ownerId}
                                />
                            </div>
                        </section>
                        {!commentOpen && (
                            <div className="hidden lg:flex flex-col" style={{ width: ACTIONBAR_WIDTH, minWidth: ACTIONBAR_WIDTH, marginLeft: GAP, height: "100%", position: "relative" }} onClick={(e) => e.stopPropagation()}>
                                <ActionBar onCommentClick={() => setCommentOpen(true)} project={project} />
                            </div>
                        )}
                    </div>
                    {commentOpen && (
                        <div style={{ width: PANEL_WIDTH, minWidth: PANEL_WIDTH, maxWidth: PANEL_WIDTH, borderRadius: "24px", boxShadow: "0 8px 32px 0 rgba(34,34,34,.14)", borderLeft: "1px solid #eee", background: "white", overflow: "hidden", marginLeft: GAP, height: "100%", transition: "all 0.4s cubic-bezier(.62,.01,.3,1)", display: "flex", flexDirection: "column", alignItems: "stretch" }} onClick={(e) => e.stopPropagation()}>
                            <CommentPanel onClose={() => setCommentOpen(false)} username={project.username} projectId={project.id} projectName={project.name} category={project.category} width={PANEL_WIDTH} isLoggedIn={isLoggedIn} />
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}