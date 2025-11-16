// src/components/common/Message/MessageDetail.tsx
import React from "react";
import type { Message } from "../../../types/Message";
import { timeAgo } from "../../../utils/time";
import { Smile, Paperclip, Crop, Download } from "lucide-react"; // ✅ Download 추가
import {
    postMessage,
    fileUrl,
    fetchRoomMessages,
    fetchRoomParticipants,
    fetchRoomMeta,
    downloadRoomScreenshot,
    downloadMessageRangePNG,
    downloadMessageRangePDF,
    sendAttachment,
    getMessage,
    type ServerMessage,
    type RoomParticipant,
    type RoomMeta,
} from "../../../api/messages";
import { getMe } from "../../../api/users";
import EmojiPicker from "./Emoji/EmojiPicker";
import {
    ProjectProposalCard,
    JobOfferCard,
    type ProjectPayload,
    type JobOfferPayload,
} from "./MessageCards";
import { emitMessagesRefresh } from "../../../lib/messageEvents";
import AuthImage from "./AuthImage";
import Toast from "../Toast";
import { 
    calculateVisibleMessageRange, 
    calculateChatPanelWidth, 
    validateMessageRange, 
    formatScreenshotError 
} from "../../../utils/screenshot";

/* ---------- props ---------- */
type Props = {
    message?: Message;
    onSend?: (messageId: number | string, body: string) => Promise<void> | void;
    onBack?: () => void; // 모바일에서 뒤로가기
};

/* ---------- 스타일 ---------- */
const youBubble = "max-w-[520px] xl:max-w-[520px] 2xl:max-w-[520px] bg-gray-100 dark:bg-white/7 border border-gray-200 dark:border-white/10 rounded-2xl px-4 py-3 shadow-sm text-black dark:text-white";
const meBubble = "max-w-[520px] xl:max-w-[520px] 2xl:max-w-[520px] bg-green-50 dark:bg-green-900/25 border border-green-200/60 dark:border-green-400/20 rounded-2xl px-4 py-3 shadow-sm text-black dark:text-white";

/* ---------- 유틸: 정렬/중복제거/병합 ---------- */
function sortByCreatedAtThenId(a: ServerMessage, b: ServerMessage) {
    const da = new Date(a.createdAt || 0).getTime();
    const db = new Date(b.createdAt || 0).getTime();
    if (da === db) return a.messageId - b.messageId;
    return da - db;
}

function mergeMessage(oldM: ServerMessage, newM: ServerMessage): ServerMessage {
    return {
        ...oldM,
        ...newM,
        payload: newM.payload ?? oldM.payload,
        content: newM.content ?? oldM.content,
        createdAt: newM.createdAt ?? oldM.createdAt,
    };
}

function mergeAndSort(prev: ServerMessage[], add: ServerMessage[]) {
    const byId = new Map<number, ServerMessage>();
    for (const m of prev) byId.set(m.messageId, m);
    for (const n of add) {
        const existed = byId.get(n.messageId);
        byId.set(n.messageId, existed ? mergeMessage(existed, n) : n);
    }
    return Array.from(byId.values()).sort(sortByCreatedAtThenId);
}

function dedupById(list: ServerMessage[]) {
    const map = new Map<number, ServerMessage>();
    for (const m of list) map.set(m.messageId, m);
    return Array.from(map.values());
}

/* 상대(나 제외) */
function pickDMOpponent(list: RoomParticipant[], myId: number | null) {
    if (!Array.isArray(list) || myId == null) return undefined;
    return list.find((p) => p.id !== myId);
}

/* ---------- 안전 파서 ---------- */
function parsePayload<T = any>(raw: unknown): T | null {
    if (!raw) return null as any;
    if (typeof raw === "string") {
        try {
            return JSON.parse(raw) as T;
        } catch {
            return null;
        }
    }
    return raw as T;
}

/* 프런트 검증(백엔드 정책과 맞춤) */
const MAX_MB = 10;
const ALLOWED_EXT = ["jpg", "jpeg", "png", "pdf"];

