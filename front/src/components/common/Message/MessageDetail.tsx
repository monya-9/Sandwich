import React from "react";
import type { Message } from "../../../types/Message";
import { timeAgo } from "../../../utils/time";
import { Smile, Paperclip, Crop } from "lucide-react"; // ✅ Camera -> Crop

type Props = {
    message?: Message;
    onSend?: (messageId: number | string, body: string) => Promise<void> | void;
    onMarkRead?: (messageId: number | string) => void;
};

const youBubble =
    "max-w-[520px] bg-gray-100 rounded-2xl px-4 py-3 shadow-sm";
const meBubble =
    "max-w-[520px] bg-green-50 rounded-2xl px-4 py-3 shadow-sm";

const MessageDetail: React.FC<Props> = ({ message, onSend, onMarkRead }) => {
    const [text, setText] = React.useState("");
    const [sending, setSending] = React.useState(false);
    const [isComposing, setIsComposing] = React.useState(false); // IME(한글) 입력중
    const [replies, setReplies] = React.useState<
        { id: string; content: string; createdAt: string }[]
    >([]);
    const taRef = React.useRef<HTMLTextAreaElement>(null);
    const endRef = React.useRef<HTMLDivElement>(null);
    const fileInputRef = React.useRef<HTMLInputElement>(null);

    React.useEffect(() => {
        setText("");
        setReplies([]);
        if (message && !message.isRead) onMarkRead?.(message.id);
    }, [message, onMarkRead]);

    React.useEffect(() => {
        if (!taRef.current) return;
        taRef.current.style.height = "auto";
        taRef.current.style.height = taRef.current.scrollHeight + "px";
    }, [text]);

    React.useEffect(() => {
        endRef.current?.scrollIntoView({ block: "end" });
    }, [replies, message]);

    const handleSend = async () => {
        if (!message) return;
        if (isComposing) return;
        const body = text.trim();
        if (!body || sending) return;

        setSending(true);
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
                    <span className="text-xs text-gray-400">{timeAgo(message.createdAt)}</span>
                </div>
            </div>

            {/* 타임라인(스크롤) */}
            <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-4">
                <div className="mx-auto text-center text-[11px] text-gray-400">
                    {new Date(message.createdAt).toLocaleDateString()}
                </div>

                {/* 상대 메시지 + 시간(오른쪽) */}
                <div className="flex items-end gap-2 max-w-full">
                    <div className={youBubble}>
                        <div className="whitespace-pre-wrap text-sm text-gray-800">
                            {message.content}
                        </div>
                    </div>
                    <span className="text-[11px] text-gray-400 shrink-0 translate-y-1">
            {new Date(message.createdAt).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}
          </span>
                </div>

                {/* 내 답장들 + 시간(오른쪽) */}
                {replies.map((r) => (
                    <div key={r.id} className="flex items-end gap-2 self-end max-w-full">
            <span className="text-[11px] text-gray-400 shrink-0 translate-y-1 order-1">
              {new Date(r.createdAt).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}
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
                {/* textarea + 전송 */}
                <div className="flex items-end gap-2">
          <textarea
              ref={taRef}
              value={text}
              onChange={(e) => setText(e.currentTarget.value)}
              onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey && !isComposing) {
                      e.preventDefault();
                      handleSend();
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
                        onClick={handleSend}
                        disabled={!text.trim() || sending}
                        className="px-4 py-2 bg-gray-900 text-white rounded-xl text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {sending ? "전송 중..." : "전송"}
                    </button>
                </div>

                {/* 아이콘 줄 (왼쪽 정렬 + 입력칸 텍스트 시작점에 맞춤) */}
                <div className="flex items-center gap-3 pl-4"> {/* ✅ px-4과 맞춤 */}
                    {/* 이모지 */}
                    <button
                        type="button"
                        aria-label="이모지"
                        className="text-gray-500 hover:text-gray-700"
                        onClick={() => alert("이모지 피커 연결 예정")}
                    >
                        <Smile size={18} />
                    </button>

                    {/* 파일 */}
                    <input
                        ref={fileInputRef}
                        type="file"
                        className="hidden"
                        onChange={(e) => {
                            const f = e.target.files?.[0];
                            if (f) alert(`파일 선택: ${f.name}`);
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

                    {/* 캡처(크롭 아이콘 사용) */}
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
