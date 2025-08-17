import React from "react";
import type { Message } from "../../../types/Message";
import { timeAgo } from "../../../utils/time";

type Props = {
    message?: Message;
    /** 답장 전송 콜백(부모에서 API 연결) */
    onSend?: (messageId: number | string, body: string) => Promise<void> | void;
    /** 상세 열릴 때 읽음 처리 콜백(옵션) */
    onMarkRead?: (messageId: number | string) => void;
};

const youBubble = "max-w-[520px] bg-gray-100 rounded-xl px-4 py-3 shadow-sm";
const meBubble =
    "max-w-[520px] bg-green-50 rounded-xl px-4 py-3 shadow-sm self-end";

const MessageDetail: React.FC<Props> = ({ message, onSend, onMarkRead }) => {
    const [text, setText] = React.useState("");
    const [sending, setSending] = React.useState(false);
    const [replies, setReplies] = React.useState<
        { id: string; content: string; createdAt: string }[]
    >([]);
    const taRef = React.useRef<HTMLTextAreaElement>(null);

    // 메시지 변경 시 초기화 + 읽음 처리
    React.useEffect(() => {
        setText("");
        setReplies([]);
        if (message && !message.isRead) onMarkRead?.(message.id);
    }, [message, onMarkRead]);

    // textarea 자동 높이
    React.useEffect(() => {
        if (!taRef.current) return;
        taRef.current.style.height = "auto";
        taRef.current.style.height = taRef.current.scrollHeight + "px";
    }, [text]);

    const handleSend = async () => {
        if (!message) return;
        const body = text.trim();
        if (!body || sending) return;

        setSending(true);
        // ✅ 낙관적 UI
        const reply = {
            id: crypto.randomUUID(),
            content: body,
            createdAt: new Date().toISOString(),
        };
        setReplies((prev) => [...prev, reply]);
        setText("");

        try {
            await onSend?.(message.id, body);
        } finally {
            setSending(false);
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
        <div className="flex-1 flex flex-col">
            {/* 헤더 */}
            <div className="px-6 py-4 border-b flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-sm">
                    {message.sender?.[0]?.toUpperCase() ?? "?"}
                </div>
                <div className="flex flex-col">
                    <span className="font-semibold">{message.sender}</span>
                    <span className="text-xs text-gray-400">{timeAgo(message.createdAt)}</span>
                </div>
            </div>

            {/* 타임라인 */}
            <div className="flex-1 p-6 flex flex-col gap-3">
                <div className="mx-auto text-center text-[11px] text-gray-400 mb-1">
                    {new Date(message.createdAt).toLocaleDateString()}
                </div>

                {/* 상대 메시지 */}
                <div className={youBubble}>
                    <div className="whitespace-pre-wrap text-sm text-gray-800">
                        {message.content}
                    </div>
                </div>

                {/* 내가 보낸 답장들(낙관적) */}
                {replies.map((r) => (
                    <div key={r.id} className={meBubble}>
                        <div className="whitespace-pre-wrap text-sm text-gray-800">
                            {r.content}
                        </div>
                        <div className="text-[11px] text-gray-400 mt-1">
                            {timeAgo(r.createdAt)}
                        </div>
                    </div>
                ))}
            </div>

            {/* 입력 영역 */}
            <div className="px-6 py-4 border-t flex items-end gap-2">
        <textarea
            ref={taRef}
            value={text}
            onChange={(e) => setText(e.currentTarget.value)}
            onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleSend();
                }
            }}
            placeholder="메시지 입력 (Enter: 전송, Shift+Enter: 줄바꿈)"
            rows={1}
            className="flex-1 border rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500/30 resize-none"
        />
                <button
                    onClick={handleSend}
                    disabled={!text.trim() || sending}
                    className="px-4 py-2 bg-gray-900 text-white rounded-xl text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {sending ? "전송 중..." : "전송"}
                </button>
            </div>
        </div>
    );
};

export default MessageDetail;
