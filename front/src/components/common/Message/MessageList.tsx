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
        <aside className="w-full flex flex-col min-h-0 h-full">
            {/* 헤더 */}
            <div className="px-4 sm:px-6 h-[60px] sm:h-[72px] shrink-0 border-b border-gray-200 dark:border-[var(--border-color)] flex items-center gap-3">
                <span className="font-semibold text-base sm:text-lg">메시지</span>
            </div>

            {/* 리스트 */}
            <div className="flex-1 overflow-y-auto divide-y divide-gray-200 dark:divide-[var(--border-color)]">
                {messages.length === 0 ? (
                    <div className="p-8 text-center text-gray-500 dark:text-white/60 text-sm">
                        메시지가 없습니다
                    </div>
                ) : messages.map((msg) => {
                    const roomId = (msg as any).roomId ?? msg.id;
                    const name = (msg as any).title ?? msg.sender ?? "사용자";
                    const email = (msg as any).email as string | undefined;
                    const avatarUrl = (msg as any).avatarUrl as string | undefined;
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

                    const initial = (name?.[0] || email?.[0] || "?").toUpperCase();

                    return (
                        <button
                            key={roomId}
                            onClick={() => onSelect(roomId)}
                            className={[
                                "w-full text-left px-3 sm:px-4 py-2.5 sm:py-3 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors",
                                selectedId === roomId ? "bg-gray-100 dark:bg-white/10" : "",
                            ].join(" ")}
                        >
                            <div className="flex items-start gap-2 sm:gap-3">
                                {/* 아바타 */}
                                {avatarUrl ? (
                                    <img
                                        src={avatarUrl}
                                        alt={name}
                                        className="w-7 h-7 sm:w-8 sm:h-8 rounded-full object-cover shrink-0"
                                        onError={(e) => {
                                            const target = e.target as HTMLImageElement;
                                            target.style.display = 'none';
                                            const fallback = target.nextElementSibling as HTMLElement;
                                            if (fallback) fallback.style.display = 'flex';
                                        }}
                                    />
                                ) : null}
                                <div className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-gray-200 dark:bg-white/10 flex items-center justify-center text-xs sm:text-sm shrink-0 ${avatarUrl ? 'hidden' : ''}`}>
                                    {initial}
                                </div>

                                {/* 본문 */}
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-1.5 sm:gap-2">
                                        <span className="font-medium truncate text-sm sm:text-base">{name}</span>
                                        <span className="text-[10px] sm:text-xs text-gray-400 dark:text-white/50 whitespace-nowrap">
                      {timeAgo(createdAt)}
                    </span>

                                        {/* 우측 읽지않음 배지 */}
                                        <div className="ml-auto flex items-center flex-shrink-0">
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

                                    <p className="text-[11px] sm:text-xs text-gray-500 dark:text-white/60 truncate">{msg.content}</p>
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
