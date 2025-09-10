import React from "react";
import type { Message } from "../../../types/Message";
import { timeAgo } from "../../../utils/time";
import { Smile, Paperclip, Crop } from "lucide-react";
import {
    postMessage,
    fileUrl,
    fetchRoomMessages,
    fetchRoomParticipants,
    fetchRoomMeta,
    downloadRoomScreenshot,
    sendAttachment,
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

/* ---------- props ---------- */
type Props = {
    message?: Message;
    onSend?: (messageId: number | string, body: string) => Promise<void> | void;
};

/* ---------- 스타일 ---------- */
const youBubble = "max-w-[520px] bg-gray-100 rounded-2xl px-4 py-3 shadow-sm";
const meBubble  = "max-w-[520px] bg-green-50 rounded-2xl px-4 py-3 shadow-sm";

/* ---------- 유틸: 정렬/중복제거 ---------- */
function sortByCreatedAtThenId(a: ServerMessage, b: ServerMessage) {
    const da = new Date(a.createdAt || 0).getTime();
    const db = new Date(b.createdAt || 0).getTime();
    if (da === db) return a.messageId - b.messageId;
    return da - db;
}
function dedupById(list: ServerMessage[]) {
    const map = new Map<number, ServerMessage>();
    for (const m of list) map.set(m.messageId, m);
    return Array.from(map.values());
}
function mergeAndSort(prev: ServerMessage[], add: ServerMessage[]) {
    return dedupById([...prev, ...add]).sort(sortByCreatedAtThenId);
}

/* 상대(나 제외) */
function pickDMOpponent(list: RoomParticipant[], myId: number | null) {
    if (!Array.isArray(list) || myId == null) return undefined;
    return list.find((p) => p.id !== myId);
}

/* 프런트 검증(백엔드 정책과 맞춤) */
const MAX_MB = 10;
const ALLOWED_EXT = ["jpg", "jpeg", "png", "pdf"];

const MessageDetail: React.FC<Props> = ({ message, onSend }) => {
    const [text, setText] = React.useState("");
    const [sending, setSending] = React.useState(false);
    const [uploading, setUploading] = React.useState(false);
    const [isComposing, setIsComposing] = React.useState(false);
    const [showEmoji, setShowEmoji] = React.useState(false);

    const [myId, setMyId] = React.useState<number | null>(null);
    const [history, setHistory] = React.useState<ServerMessage[]>([]);
    const [participants, setParticipants] = React.useState<RoomParticipant[]>([]);
    const [meta, setMeta] = React.useState<RoomMeta | null>(null);

    const taRef = React.useRef<HTMLTextAreaElement>(null);
    const endRef = React.useRef<HTMLDivElement>(null);
    const fileInputRef = React.useRef<HTMLInputElement>(null);
    const firstLoadRef = React.useRef(true);

    React.useEffect(() => {
        let mounted = true;
        getMe().then((u) => mounted && setMyId(u.id)).catch(() => {});
        return () => { mounted = false; };
    }, []);

    const roomId = (message as any)?.roomId as number | undefined;

    /* 히스토리 로드 */
    const loadHistory = React.useCallback(async () => {
        if (!roomId) return;
        try {
            const res = await fetchRoomMessages(roomId, undefined, 100);
            const next = (res.items || []).sort(sortByCreatedAtThenId);
            setHistory((prev) => {
                if (firstLoadRef.current) {
                    firstLoadRef.current = false;
                    return dedupById(next); // 최초는 교체
                }
                return mergeAndSort(prev, next); // 이후 병합
            });
        } catch {
            /* ignore */
        }
    }, [roomId]);

    /* 참가자 로드 */
    const loadParticipants = React.useCallback(async () => {
        if (!roomId) return;
        try {
            const data = await fetchRoomParticipants(roomId);
            setParticipants(data || []);
        } catch {
            setParticipants([]);
        }
    }, [roomId]);

    /* 메타 로드 */
    const loadMeta = React.useCallback(async () => {
        if (!roomId) return;
        try {
            const m = await fetchRoomMeta(roomId);
            setMeta(m);
        } catch {
            setMeta(null);
        }
    }, [roomId]);

    /* 방 바뀌면 초기화 */
    React.useEffect(() => {
        setText("");
        setShowEmoji(false);
        setHistory([]);
        firstLoadRef.current = true;
        loadHistory();
        loadParticipants();
        loadMeta();
    }, [loadHistory, loadParticipants, loadMeta]);

    /* 폴링(WS 붙이기 전) */
    React.useEffect(() => {
        if (!roomId) return;
        const t = setInterval(loadHistory, 5000);
        return () => clearInterval(t);
    }, [roomId, loadHistory]);

    /* 입력창 리사이즈 + 끝으로 스크롤 */
    React.useEffect(() => {
        if (taRef.current) {
            taRef.current.style.height = "auto";
            taRef.current.style.height = taRef.current.scrollHeight + "px";
        }
    }, [text]);
    React.useEffect(() => {
        endRef.current?.scrollIntoView({ block: "end" });
    }, [history.length]);

    /* 상대 userId 추정 */
    const peerIdFromParticipants = React.useMemo(() => {
        const opp = pickDMOpponent(participants, myId);
        return opp?.id;
    }, [participants, myId]);
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
            alert("상대 사용자를 알 수 없어 전송할 수 없어요.");
            return;
        }
        if (isComposing) return;
        const body = text.trim();
        if (!body || sending) return;

        setSending(true);
        try {
            const server = await postMessage({
                targetUserId,
                type: "GENERAL",
                content: body,
            });

            const createdAt = server.createdAt || new Date().toISOString();
            setHistory((prev) =>
                mergeAndSort(prev, [
                    { ...server, createdAt, senderId: myId ?? server.senderId, mine: true },
                ]),
            );

            setText("");
            emitMessagesRefresh();
            await onSend?.(server.messageId, body);
        } catch (e) {
            console.error(e);
            alert("메시지 전송에 실패했어요.");
        } finally {
            setSending(false);
            endRef.current?.scrollIntoView({ block: "end" });
        }
    };

    if (!message) {
        return (
            <div className="flex-1 flex items-center justify-center text-gray-400">
                메시지를 선택하세요.
            </div>
        );
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
        const p = (m.payload || {}) as { url?: string; path?: string; name?: string; mime?: string };
        const src = p.url || (p.path ? fileUrl(p.path) : undefined);
        if (!src) return <div className="text-sm text-gray-500">[파일]</div>;

        const isImage = (p.mime || "").startsWith("image/") || /\.(png|jpe?g)$/i.test(p.name || "");
        if (isImage) {
            return (
                <a href={src} target="_blank" rel="noreferrer">
                    <img
                        src={src}
                        alt={p.name || "attachment"}
                        className="max-w-[320px] max-h-[320px] rounded-lg object-contain"
                    />
                </a>
            );
        }
        // 이미지가 아니면 링크만
        return (
            <a href={src} target="_blank" rel="noreferrer" className="text-sm text-blue-600 underline">
                {p.name || "첨부파일 다운로드"}
            </a>
        );
    };

    return (
        <div className="flex-1 min-h-0 flex flex-col">
            {/* 헤더 */}
            <div className="px-6 py-4 border-b flex items-center gap-3">
                {avatar ? (
                    <img src={avatar} alt={displayName} className="w-9 h-9 rounded-full object-cover" />
                ) : (
                    <div className="w-9 h-9 rounded-full bg-gray-200 flex items-center justify-center text-sm font-semibold text-gray-700">
                        {(displayName?.[0] || "?").toUpperCase()}
                    </div>
                )}
                <div className="flex flex-col">
                    <span className="font-semibold">{displayName}</span>
                    <span className="text-xs text-gray-400">{timeAgo(headerTime)}</span>
                </div>
                <div className="ml-auto flex items-center gap-2">
                    <button
                        type="button"
                        aria-label="대화 캡처"
                        className="text-gray-500 hover:text-gray-700 disabled:opacity-40"
                        disabled={!roomId}
                        onClick={async () => {
                            if (!roomId) return;
                            const panel = document.getElementById("chat-panel");
                            const width = Math.floor(panel?.clientWidth || 960);
                            try {
                                await downloadRoomScreenshot(roomId, { width, tz: "Asia/Seoul", theme: "light" });
                            } catch {
                                alert("대화 캡처에 실패했어요.");
                            }
                        }}
                    >
                        <Crop size={18} />
                    </button>
                </div>
            </div>

            {/* 타임라인 */}
            <div id="chat-panel" className="flex-1 overflow-y-auto p-6 flex flex-col gap-4">
                {history.map((m) => {
                    const when = new Date(m.createdAt || 0);
                    const hhmm = isNaN(when.getTime())
                        ? ""
                        : when.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
                    const mine =
                        typeof m.mine === "boolean" ? m.mine : (myId != null ? m.senderId === myId : false);

                    const body =
                        m.type === "PROJECT_PROPOSAL" || m.type === "PROJECT_OFFER" ? (
                            <ProjectProposalCard data={(m.payload || {}) as ProjectPayload} />
                        ) : m.type === "JOB_OFFER" ? (
                            <JobOfferCard data={(m.payload || {}) as JobOfferPayload} />
                        ) : m.type === "ATTACHMENT" ? (
                            renderAttachment(m)
                        ) : (
                            <div className="whitespace-pre-wrap text-sm text-gray-800">{m.content}</div>
                        );

                    return mine ? (
                        <div
                            key={`${m.messageId}-${m.createdAt ?? ""}`}
                            className="flex items-end gap-2 self-end max-w-full"
                        >
                            <span className="text-[11px] text-gray-400 shrink-0 translate-y-1 order-1">{hhmm}</span>
                            <div className={`${meBubble} order-2`}>{body}</div>
                        </div>
                    ) : (
                        <div
                            key={`${m.messageId}-${m.createdAt ?? ""}`}
                            className="flex items-end gap-2 max-w-full"
                        >
                            <div className={youBubble}>{body}</div>
                            <span className="text-[11px] text-gray-400 shrink-0 translate-y-1">{hhmm}</span>
                        </div>
                    );
                })}
                <div ref={endRef} />
            </div>

            {/* 입력 */}
            <div className="px-6 py-3 border-t flex flex-col gap-2">
                <div className="flex items-end gap-2">
          <textarea
              ref={taRef}
              value={text}
              onChange={(e) => setText(e.currentTarget.value)}
              onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey && !isComposing) {
                      e.preventDefault();
                      handleSendText();
                  }
              }}
              onCompositionStart={() => setIsComposing(true)}
              onCompositionEnd={() => setIsComposing(false)}
              placeholder="메시지 입력 (Enter: 전송, Shift+Enter: 줄바꿈)"
              rows={1}
              className="flex-1 border rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500/30 resize-none"
          />
                    <button
                        type="button"
                        onClick={handleSendText}
                        disabled={!text.trim() || sending || !targetUserId}
                        className="px-4 py-2 bg-gray-900 text-white rounded-xl text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {sending ? "전송 중..." : "전송"}
                    </button>
                </div>

                {/* 이모지/첨부 */}
                <div className="relative flex items-center gap-3 pl-4">
                    <button
                        type="button"
                        aria-label="이모지"
                        className="text-gray-500 hover:text-gray-700"
                        onClick={() => setShowEmoji((v) => !v)}
                    >
                        <Smile size={18} />
                    </button>

                    {showEmoji && (
                        <div className="absolute bottom-10 left-2 z-30">
                            <EmojiPicker
                                onPick={(emoji) => {
                                    setText((prev) => prev + emoji);
                                    setShowEmoji(false);
                                }}
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

                            // 프런트 선검증(백엔드 정책과 맞춤)
                            const ext = (f.name.split(".").pop() || "").toLowerCase();
                            if (!ALLOWED_EXT.includes(ext)) {
                                alert("허용되지 않은 파일 형식이에요. (jpg, jpeg, png, pdf)");
                                inputEl.value = "";
                                return;
                            }
                            if (f.size > MAX_MB * 1024 * 1024) {
                                alert(`파일이 너무 커요. 최대 ${MAX_MB}MB까지 업로드 가능합니다.`);
                                inputEl.value = "";
                                return;
                            }

                            setUploading(true);
                            try {
                                const created = await sendAttachment(roomId, f);
                                const createdAt = created.createdAt || new Date().toISOString();
                                setHistory((prev) =>
                                    mergeAndSort(prev, [
                                        { ...created, createdAt, senderId: myId ?? created.senderId, mine: true },
                                    ]),
                                );
                                emitMessagesRefresh();
                                await onSend?.(created.messageId, created.content ?? "[파일]");
                            } catch (err: any) {
                                console.error(err);
                                const status = err?.response?.status;
                                if (status === 403) alert("채팅방 참여자만 첨부를 보낼 수 있어요.");
                                else if (status === 413) alert("파일이 너무 큽니다.");
                                else if (status === 415) alert("허용되지 않은 파일 형식입니다.");
                                else alert("파일 업로드에 실패했어요.");
                            } finally {
                                setUploading(false);
                                inputEl.value = "";
                            }
                        }}
                    />
                    <button
                        type="button"
                        aria-label="파일"
                        className="text-gray-500 hover:text-gray-700 disabled:opacity-40"
                        disabled={!roomId || uploading}
                        onClick={() => fileInputRef.current?.click()}
                    >
                        <Paperclip size={18} />
                    </button>
                </div>
            </div>
        </div>
    );
};

export default MessageDetail;
