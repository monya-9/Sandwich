// src/components/common/Message/MessageDetail.tsx
import React from "react";
import type { Message } from "../../../types/Message";
import { timeAgo } from "../../../utils/time";
import { Smile, Paperclip, Crop } from "lucide-react";
import { postMessage, uploadAttachment } from "../../../api/messages";
import { serverToUi } from "../../../api/message.adapter";
import EmojiPicker from "./Emoji/EmojiPicker";

type Props = {
    message?: Message;
    onSend?: (messageId: number | string, body: string) => Promise<void> | void;
    onMarkRead?: (messageId: number | string) => void;
};

const youBubble =
    "max-w-[520px] bg-gray-100 rounded-2xl px-4 py-3 shadow-sm";
const meBubble =
    "max-w-[520px] bg-green-50 rounded-2xl px-4 py-3 shadow-sm";

/** 서버에서 상대 메시지가 한 문자열로 붙어올 때 깔끔히 분리 */
function chunkYouMessages(content?: string | null): string[] {
    if (!content) return [];
    const raw = content.trim();

    // 1) JSON 배열 문자열 (["a","b"]) 지원
    try {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
            return parsed
                .map((x) => (x == null ? "" : String(x).trim()))
                .filter(Boolean);
        }
    } catch {
        /* not a json array */
    }

    // 2) 빈 줄 기준 분리
    return raw
        .split(/\r?\n{2,}/g)
        .map((s) => s.trim())
        .filter(Boolean);
}

const MessageDetail: React.FC<Props> = ({ message, onSend, onMarkRead }) => {
    const [text, setText] = React.useState("");
    const [sending, setSending] = React.useState(false);
    const [isComposing, setIsComposing] = React.useState(false);
    const [showEmoji, setShowEmoji] = React.useState(false);
    const [replies, setReplies] = React.useState<
        { id: string; content: string; createdAt: string }[]
    >([]);

    const taRef = React.useRef<HTMLTextAreaElement>(null);
    const endRef = React.useRef<HTMLDivElement>(null);
    const fileInputRef = React.useRef<HTMLInputElement>(null);

    // 커서 위치 보존해서 이모지/텍스트 삽입
    const caretRef = React.useRef<{ start: number; end: number }>({
        start: 0,
        end: 0,
    });

    const youChunks = React.useMemo(
        () => chunkYouMessages(message?.content),
        [message?.content]
    );

    // 선택 스레드 바뀌면 초기화 + 읽음 처리
    React.useEffect(() => {
        setText("");
        setReplies([]);
        setShowEmoji(false);
        if (message && !message.isRead) onMarkRead?.(message.id);
    }, [message, onMarkRead]);

    // textarea auto-resize
    React.useEffect(() => {
        if (!taRef.current) return;
        taRef.current.style.height = "auto";
        taRef.current.style.height = taRef.current.scrollHeight + "px";
    }, [text]);

    // 스크롤 맨 아래로
    React.useEffect(() => {
        endRef.current?.scrollIntoView({ block: "end" });
    }, [replies, message, youChunks.length]);

    const handleSendText = async () => {
        if (!message) return;
        if (isComposing) return;
        const body = text.trim();
        if (!body || sending) return;

        setSending(true);
        try {
            const server = await postMessage({
                targetUserId: (message as any).senderId ?? (message as any).receiverId ?? 0,
                type: "GENERAL",
                content: body,
            });

            const ui = serverToUi(server, {
                senderName: "me",
                createdAt: new Date().toISOString(),
            });

            setReplies((prev) => [
                ...prev,
                { id: String(ui.id), content: ui.content, createdAt: ui.createdAt },
            ]);
            setText("");

            await onSend?.(ui.id, ui.content);
        } finally {
            setSending(false);
            endRef.current?.scrollIntoView({ block: "end" });
        }
    };

    // 커서 위치에 이모지 삽입
    const handlePickEmoji = (emoji: string) => {
        const ta = taRef.current;
        if (!ta) return;

        const { start, end } = caretRef.current;
        setText((prev) => {
            const before = prev.slice(0, start);
            const after = prev.slice(end);
            const next = before + emoji + after;

            // 다음 프레임에 커서 이동
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
                    <span className="text-xs text-gray-400">{timeAgo(message.createdAt)}</span>
                </div>
            </div>

            {/* 타임라인 */}
            <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-4">
                <div className="mx-auto text-center text-[11px] text-gray-400">
                    {new Date(message.createdAt).toLocaleDateString()}
                </div>

                {/* 상대 메시지(자동 분리 렌더링) */}
                {youChunks.map((chunk, idx) => (
                    <div key={`you-${idx}`} className="flex items-end gap-2 max-w-full">
                        <div className={youBubble}>
                            <div className="whitespace-pre-wrap text-sm text-gray-800">
                                {chunk}
                            </div>
                        </div>
                        <span className="text-[11px] text-gray-400 shrink-0 translate-y-1">
              {new Date(message.createdAt).toLocaleTimeString([], {
                  hour: "numeric",
                  minute: "2-digit",
              })}
            </span>
                    </div>
                ))}

                {/* 내 답장들 */}
                {replies.map((r) => (
                    <div key={r.id} className="flex items-end gap-2 self-end max-w-full">
            <span className="text-[11px] text-gray-400 shrink-0 translate-y-1 order-1">
              {new Date(r.createdAt).toLocaleTimeString([], {
                  hour: "numeric",
                  minute: "2-digit",
              })}
            </span>
                        <div className={`${meBubble} order-2`}>
                            <div className="whitespace-pre-wrap text-sm text-gray-800">
                                {r.content}
                            </div>
                        </div>
                    </div>
                ))}

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
                        disabled={!text.trim() || sending}
                        className="px-4 py-2 bg-gray-900 text-white rounded-xl text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {sending ? "전송 중..." : "전송"}
                    </button>
                </div>

                {/* 아이콘 줄 + 이모지 패널 */}
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
                            <EmojiPicker onPick={handlePickEmoji} onClose={() => setShowEmoji(false)} />
                        </div>
                    )}

                    <input
                        ref={fileInputRef}
                        type="file"
                        className="hidden"
                        onChange={async (e) => {
                            const f = e.target.files?.[0];
                            if (!f || !(message as any)?.roomId) return;
                            try {
                                const s = await uploadAttachment((message as any).roomId, f);
                                const ui = serverToUi(s, { senderName: "me" });
                                setReplies((prev) => [
                                    ...prev,
                                    { id: String(ui.id), content: `[파일] ${f.name}`, createdAt: ui.createdAt },
                                ]);
                            } catch {
                                alert("파일 업로드 실패");
                            } finally {
                                e.currentTarget.value = "";
                            }
                        }}
                    />
                    <button
                        type="button"
                        aria-label="파일"
                        className="text-gray-500 hover:text-gray-700"
                        onClick={() => fileInputRef.current?.click()}
                    >
                        <Paperclip size={18} />
                    </button>

                    <button
                        type="button"
                        aria-label="캡처"
                        className="text-gray-500 hover:text-gray-700"
                        onClick={() => alert("캡처 기능은 화면 캡처/크롭 모듈과 연동 예정")}
                    >
                        <Crop size={18} />
                    </button>
                </div>
            </div>
        </div>
    );
};

export default MessageDetail;
