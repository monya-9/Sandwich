import React from "react";
import type { Message } from "../../../types/Message";
import { timeAgo } from "../../../utils/time";
import { Smile, Paperclip, Crop } from "lucide-react";
import {
    postMessage,
    uploadAttachment,
    downloadRoomScreenshot,
    fetchRoomMessages,
    ServerMessage,
} from "../../../api/messages";
import { serverToUi } from "../../../api/message.adapter";
import { getMe } from "../../../api/users";
import EmojiPicker from "./Emoji/EmojiPicker";

type Props = {
    message?: Message;
    onSend?: (messageId: number | string, body: string) => Promise<void> | void;
    /** 읽음은 상위(MessagesPage)에서 처리 */
    onMarkRead?: (messageId: number | string) => void;
};

const youBubble = "max-w-[520px] bg-gray-100 rounded-2xl px-4 py-3 shadow-sm";
const meBubble = "max-w-[520px] bg-green-50 rounded-2xl px-4 py-3 shadow-sm";

/** 히스토리 아이템 UI */
type UiLine = {
    id: string;
    me: boolean;
    content: string;
    at: string; // ISO
};

const MessageDetail: React.FC<Props> = ({ message, onSend }) => {
    const [text, setText] = React.useState("");
    const [sending, setSending] = React.useState(false);
    const [uploading, setUploading] = React.useState(false);
    const [isComposing, setIsComposing] = React.useState(false);
    const [showEmoji, setShowEmoji] = React.useState(false);
    const [myId, setMyId] = React.useState<number | null>(null);
    const [history, setHistory] = React.useState<UiLine[]>([]);

    const taRef = React.useRef<HTMLTextAreaElement>(null);
    const endRef = React.useRef<HTMLDivElement>(null);
    const fileInputRef = React.useRef<HTMLInputElement>(null);
    const caretRef = React.useRef<{ start: number; end: number }>({
        start: 0,
        end: 0,
    });

    const roomId = (message as any)?.roomId as number | undefined;

    // 내 id 1회 조회
    React.useEffect(() => {
        let mounted = true;
        getMe()
            .then((u) => mounted && setMyId(u.id))
            .catch(() => {});
        return () => {
            mounted = false;
        };
    }, []);

    // 방 히스토리 로드
    React.useEffect(() => {
        setHistory([]);
        setText("");
        setShowEmoji(false);

        if (!roomId) return;

        (async () => {
            try {
                const res = await fetchRoomMessages(roomId);
                const lines = (res.items || []).map((m: ServerMessage) => ({
                    id: String(m.messageId),
                    me: myId != null ? m.senderId === myId : false,
                    content: m.content ?? "",
                    at: m.createdAt || new Date().toISOString(),
                }));
                setHistory(lines);
            } catch (e) {
                console.warn("[history] load failed:", e);
                setHistory([]);
            }
        })();
        // myId가 나중에 올 수도 있으니, myId 변화에도 재매핑
    }, [roomId, myId]);

    // 입력창 자동 리사이즈
    React.useEffect(() => {
        if (!taRef.current) return;
        taRef.current.style.height = "auto";
        taRef.current.style.height = taRef.current.scrollHeight + "px";
    }, [text]);

    // 항상 아래로 스크롤
    React.useEffect(() => {
        endRef.current?.scrollIntoView({ block: "end" });
    }, [history]);

    // 전송 대상 ID: 우선 메시지(receiverId=상대) → 없으면 히스토리/내ID로 추론
    const targetUserId = React.useMemo(() => {
        const fallback = (message as any)?.receiverId as number | undefined;
        if (fallback) return fallback;
        if (!myId || history.length === 0) return undefined;
        // 히스토리에서 나 아닌 senderId를 상대라고 가정
        // (가장 최근 발화자 기준)
        const last = history[history.length - 1];
        // last.me === true면 상대는 receiver, 하지만 히스토리 UI에는 id가 없음.
        // 안전하게 myId 기반 추론은 메시지 전송 시 서버가 roomId만으로 상대를 결정하면 불필요.
        return undefined;
    }, [message, myId, history]);

    const handleSendText = async () => {
        if (!roomId) return;
        if (isComposing) return;
        const body = text.trim();
        if (!body || sending) return;

        if (!targetUserId) {
            alert("상대 사용자를 알 수 없어 전송할 수 없어요.");
            return;
        }

        setSending(true);
        try {
            // 서버 전송
            const server = await postMessage({
                targetUserId,
                type: "GENERAL",
                content: body,
            });

            // 낙관적/실제 반영
            const ui = serverToUi(server, {
                senderName: "me",
                createdAt: server.createdAt ?? new Date().toISOString(),
            });
            setHistory((prev) => [
                ...prev,
                { id: String(ui.id), me: true, content: ui.content, at: ui.createdAt },
            ]);
            setText("");

            await onSend?.(ui.id, ui.content);
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

    return (
        <div className="flex-1 min-h-0 flex flex-col">
            {/* 헤더 */}
            <div className="px-6 py-4 border-b flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-gray-200 flex items-center justify-center text-sm">
                    {message.sender?.[0]?.toUpperCase() ?? "?"}
                </div>
                <div className="flex flex-col">
                    <span className="font-semibold">{message.sender}</span>
                    <span className="text-xs text-gray-400">
            {timeAgo(message.createdAt)}
          </span>
                </div>

                <div className="ml-auto flex items-center gap-2">
                    {/* 대화 캡처 */}
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
            <div
                id="chat-panel"
                className="flex-1 overflow-y-auto p-6 flex flex-col gap-4"
            >
                {history.map((h) =>
                        h.me ? (
                            <div key={h.id} className="flex items-end gap-2 self-end max-w-full">
              <span className="text-[11px] text-gray-400 shrink-0 translate-y-1 order-1">
                {new Date(h.at).toLocaleTimeString([], {
                    hour: "numeric",
                    minute: "2-digit",
                })}
              </span>
                                <div className={`${meBubble} order-2`}>
                                    <div className="whitespace-pre-wrap text-sm text-gray-800">
                                        {h.content}
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div key={h.id} className="flex items-end gap-2 max-w-full">
                                <div className={youBubble}>
                                    <div className="whitespace-pre-wrap text-sm text-gray-800">
                                        {h.content}
                                    </div>
                                </div>
                                <span className="text-[11px] text-gray-400 shrink-0 translate-y-1">
                {new Date(h.at).toLocaleTimeString([], {
                    hour: "numeric",
                    minute: "2-digit",
                })}
              </span>
                            </div>
                        )
                )}

                <div ref={endRef} />
            </div>

            {/* 입력 영역 */}
            <div className="px-6 py-3 border-t flex flex-col gap-2">
                <div className="flex items-end gap-2">
          <textarea
              ref={taRef}
              value={text}
              onChange={(e) => {
                  setText(e.currentTarget.value);
                  caretRef.current = {
                      start: e.currentTarget.selectionStart ?? 0,
                      end: e.currentTarget.selectionEnd ?? 0,
                  };
              }}
              onSelect={(e) => {
                  const t = e.currentTarget;
                  caretRef.current = {
                      start: t.selectionStart ?? 0,
                      end: t.selectionEnd ?? 0,
                  };
              }}
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
                                    const ta = taRef.current;
                                    if (!ta) return;
                                    const { start, end } = caretRef.current;
                                    setText((prev) => {
                                        const before = prev.slice(0, start);
                                        const after = prev.slice(end);
                                        const next = before + emoji + after;
                                        requestAnimationFrame(() => {
                                            if (taRef.current) {
                                                const pos = start + emoji.length;
                                                taRef.current.focus();
                                                taRef.current.setSelectionRange(pos, pos);
                                                caretRef.current = { start: pos, end: pos };
                                            }
                                        });
                                        return next;
                                    });
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
                                const ui = serverToUi(s, { senderName: "me" });
                                setHistory((prev) => [
                                    ...prev,
                                    {
                                        id: String(ui.id),
                                        me: true,
                                        content: `[파일] ${f.name}`,
                                        at: ui.createdAt,
                                    },
                                ]);
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
