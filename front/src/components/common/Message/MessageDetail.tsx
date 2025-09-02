// src/components/common/Message/MessageDetail.tsx
import React from "react";
import type { Message } from "../../../types/Message";
import { timeAgo } from "../../../utils/time";
import { Smile, Paperclip, Crop } from "lucide-react";
import {
    postMessage,
    uploadAttachment,
    downloadRoomScreenshot,
    fetchRoomMessages,
    type ServerMessage,
} from "../../../api/messages";
import { getMe } from "../../../api/users";
import EmojiPicker from "./Emoji/EmojiPicker";

type Props = {
    message?: Message;
    onSend?: (messageId: number | string, body: string) => Promise<void> | void;
};

const youBubble = "max-w-[520px] bg-gray-100 rounded-2xl px-4 py-3 shadow-sm";
const meBubble = "max-w-[520px] bg-green-50 rounded-2xl px-4 py-3 shadow-sm";

const MessageDetail: React.FC<Props> = ({ message, onSend }) => {
    const [text, setText] = React.useState("");
    const [sending, setSending] = React.useState(false);
    const [uploading, setUploading] = React.useState(false);
    const [isComposing, setIsComposing] = React.useState(false);
    const [showEmoji, setShowEmoji] = React.useState(false);

    const [myId, setMyId] = React.useState<number | null>(null);
    const [history, setHistory] = React.useState<ServerMessage[]>([]); // 서버 히스토리

    const taRef = React.useRef<HTMLTextAreaElement>(null);
    const endRef = React.useRef<HTMLDivElement>(null);
    const fileInputRef = React.useRef<HTMLInputElement>(null);

    // 내 id 로드
    React.useEffect(() => {
        let mounted = true;
        getMe()
            .then((u) => mounted && setMyId(u.id))
            .catch(() => {});
        return () => {
            mounted = false;
        };
    }, []);

    // 목록에서 내려준 메타
    const roomId = (message as any)?.roomId as number | undefined;
    const peerId = (message as any)?.receiverId as number | undefined; // 상대 id(목록 맵핑 때 넣어둔 값)

    // 히스토리 로드
    const loadHistory = React.useCallback(async () => {
        if (!roomId) return;
        try {
            const res = await fetchRoomMessages(roomId, undefined, 30);
            const items = [...(res.items || [])].sort((a, b) => {
                const da = new Date(a.createdAt || 0).getTime();
                const db = new Date(b.createdAt || 0).getTime();
                if (da === db) return a.messageId - b.messageId;
                return da - db;
            });
            setHistory(items);
        } catch (e) {
            console.warn("[history] fetchRoomMessages failed:", e);
            setHistory([]);
        }
    }, [roomId]);

    // 방 바뀌면 초기화 + 로드
    React.useEffect(() => {
        setText("");
        setShowEmoji(false);
        setHistory([]);
        loadHistory();
    }, [loadHistory]);

    // 간단 폴링 (5초)
    React.useEffect(() => {
        if (!roomId) return;
        const t = setInterval(loadHistory, 5000);
        return () => clearInterval(t);
    }, [roomId, loadHistory]);

    // 입력창 자동 리사이즈
    React.useEffect(() => {
        if (taRef.current) {
            taRef.current.style.height = "auto";
            taRef.current.style.height = taRef.current.scrollHeight + "px";
        }
    }, [text]);

    // 항상 아래로 스크롤
    React.useEffect(() => {
        endRef.current?.scrollIntoView({ block: "end" });
    }, [history.length]);

    // 상대 userId 계산 (우선 목록의 receiverId → 없으면 히스토리에서 추정)
    const targetUserId = React.useMemo(() => {
        if (peerId) return peerId;
        if (!myId || history.length === 0) return undefined;
        const h = history[history.length - 1];
        return h.senderId === myId ? h.receiverId : h.senderId;
    }, [peerId, myId, history]);

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

            // 서버 응답을 바로 히스토리에 반영
            const createdAt = server.createdAt || new Date().toISOString();
            setHistory((prev) =>
                [...prev, { ...server, createdAt }].sort((a, b) => {
                    const da = new Date(a.createdAt || 0).getTime();
                    const db = new Date(b.createdAt || 0).getTime();
                    if (da === db) return a.messageId - b.messageId;
                    return da - db;
                })
            );
            setText("");

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

    // 헤더 시간: 목록 기준(없으면 히스토리 최신)
    const headerTime =
        message.createdAt ||
        history[history.length - 1]?.createdAt ||
        new Date().toISOString();

    return (
        <div className="flex-1 min-h-0 flex flex-col">
            {/* 헤더 */}
            <div className="px-6 py-4 border-b flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-gray-200 flex items-center justify-center text-sm">
                    {message.sender?.[0]?.toUpperCase() ?? "?"}
                </div>
                <div className="flex flex-col">
                    <span className="font-semibold">{message.sender}</span>
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
                                await downloadRoomScreenshot(roomId, {
                                    width,
                                    tz: "Asia/Seoul",
                                    theme: "light",
                                });
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
                    // ✅ myId가 아직 없어도 peerId로 임시 판별: 내 메시지는 senderId !== peerId
                    const mine =
                        myId != null ? m.senderId === myId : peerId != null ? m.senderId !== peerId : false;

                    const when = new Date(m.createdAt || 0);
                    const hhmm = isNaN(when.getTime())
                        ? ""
                        : when.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });

                    return mine ? (
                        <div key={m.messageId} className="flex items-end gap-2 self-end max-w-full">
                            <span className="text-[11px] text-gray-400 shrink-0 translate-y-1 order-1">{hhmm}</span>
                            <div className={`${meBubble} order-2`}>
                                <div className="whitespace-pre-wrap text-sm text-gray-800">{m.content}</div>
                            </div>
                        </div>
                    ) : (
                        <div key={m.messageId} className="flex items-end gap-2 max-w-full">
                            <div className={youBubble}>
                                <div className="whitespace-pre-wrap text-sm text-gray-800">{m.content}</div>
                            </div>
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
                        onChange={async (e) => {
                            const f = e.target.files?.[0];
                            if (!f || !roomId) return;
                            setUploading(true);
                            try {
                                const s = await uploadAttachment(roomId, f);
                                const createdAt = s.createdAt || new Date().toISOString();
                                setHistory((prev) =>
                                    [...prev, { ...s, createdAt }].sort((a, b) => {
                                        const da = new Date(a.createdAt || 0).getTime();
                                        const db = new Date(b.createdAt || 0).getTime();
                                        if (da === db) return a.messageId - b.messageId;
                                        return da - db;
                                    })
                                );
                            } catch {
                                alert("파일 업로드에 실패했어요.");
                            } finally {
                                setUploading(false);
                                e.currentTarget.value = "";
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
