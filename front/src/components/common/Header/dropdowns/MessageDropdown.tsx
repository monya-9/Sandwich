// src/components/common/Header/dropdowns/MessageDropdown.tsx
import React from "react";
import { useNavigate } from "react-router-dom";
import { toRelativeTime } from "../../../../utils/time";
import DropdownWrapper, { emitHideDropdowns } from "./DropdownWrapper";
import EmptyState from "./EmptyState";
import type { Message } from "../../../../types/Message";

/** 아바타에 넣을 글자: email 1글자 > name 1글자 */
function avatarLetter(name?: string, email?: string) {
    const source = (email || name || "?").trim();
    return source ? source[0]!.toUpperCase() : "·";
}

type Props = {
    /** 각 아이템: id(roomId), title(상대 이름), content(미리보기), createdAt, unreadCount,
     (선택) avatarUrl, email */
    messages: Message[];
    onRead?: (id: number | string) => void;
};

const MessageDropdown: React.FC<Props> = ({ messages, onRead }) => {
    const navigate = useNavigate();

    const goDetail = (id: number | string) => {
        onRead?.(id);
        emitHideDropdowns();
        navigate(`/messages/${id}`);
    };

    // 최신순 정렬 + 최대 5개
    const items = [...messages]
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .slice(0, 5);

    const totalUnread = messages.reduce((n, m) => n + (m.unreadCount ?? 0), 0);

    return (
        <DropdownWrapper width="w-[420px]">
            {/* 헤더 */}
            <div className="flex items-center justify-between mb-2 -mx-2 text-sm font-semibold">
                <div className="flex items-center gap-2">
                    <span className="text-black">메시지</span>
                    {totalUnread > 0 && (
                        <span className="text-xs bg-green-600 text-white rounded-full px-2 py-0.5">
              {totalUnread}개 새 메시지
            </span>
                    )}
                </div>
                <button
                    type="button"
                    onClick={() => {
                        emitHideDropdowns();
                        navigate("/messages");
                    }}
                    className="text-green-600 hover:underline text-xs"
                >
                    모든 메시지 보기 &gt;
                </button>
            </div>
            <hr className="border-gray-200 mb-3 -mx-6" />

            {items.length === 0 ? (
                <EmptyState text="새로운 메시지가 없어요" />
            ) : (
                <ul className="list-none pl-0 max-h-72 overflow-y-auto pr-1 divide-y">
                    {items.map((m) => {
                        const name = (m as any).title || (m as any).sender || "사용자";
                        const email = (m as any).email as string | undefined;
                        const avatarUrl = (m as any).avatarUrl as string | undefined;
                        const unread = m.unreadCount ?? 0;

                        return (
                            <li key={m.id}>
                                <button
                                    type="button"
                                    onClick={() => goDetail(m.id)}
                                    onKeyDown={(e) => {
                                        if (e.key === "Enter" || e.key === " ") {
                                            e.preventDefault();
                                            goDetail(m.id);
                                        }
                                    }}
                                    className="w-full flex items-start gap-3 px-2 py-3 hover:bg-gray-50 focus:outline-none"
                                >
                                    {/* 아바타 */}
                                    {avatarUrl ? (
                                        <img
                                            src={avatarUrl}
                                            alt={name}
                                            className="w-8 h-8 rounded-full object-cover shrink-0"
                                        />
                                    ) : (
                                        <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-sm font-medium text-gray-700 shrink-0">
                                            {avatarLetter(name, email)}
                                        </div>
                                    )}

                                    {/* 본문 */}
                                    <div className="min-w-0 flex-1">
                                        <div className="flex items-center gap-2">
                                            <span className="font-medium truncate">{name}</span>
                                            <span className="text-xs text-gray-400">{toRelativeTime(m.createdAt)}</span>
                                            <div className="ml-auto">
                                                {unread > 0 && (
                                                    <span
                                                        aria-label={`안읽은 메시지 ${unread}개`}
                                                        className={[
                                                            "inline-flex items-center justify-center rounded-full bg-green-600 text-white",
                                                            unread >= 10
                                                                ? "min-w-[18px] h-4 px-1.5 text-[10px]"
                                                                : "min-w-[16px] h-4 px-1 text-[11px]",
                                                        ].join(" ")}
                                                    >
                            {unread > 99 ? "99+" : unread}
                          </span>
                                                )}
                                            </div>
                                        </div>
                                        <p className="text-xs text-gray-500 truncate">{m.content}</p>
                                    </div>
                                </button>
                            </li>
                        );
                    })}
                </ul>
            )}
        </DropdownWrapper>
    );
};

export default MessageDropdown;
