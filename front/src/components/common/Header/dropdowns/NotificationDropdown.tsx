// src/components/common/Header/dropdowns/NotificationDropdown.tsx
import React from "react";
import { toRelativeTime } from "../../../../utils/time";
import DropdownWrapper from "./DropdownWrapper";
import EmptyState from "./EmptyState";
import UnreadBadge from "../../UnreadBadge";
import type { NotifyItem } from "../../../../types/Notification";
import { useNavigate } from "react-router-dom";

type Props = {
    items: NotifyItem[];
    unreadCount: number;
    onMarkAllAsRead: () => void;
    onClickItem: (id: number) => void;
    onLoadMore?: () => void;
    hasMore?: boolean;
};

const NotificationDropdown: React.FC<Props> = ({
                                                   items,
                                                   unreadCount,
                                                   onMarkAllAsRead,
                                                   onClickItem,
                                                   onLoadMore,
                                                   hasMore,
                                               }) => {
    const nav = useNavigate();

    return (
        <DropdownWrapper width="w-96">
            <div className="flex justify-between items-center mb-2 -mx-2 text-sm font-medium">
                <span className="text-black">읽지 않은 알림 ({unreadCount})</span>
                <button type="button" onClick={onMarkAllAsRead} className="text-green-600 hover:underline text-xs">
                    모두 읽음
                </button>
            </div>
            <hr className="border-gray-200 mb-3 -mx-6" />

            {items.length === 0 ? (
                <EmptyState text="새로운 알림이 없어요" />
            ) : (
                <ul className="list-none pl-0 space-y-2 max-h-64 overflow-y-auto pr-1">
                    {items.map((n) => (
                        <li key={n.id} className="relative">
                            <button
                                type="button"
                                className="w-full text-left p-2 rounded-lg text-sm hover:bg-gray-50 cursor-pointer focus:outline-none"
                                onClick={() => {
                                    onClickItem(n.id);
                                    const to = n.deepLink || "/";
                                    nav(to);
                                }}
                            >
                                <UnreadBadge show={!n.read} radius="lg" colorClass="bg-green-500/10" />
                                <div className="relative z-[1] flex items-start gap-2">
                                    {n.thumbnail ? (
                                        <img src={n.thumbnail} alt="" className="w-8 h-8 rounded-full shrink-0 object-cover" />
                                    ) : (
                                        <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center shrink-0">
                                            {(n.title?.[0] || "?").toUpperCase()}
                                        </div>
                                    )}

                                    <div className="min-w-0">
                                        <p className="font-medium truncate">{n.title}</p>
                                        <p className="text-gray-500 text-xs line-clamp-2 whitespace-pre-line">
                                            {n.body || n.extra?.snippet || ""}
                                        </p>
                                        <span className="text-gray-400 text-xs">{toRelativeTime(n.createdAt)}</span>
                                    </div>
                                </div>
                            </button>
                        </li>
                    ))}

                    {hasMore && (
                        <li className="pt-1">
                            <button
                                type="button"
                                className="w-full text-center text-xs text-gray-600 hover:underline py-1"
                                onClick={onLoadMore}
                            >
                                더 보기
                            </button>
                        </li>
                    )}
                </ul>
            )}
        </DropdownWrapper>
    );
};

export default NotificationDropdown;
