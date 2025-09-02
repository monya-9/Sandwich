import React from "react";
import { Message } from "../../../types/Message";
import { timeAgo } from "../../../utils/time";

interface Props {
    /** ⚠️ 여기 id는 messageId가 아니라 roomId로 씀 */
    selectedId?: number;
    onSelect: (roomId: number) => void;
    messages: Message[];
}

const MessageList: React.FC<Props> = ({ messages, selectedId, onSelect }) => {
    return (
        // 내부 스크롤을 위해 flex-col + min-h-0 유지
        <aside className="w-full md:w-[320px] border-r border-gray-200 flex flex-col min-h-0">
            {/* 헤더 (고정) */}
            <div className="px-4 py-3 flex items-center justify-between border-b shrink-0">
                <span className="font-semibold">메시지</span>
            </div>

            {/* 리스트 (이 영역만 스크롤) */}
            <div className="flex-1 overflow-y-auto divide-y">
                {messages.map((msg) => {
                    // ✅ 항상 roomId 우선 사용 (백엔드가 방 기준으로 동작)
                    const roomId = (msg as any).roomId ?? msg.id;

                    // 서버에서 unreadCount 내려주면 우선 사용
                    const unread =
                        typeof (msg as any).unreadCount === "number"
                            ? (msg as any).unreadCount
                            : msg.isRead
                                ? 0
                                : 1;

                    // 배지 사이즈/폰트: 10+면 더 작게
                    const badgeSizeCls =
                        unread >= 10
                            ? "min-w-[18px] h-4 px-1.5 text-[10px]"
                            : "min-w-[16px] h-4 px-1 text-[11px]";

                    return (
                        <button
                            key={roomId}
                            onClick={() => onSelect(roomId)}   // ← roomId로 선택
                            className={`w-full text-left px-4 py-3 hover:bg-gray-50 ${
                                selectedId === roomId ? "bg-gray-100" : ""
                            }`}
                        >
                            <div className="flex items-start gap-3">
                                {/* 아바타 */}
                                <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-sm shrink-0">
                                    {msg.sender?.[0]?.toUpperCase() ?? "?"}
                                </div>

                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2">
                                        <span className="font-medium truncate">{msg.sender}</span>
                                        <span className="text-xs text-gray-400 truncate">
                      {timeAgo(msg.createdAt)}
                    </span>

                                        {/* 오른쪽 끝 - 안읽음 배지 */}
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
