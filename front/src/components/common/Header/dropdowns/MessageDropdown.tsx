// src/components/common/Header/dropdowns/MessageDropdown.tsx
import React from "react";
import { useNavigate } from "react-router-dom";
import { toRelativeTime } from "../../../../utils/time";
import DropdownWrapper, { emitHideDropdowns } from "./DropdownWrapper";
import EmptyState from "./EmptyState";
import UnreadBadge from "../../UnreadBadge";
import type { Message } from "../../../../types/Message";

/** 아바타에 넣을 글자: email 1글자 > title(sender) 1글자 */
function avatarLetter(name?: string, email?: string) {
    const src = (email || name || "?").trim();
    return src ? src[0]!.toUpperCase() : "·";
}

type Props = {
    /** 각 아이템: id(roomId), title(상대 이름), content(미리보기), createdAt, isRead, unreadCount, (선택) avatarUrl, email */
    messages: Message[];
    /** 드롭다운 항목 클릭 시 읽음 처리(부모 상태 갱신) */
    onRead?: (id: number | string) => void;
};

const MAX_ITEMS = 5;

const MessageDropdown: React.FC<Props> = ({ messages, onRead }) => {
    const navigate = useNavigate();

    const goDetail = (id: number | string) => {
        // 먼저 읽음 처리 → 하이라이트 즉시 제거
        onRead?.(id);
        // 드롭다운 닫고 상세 이동
        emitHideDropdowns();
        navigate(`/messages/${id}`);
    };

    // 최신순 상위 N개
    const items = [...messages]
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .slice(0, MAX_ITEMS);

    const totalUnread = messages.reduce((n, m) => n + (m.unreadCount ?? (m.isRead ? 0 : 1)), 0);

    return (
        <DropdownWrapper width="w-96">
            {/* 헤더 */}
            <div className="flex items-center justify-between mb-2 -mx-2 text-sm font-medium">
                <div className="flex items-center gap-2">
                    <span className="text-black">메시지</span>
                    {totalUnread > 0 && (
                        <span className="text-[11px] bg-green-600 text-white rounded-full px-2 py-0.5">
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
                <ul className="list-none pl-0 space-y-2 max-h-64 overflow-y-auto pr-1">
                    {items.map((m) => {
                        const name = (m as any).title || (m as any).sender || "사용자";
                        const email = (m as any).email as string | undefined;
                        const avatarUrl = (m as any).avatarUrl as string | undefined;
                        const unread = m.unreadCount ?? (m.isRead ? 0 : 1);

                        return (
                            <li key={m.id} className="relative">
                                {/* 안읽음이면 배경 하이라이트 */}
                                <UnreadBadge show={!m.isRead} radius="lg" colorClass="bg-green-500/10" />
                                <button
                                    type="button"
                                    onClick={() => goDetail(m.id)}
                                    onKeyDown={(e) => {
                                        if (e.key === "Enter" || e.key === " ") {
                                            e.preventDefault();
                                            goDetail(m.id);
                                        }
                                    }}
                                    className="relative z-[1] w-full flex items-start gap-3 p-2 rounded-lg text-left text-sm
                             hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-green-500/30"
                                >
                                    {/* 아바타 */}
                                    {avatarUrl ? (
                                        <img
                                            src={avatarUrl}
                                            alt={name}
                                            className="w-8 h-8 rounded-full object-cover shrink-0"
                                        />
                                    ) : (
                                        <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center
                                    text-sm font-medium text-gray-700 shrink-0">
                                            {avatarLetter(name, email)}
                                        </div>
                                    )}

                                    {/* 본문 */}
                                    <div className="min-w-0 flex-1">
                                        <div className="flex items-center gap-2 min-w-0">
                                            <span className="font-medium truncate">{name}</span>
                                            <span className="text-xs text-gray-400">{toRelativeTime(m.createdAt)}</span>
                                            {unread > 0 && (
                                                <span
                                                    aria-label={`안읽은 메시지 ${unread}개`}
                                                    className={[
                                                        "ml-auto inline-flex items-center justify-center rounded-full bg-green-600 text-white",
                                                        unread >= 10
                                                            ? "min-w-[18px] h-4 px-1.5 text-[10px]"
                                                            : "min-w-[16px] h-4 px-1 text-[11px]",
                                                    ].join(" ")}
                                                >
                          {unread > 99 ? "99+" : unread}
                        </span>
                                            )}
                                        </div>
                                        <p className="text-gray-500 text-xs line-clamp-2 whitespace-pre-line">
                                            {m.content}
                                        </p>
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