const MessageDetail: React.FC<Props> = ({ message, onSend, onBack }) => {
    const [text, setText] = React.useState("");
    const [sending, setSending] = React.useState(false);
    const [uploading, setUploading] = React.useState(false);
    const [isComposing, setIsComposing] = React.useState(false);
    const [showEmoji, setShowEmoji] = React.useState(false);
    const [showMessageModal, setShowMessageModal] = React.useState<{ visible: boolean; content: string }>({ visible: false, content: "" });

    const [myId, setMyId] = React.useState<number | null>(null);
    const [history, setHistory] = React.useState<ServerMessage[]>([]);
    const [participants, setParticipants] = React.useState<RoomParticipant[]>([]);
    const [meta, setMeta] = React.useState<RoomMeta | null>(null);
    const [errorToast, setErrorToast] = React.useState<{ visible: boolean; message: string }>({
        visible: false,
        message: ''
    });
    const [screenshotLoading, setScreenshotLoading] = React.useState(false);
    const [showScreenshotMenu, setShowScreenshotMenu] = React.useState(false);

    // 카드형 메시지 하이드레이션 캐시
    const [hydrated, setHydrated] = React.useState<Record<number, ServerMessage>>({});

    // history가 갱신될 때, 카드형인데 payload/top-level이 비어있는 항목은 상세 조회로 보강
    React.useEffect(() => {
        const needIds: number[] = [];
        for (const m of history) {
            const isCard = m.type === "PROJECT_OFFER" || m.type === "PROJECT_PROPOSAL" || m.type === "JOB_OFFER";
            if (!isCard) continue;
            const hasAny = !!m.payload || !!m.title || !!m.companyName || !!m.description || !!m.budget;
            if (!hasAny && !hydrated[m.messageId]) needIds.push(m.messageId);
        }
        if (needIds.length === 0) return;
        (async () => {
            const entries: Record<number, ServerMessage> = {};
            for (const id of needIds) {
                try {
                    const full = await getMessage(id);
                    entries[id] = full;
                } catch {}
            }
            if (Object.keys(entries).length > 0) {
                setHydrated(prev => ({ ...prev, ...entries }));
            }
        })();
    }, [history]);

    const taRef = React.useRef<HTMLTextAreaElement>(null);
    const endRef = React.useRef<HTMLDivElement>(null);
    const fileInputRef = React.useRef<HTMLInputElement>(null);
    const firstLoadRef = React.useRef(true);
    const messageContainerRef = React.useRef<HTMLDivElement>(null);

    // 하이드레이트 제어
    const hydratedDone = React.useRef<Set<number>>(new Set());
    const hydrating = React.useRef<Set<number>>(new Set());

    React.useEffect(() => {
        let mounted = true;
        getMe().then((u) => mounted && setMyId(u.id)).catch(() => {});
        return () => { mounted = false; };
    }, []);

    const roomId = (message as any)?.roomId as number | undefined;

    /* 히스토리 로드 (+ 1차 보강) */
    const loadHistory = React.useCallback(async () => {
        if (!roomId) return;
        try {
            const res = await fetchRoomMessages(roomId, undefined, 100);
            let next = (res.items || []).sort(sortByCreatedAtThenId);

            const toHydrate = next.filter(
                (m) => m.type === "ATTACHMENT" && !(m?.payload && (m.payload.url || m.payload.path))
            );
            if (toHydrate.length) {
                const hydrated = await Promise.all(
                    toHydrate.slice(0, 12).map((m) => getMessage(m.messageId).catch(() => null))
                );
                next = mergeAndSort(next, hydrated.filter(Boolean) as ServerMessage[]);
            }

            setHistory((prev) => {
                if (firstLoadRef.current) {
                    firstLoadRef.current = false;
                    return dedupById(next);
                }
                return mergeAndSort(prev, next);
            });
        } catch {}
    }, [roomId]);

    /* 참가자/메타 */
    const loadParticipants = React.useCallback(async () => {
        if (!roomId) return;
        try { setParticipants(await fetchRoomParticipants(roomId) || []); } catch { setParticipants([]); }
    }, [roomId]);

    const loadMeta = React.useCallback(async () => {
        if (!roomId) return;
        try { setMeta(await fetchRoomMeta(roomId)); } catch { setMeta(null); }
    }, [roomId]);

    React.useEffect(() => {
        setText(""); setShowEmoji(false); setHistory([]);
        hydratedDone.current.clear(); hydrating.current.clear();
        firstLoadRef.current = true;
        loadHistory(); loadParticipants(); loadMeta();
    }, [loadHistory, loadParticipants, loadMeta]);

    React.useEffect(() => {
        if (!roomId) return;
        const t = setInterval(loadHistory, 5000);
        return () => clearInterval(t);
    }, [roomId, loadHistory]);

    React.useEffect(() => {
        if (taRef.current) {
            taRef.current.style.height = "auto";
            taRef.current.style.height = taRef.current.scrollHeight + "px";
        }
    }, [text]);
    React.useEffect(() => { endRef.current?.scrollIntoView({ block: "end" }); }, [history.length]);


    /* 스크린샷 관련 함수들 */
    const handleScreenshotPNG = React.useCallback(async () => {
        if (!roomId || screenshotLoading) return;
        
        setScreenshotLoading(true);
        setShowScreenshotMenu(false); // 모달 즉시 닫기
        
        try {
            // 현재 보이는 메시지 범위 계산
            const range = calculateVisibleMessageRange(messageContainerRef.current);
            const validation = validateMessageRange(range.fromId, range.toId);
            
            if (!validation.isValid) {
                setErrorToast({
                    visible: true,
                    message: validation.error || '메시지 범위를 찾을 수 없습니다.'
                });
                return;
            }

            // 패널 너비 계산
            const width = calculateChatPanelWidth(messageContainerRef.current);
            
            await downloadMessageRangePNG(roomId, range.fromId!, range.toId!, {
                width,
                scale: 2,
                theme: 'light'
            });
            
        } catch (error: any) {
            const errorMessage = formatScreenshotError(error);
            setErrorToast({
                visible: true,
                message: errorMessage
            });
        } finally {
            setScreenshotLoading(false);
        }
    }, [roomId, screenshotLoading]);

    const handleScreenshotPDF = React.useCallback(async () => {
        if (!roomId || screenshotLoading) return;
        
        setScreenshotLoading(true);
        setShowScreenshotMenu(false); // 모달 즉시 닫기
        
        try {
            // 현재 보이는 메시지 범위 계산
            const range = calculateVisibleMessageRange(messageContainerRef.current);
            const validation = validateMessageRange(range.fromId, range.toId);
            
            if (!validation.isValid) {
                setErrorToast({
                    visible: true,
                    message: validation.error || '메시지 범위를 찾을 수 없습니다.'
                });
                return;
            }

            // 패널 너비 계산
            const width = calculateChatPanelWidth(messageContainerRef.current);
            
            await downloadMessageRangePDF(roomId, range.fromId!, range.toId!, {
                width,
                theme: 'light'
            });
            
        } catch (error: any) {
            const errorMessage = formatScreenshotError(error);
            setErrorToast({
                visible: true,
                message: errorMessage
            });
        } finally {
            setScreenshotLoading(false);
        }
    }, [roomId, screenshotLoading]);

    const handleRoomScreenshot = React.useCallback(async () => {
        if (!roomId || screenshotLoading) return;
        
        setScreenshotLoading(true);
        setShowScreenshotMenu(false); // 모달 즉시 닫기
        
        try {
            // 패널 너비 계산
            const width = calculateChatPanelWidth(messageContainerRef.current);
            
            await downloadRoomScreenshot(roomId, {
                width,
                theme: 'light'
            });
            
        } catch (error: any) {
            const errorMessage = formatScreenshotError(error);
            setErrorToast({
                visible: true,
                message: errorMessage
            });
        } finally {
            setScreenshotLoading(false);
        }
    }, [roomId, screenshotLoading]);

    /* 2차 보강(실패 자동 재시도) */
    React.useEffect(() => {
        const missing = history.filter((m) => {
            if (m.type !== "ATTACHMENT") return false;
            if (hydratedDone.current.has(m.messageId)) return false;
            if (hydrating.current.has(m.messageId)) return false;
            const p = parsePayload<any>(m.payload);
            return !(p && (p.url || p.path));
        });
        if (!missing.length) return;

        const targets = missing.slice(0, 16);
        targets.forEach((m) => hydrating.current.add(m.messageId));

        (async () => {
            const results = await Promise.all(
                targets.map((m) =>
                    getMessage(m.messageId)
                        .then((full) => ({ ok: true as const, full, id: m.messageId }))
                        .catch(() => ({ ok: false as const, full: null, id: m.messageId }))
                )
            );
            const oks = results.filter((r) => r.ok && r.full) as { ok: true; full: ServerMessage; id: number }[];
            if (oks.length) {
                setHistory((prev) => mergeAndSort(prev, oks.map((r) => r.full)));
                oks.forEach((r) => hydratedDone.current.add(r.id));
            }
            results.forEach((r) => hydrating.current.delete(r.id));
        })();
    }, [history]);

    /* 상대 userId 추정 */
    const peerIdFromParticipants = React.useMemo(() => pickDMOpponent(participants, myId)?.id, [participants, myId]);
    const peerIdFromMessage = (message as any)?.receiverId as number | undefined;
    const peerIdFromHistory = React.useMemo(() => {
        if (!myId || history.length === 0) return undefined;
        const h = history[history.length - 1];
        return h.senderId === myId ? h.receiverId : h.senderId;
    }, [history, myId]);
    const targetUserId = peerIdFromParticipants ?? peerIdFromMessage ?? peerIdFromHistory;

    /* 텍스트 전송 */
    const handleSendText = async () => {
        if (!message || !targetUserId) { 
            setErrorToast({
                visible: true,
                message: "상대 사용자를 알 수 없어 전송할 수 없어요."
            });
            return; 
        }
        if (isComposing) return;
        const body = text.trim(); if (!body || sending) return;

        setSending(true);
        try {
            const server = await postMessage({ targetUserId, type: "GENERAL", content: body });
            const createdAt = server.createdAt || new Date().toISOString();
            setHistory((prev) => mergeAndSort(prev, [{ ...server, createdAt, senderId: myId ?? server.senderId, mine: true }]));
            setText(""); emitMessagesRefresh(); await onSend?.(server.messageId, body);
        } catch { 
            setErrorToast({
                visible: true,
                message: "메시지 전송에 실패했어요."
            });
        }
        finally { setSending(false); endRef.current?.scrollIntoView({ block: "end" }); }
    };

    /* ✅ 보호 경로 다운로드 헬퍼 */
    const downloadProtected = React.useCallback(async (src: string, filename?: string) => {
        try {
            // blob: 이면 바로 저장 시도
            if (src.startsWith("blob:")) {
                const a = document.createElement("a");
                a.href = src; a.download = filename || "attachment";
                document.body.appendChild(a); a.click(); a.remove();
                return;
            }
            // ✅ httpOnly 쿠키 기반: credentials로 자동 전송
            const res = await fetch(src, { credentials: "include" });
            if (!res.ok) throw new Error(String(res.status));
            const blob = await res.blob();
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url; a.download = filename || "attachment";
            document.body.appendChild(a); a.click(); a.remove();
            setTimeout(() => URL.revokeObjectURL(url), 30000);
        } catch (e) {
            console.error("[download] failed", e);
        }
    }, []);

    if (!message) {
        return <div className="flex-1 flex items-center justify-center text-gray-400 dark:text-white/60 text-sm sm:text-base px-4">메시지를 선택하세요.</div>;
    }

    /* 헤더(상대 고정) */
    const headerTime =
        meta?.lastMessageAt ||
        message.createdAt ||
        history[history.length - 1]?.createdAt ||
        new Date().toISOString();

    const peer = pickDMOpponent(participants, myId);
    const displayName = meta?.partnerName || peer?.nickname || message.title;
    const avatar = meta?.partnerAvatarUrl || peer?.profileImage || null;

    /* 첨부 렌더 */
    const renderAttachment = (m: ServerMessage) => {
        type Att = { url?: string; path?: string; name?: string; mime?: string };
        const p = parsePayload<Att>(m.payload);
        if (!p) return <div className="text-sm text-gray-500">[첨부파일] 정보가 없습니다</div>;

        const src = p.url || (p.path ? fileUrl(p.path) : undefined);
        if (!src) return <div className="text-sm text-gray-500">[첨부파일] 정보가 없습니다</div>;

        const isImageByMime = typeof p.mime === "string" && p.mime.startsWith("image/");
        const isImageByName = typeof p.name === "string" && /\.(png|jpe?g|gif|webp|bmp|svg)$/i.test(p.name);

        if (isImageByMime || isImageByName) {
            return (
                <AuthImage
                    src={src}
                    fileName={p.name}
                    alt={p.name || "attachment"}
                    className="block max-w-[320px] max-h-[320px] rounded-lg object-contain"
                />
            );
        }
        return (
            <a href={src} target="_blank" rel="noreferrer" className="text-sm text-blue-600 underline">
                [첨부파일] {p.name || "다운로드"}
            </a>
        );
    };

    return (
        <>
            <Toast
                visible={errorToast.visible}
                message={errorToast.message}
                type="error"
                size="medium"
                autoClose={3000}
                closable={true}
                onClose={() => setErrorToast(prev => ({ ...prev, visible: false }))}
            />
            {/* 메시지 자세히 보기 모달 */}
            {showMessageModal.visible && (
                <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/50" onClick={() => setShowMessageModal({ visible: false, content: "" })}>
                    <div className="bg-white dark:bg-[var(--surface)] rounded-lg p-6 max-w-2xl w-[90vw] max-h-[80vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-semibold text-gray-800 dark:text-white">메시지 내용</h3>
                            <button
                                type="button"
                                onClick={() => setShowMessageModal({ visible: false, content: "" })}
                                className="text-gray-500 hover:text-gray-700 dark:text-white/70 dark:hover:text-white text-2xl leading-none"
                            >
                                ×
                            </button>
                        </div>
                        <div className="whitespace-pre-wrap text-sm text-gray-800 dark:text-white">
                            {showMessageModal.content}
                        </div>
                    </div>
                </div>
            )}
            <div className="flex-1 min-h-0 flex flex-col bg-white dark:bg-[var(--surface)] h-full">
            {/* 헤더 */}
            <div className="px-3 sm:px-6 py-3 sm:py-4 border-b dark:border-[var(--border-color)] flex items-center gap-2 sm:gap-3 text-black dark:text-white">
                {/* 모바일 뒤로가기 버튼 */}
                {onBack && (
                    <button
                        type="button"
                        onClick={onBack}
                        className="md:hidden p-1 hover:bg-gray-100 dark:hover:bg-white/10 rounded"
                        aria-label="뒤로가기"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                        </svg>
                    </button>
                )}
                {avatar ? (
                    <img src={avatar} alt={displayName} className="w-8 h-8 sm:w-9 sm:h-9 rounded-full object-cover" />
                ) : (
                    <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-gray-200 dark:bg-[var(--avatar-bg)] flex items-center justify-center text-xs sm:text-sm font-semibold text-gray-700 dark:text-white">
                        {(displayName?.[0] || "?").toUpperCase()}
                    </div>
                )}
                <div className="flex flex-col min-w-0">
                    <span className="font-semibold text-sm sm:text-base truncate">{displayName}</span>
                    <span className="text-[10px] sm:text-xs text-gray-400 dark:text-white/50">{timeAgo(headerTime)}</span>
                </div>
                <div className="ml-auto flex items-center gap-2">
                    <div className="relative">
                        <button
                            type="button"
                            aria-label="스크린샷"
                            className="text-gray-500 dark:text-white/70 hover:text-gray-700 dark:hover:text-white disabled:opacity-50"
                            disabled={!roomId || screenshotLoading}
                            onClick={() => setShowScreenshotMenu(!showScreenshotMenu)}
                        >
                            <Crop size={18} />
                        </button>
                        
                        {screenshotLoading ? (
                            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
                                <div className="bg-white rounded-lg shadow-lg p-4 w-[280px] text-center">
                                    <div className="text-lg font-semibold text-gray-800 mb-2">캡처 중...</div>
                                    <div className="text-sm text-gray-600">잠시만 기다려주세요</div>
                                </div>
                            </div>
                        ) : showScreenshotMenu ? (
                            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50" onClick={() => setShowScreenshotMenu(false)}>
                                <div className="bg-white rounded-lg shadow-lg p-4 w-[280px]" onClick={(e) => e.stopPropagation()}>
                                    <h3 className="text-lg font-semibold mb-3 text-center">스크린샷 옵션</h3>
                                    <div className="space-y-2">
                                        <button
                                            type="button"
                                            className="w-full px-4 py-2 text-center text-sm bg-gray-50 hover:bg-gray-100 rounded"
                                            onClick={handleRoomScreenshot}
                                        >
                                            전체 대화 캡처
                                        </button>
                                        <button
                                            type="button"
                                            className="w-full px-4 py-2 text-center text-sm bg-gray-50 hover:bg-gray-100 rounded"
                                            onClick={handleScreenshotPNG}
                                        >
                                            보이는 메시지 PNG
                                        </button>
                                        <button
                                            type="button"
                                            className="w-full px-4 py-2 text-center text-sm bg-gray-50 hover:bg-gray-100 rounded"
                                            onClick={handleScreenshotPDF}
                                        >
                                            보이는 메시지 PDF
                                        </button>
                                    </div>
                                    <button
                                        type="button"
                                        className="mt-3 px-6 py-2 text-sm text-gray-600 hover:text-red-600 transition-colors duration-200 mx-auto block"
                                        onClick={() => setShowScreenshotMenu(false)}
                                    >
                                        취소
                                    </button>
                                </div>
                            </div>
                        ) : null}
                    </div>
                </div>
            </div>

            <div id="chat-panel" ref={messageContainerRef} className="flex-1 overflow-y-auto p-3 sm:p-6 flex flex-col gap-3 sm:gap-4 bg-white dark:bg-[var(--surface)]">
                {history.map((m) => {
                    const m2 = hydrated[m.messageId] ?? m;
                    const when = new Date(m2.createdAt || 0);
                    const hhmm = isNaN(when.getTime()) ? "" : when.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
                    const mine = typeof m2.mine === "boolean" ? m2.mine : (myId != null ? m2.senderId === myId : false);

                    // ⬇️ 첨부 메타 (다운로드 버튼용)
                    let attSrc: string | undefined;
                    let attName: string | undefined;
                    if (m2.type === "ATTACHMENT") {
                        const p = parsePayload<{ url?: string; path?: string; name?: string }>(m2.payload);
                        attSrc = p?.url || (p?.path ? fileUrl(p.path) : undefined);
                        attName = p?.name || undefined;
                    }

                    const body =
                        m2.type === "PROJECT_PROPOSAL" || m2.type === "PROJECT_OFFER"
                            ? (() => {
                                  const p = parsePayload<ProjectPayload>(m2.payload) || {} as any;
                                  const filled = {
                                      title: p.title ?? (m2 as any).title,
                                      contact: p.contact ?? (m2 as any).contact,
                                      budget: p.budget ?? (m2 as any).budget,
                                      description: p.description ?? (m2 as any).description,
                                      attachments: p.attachments,
                                  } as ProjectPayload;
                                  return <ProjectProposalCard data={filled} />;
                              })()
                            : m2.type === "JOB_OFFER"
                                ? (() => {
                                      const p = parsePayload<JobOfferPayload>(m2.payload) || {} as any;
                                      const filled = {
                                          companyName: p.companyName ?? (m2 as any).companyName,
                                          position: p.position ?? (m2 as any).position,
                                          salary: p.salary ?? (m2 as any).salary,
                                          location: p.location ?? (m2 as any).location,
                                          description: p.description ?? (m2 as any).description,
                                          isNegotiable: p.isNegotiable ?? (m2 as any).isNegotiable,
                                          attachments: p.attachments,
                                      } as JobOfferPayload;
                                      return <JobOfferCard data={filled} />;
                                  })()
                                : m2.type === "ATTACHMENT"
                                    ? renderAttachment(m2)
                                    : (() => {
                                        const content = m2.content || "";
                                        const isLong = content.length > 300;
                                        const displayContent = isLong ? content.substring(0, 300) + "..." : content;
                                        return (
                                            <div className="whitespace-pre-wrap text-sm text-gray-800">
                                                {displayContent}
                                                {isLong && (
                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            setShowMessageModal({ visible: true, content });
                                                        }}
                                                        className="ml-2 text-blue-600 hover:text-blue-800 underline text-xs"
                                                    >
                                                        자세히 보기
                                                    </button>
                                                )}
                                            </div>
                                        );
                                    })();

                    return mine ? (
                        <div key={m.messageId} data-message-id={m.messageId} className="flex items-end gap-2 self-end max-w/full max-w-[100%]">
                            {/* ⬇️ 시간 + 작은 다운로드 버튼 (오른쪽 정렬 라인) */}
                            <div className="flex items-center gap-1 order-1">
                                <span className="text-[11px] text-gray-400 dark:text-white/50 shrink-0 translate-y-1">{hhmm}</span>
                                {attSrc && (
                                    <button
                                        type="button"
                                        onClick={() => downloadProtected(attSrc!, attName)}
                                        className="p-0.5 rounded hover:bg-gray-100 dark:hover:bg-white/10 text-gray-400 dark:text-white/60"
                                        title="다운로드"
                                        aria-label="다운로드"
                                    >
                                        <Download size={14} />
                                    </button>
                                )}
                            </div>
                            <div className={`${meBubble} order-2`}>{body}</div>
                        </div>
                    ) : (
                        <div key={m.messageId} data-message-id={m.messageId} className="flex items-end gap-2 max-w-full">
                            <div className={youBubble}>{body}</div>
                            {/* ⬇️ 시간 + 작은 다운로드 버튼 (왼쪽 라인) */}
                            <div className="flex items-center gap-1">
                                {attSrc && (
                                    <button
                                        type="button"
                                        onClick={() => downloadProtected(attSrc!, attName)}
                                        className="p-0.5 rounded hover:bg-gray-100 dark:hover:bg-white/10 text-gray-400 dark:text-white/60"
                                        title="다운로드"
                                        aria-label="다운로드"
                                    >
                                        <Download size={14} />
                                    </button>
                                )}
                                <span className="text-[11px] text-gray-400 dark:text-white/50 shrink-0 translate-y-1">{hhmm}</span>
                            </div>
                        </div>
                    );
                })}
                <div ref={endRef} />
            </div>

            {/* 입력 */}
            <div className="px-3 sm:px-6 py-2 sm:py-3 border-t dark:border-[var(--border-color)] flex flex-col gap-1.5 sm:gap-2 bg-white dark:bg-[var(--surface)]">
                <div className="flex items-end gap-1.5 sm:gap-2">
          <textarea
              ref={taRef}
              value={text}
              onChange={(e) => {
                  const newText = e.currentTarget.value;
                  if (newText.length <= 500) {
                      setText(newText);
                  }
              }}
              onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey && !isComposing) {
                      e.preventDefault();
                      handleSendText();
                  }
              }}
              onCompositionStart={() => setIsComposing(true)}
              onCompositionEnd={() => setIsComposing(false)}
              placeholder="메시지 입력 (최대 500자)"
              rows={1}
              maxLength={500}
              className="flex-1 border border-gray-200 dark:border-[var(--border-color)] bg-white dark:bg-black rounded-xl px-3 sm:px-4 py-2 text-xs sm:text-sm text-black dark:text-white placeholder:text-gray-400 dark:placeholder:text-white/60 focus:outline-none focus:ring-2 focus:ring-green-500/30 resize-none"
          />
                    <button
                        type="button"
                        onClick={handleSendText}
                        disabled={!text.trim() || sending || !targetUserId}
                        className="px-3 sm:px-4 py-2 bg-black text-white dark:bg-white dark:text-black rounded-xl text-xs sm:text-sm disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
                    >
                        {sending ? "전송 중..." : "전송"}
                    </button>
                </div>
                
                {/* 문자 수 표시 */}
                <div className="flex justify-end">
                    <span className={`text-xs ${text.length > 450 ? 'text-red-500' : text.length > 300 ? 'text-orange-500' : 'text-gray-400 dark:text-white/50'}`}>
                        {text.length}/500
                    </span>
                </div>

                {/* 이모지/첨부 */}
                <div className="relative flex items-center gap-2 sm:gap-3 pl-2 sm:pl-4">
                    <button type="button" aria-label="이모지" className="text-gray-500 dark:text-white/70 hover:text-gray-700 dark:hover:text-white" onClick={() => setShowEmoji((v) => !v)}>
                        <Smile size={18} />
                    </button>

                    {showEmoji && (
                        <div className="absolute bottom-10 left-2 z-30">
                            <EmojiPicker
                                onPick={(emoji) => { setText((prev) => prev + emoji); setShowEmoji(false); }}
                                onClose={() => setShowEmoji(false)}
                            />
                        </div>
                    )}

                    <input
                        ref={fileInputRef}
                        type="file"
                        className="hidden"
                        accept="image/*,application/pdf"
                        onChange={async (e) => {
                            const inputEl = e.currentTarget;
                            const f = inputEl.files?.[0];
                            if (!f || !roomId || !targetUserId) return;

                            const ext = (f.name.split(".").pop() || "").toLowerCase();
                            if (!ALLOWED_EXT.includes(ext)) { 
                                setErrorToast({
                                    visible: true,
                                    message: "허용되지 않은 파일 형식이에요. (jpg, jpeg, png, pdf)"
                                });
                                inputEl.value = ""; 
                                return; 
                            }
                            if (f.size > MAX_MB * 1024 * 1024) { 
                                setErrorToast({
                                    visible: true,
                                    message: `파일이 너무 커요. 최대 ${MAX_MB}MB까지 업로드 가능합니다.`
                                });
                                inputEl.value = ""; 
                                return; 
                            }

                            setUploading(true);
                            try {
                                const created = await sendAttachment(roomId, f);
                                const createdAt = created.createdAt || new Date().toISOString();
                                setHistory((prev) => mergeAndSort(prev, [{ ...created, createdAt, senderId: myId ?? created.senderId, mine: true }]));
                                emitMessagesRefresh();
                                await onSend?.(created.messageId, created.content ?? "[파일]");
                            } catch (err: any) {
                                const status = err?.response?.status;
                                if (status === 403) {
                                    setErrorToast({
                                        visible: true,
                                        message: "채팅방 참여자만 첨부를 보낼 수 있어요."
                                    });
                                }
                                else if (status === 413) {
                                    setErrorToast({
                                        visible: true,
                                        message: "파일이 너무 큽니다."
                                    });
                                }
                                else if (status === 415) {
                                    setErrorToast({
                                        visible: true,
                                        message: "허용되지 않은 파일 형식입니다."
                                    });
                                }
                                else {
                                    setErrorToast({
                                        visible: true,
                                        message: "파일 업로드에 실패했어요."
                                    });
                                }
                            } finally {
                                setUploading(false);
                                inputEl.value = "";
                            }
                        }}
                    />
                    <button
                        type="button"
                        aria-label="파일"
                        className="text-gray-500 dark:text-white/70 hover:text-gray-700 dark:hover:text-white disabled:opacity-40"
                        disabled={!roomId || uploading}
                        onClick={() => fileInputRef.current?.click()}
                    >
                        <Paperclip size={18} />
                    </button>
                </div>
            </div>
        </div>
        </>
    );
};

export default MessageDetail;
