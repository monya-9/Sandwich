// src/components/common/Message/MessageList.tsx
import React from "react";
import type { Message } from "../../../types/Message";
import { timeAgo } from "../../../utils/time";

interface Props {
    selectedId?: number;            // roomId
    onSelect: (roomId: number) => void;
    messages: Message[];
}

const MessageList: React.FC<Props> = ({ messages, selectedId, onSelect }) => {
    return (
        <aside className="w-full md:w-[320px] border-r border-gray-200 flex flex-col min-h-0">
            {/* 헤더 높이를 우측과 동일하게 맞춤 */}
            <div className="px-6 h-[72px] shrink-0 border-b border-gray-200 flex items-center gap-3">
                <span className="font-semibold">메시지</span>
            </div>

            {/* 리스트 */}
            <div className="flex-1 overflow-y-auto divide-y divide-gray-200 dark:divide-[var(--border-color)]">
                {messages.map((msg) => {
                    const roomId = (msg as any).roomId ?? msg.id;
                    const name = (msg as any).title ?? msg.sender ?? "사용자";
                    const createdAt = msg.createdAt;

                    // unread 계산: 우선순위 unreadCount → isRead
                    const unread =
                        typeof (msg as any).unreadCount === "number"
                            ? (msg as any).unreadCount
                            : msg.isRead
                                ? 0
                                : 1;

                    const badgeSizeCls =
                        unread >= 10
                            ? "min-w-[18px] h-4 px-1.5 text-[10px]"
                            : "min-w-[16px] h-4 px-1 text-[11px]";

                    const initial = (name?.[0] || "?").toUpperCase();

                    return (
                        <button
                            key={roomId}
                            onClick={() => onSelect(roomId)}
                            className={[
                                "w-full text-left px-4 py-3 hover:bg-gray-50",
                                selectedId === roomId ? "bg-gray-100" : "",
                            ].join(" ")}
                        >
                            <div className="flex items-start gap-3">
                                {/* 아바타 */}
                                <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-sm shrink-0">
                                    {initial}
                                </div>

                                {/* 본문 */}
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2">
                                        <span className="font-medium truncate">{name}</span>
                                        <span className="text-xs text-gray-400 truncate">
                      {timeAgo(createdAt)}
                    </span>

                                        {/* 우측 읽지않음 배지 */}
                                        <div className="ml-auto flex items-center">
                                            {unread > 0 && (
                                                <span
                                                    aria-label={`안읽은 메시지 ${unread}개`}
                                                    className={[
                                                        "inline-flex items-center justify-center rounded-full",
                                                        "bg-green-600 text-white font-light leading-none",
                                                        badgeSizeCls,
                                                    ].join(" ")}
                                                >
                          {unread > 99 ? "99+" : unread}
                        </span>
                                            )}
                                        </div>
                                    </div>

                                    <p className="text-xs text-gray-500 truncate">{msg.content}</p>
                                </div>
                            </div>
                        </button>
                    );
                })}
            </div>
        </aside>
    );
};

export default MessageList;
