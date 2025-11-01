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
    initializing?: boolean;
    loading?: boolean;
};

const Skeleton: React.FC = () => (
    <ul className="list-none pl-0 space-y-1.5 sm:space-y-2 max-h-56 sm:max-h-64 overflow-y-auto pr-1">
        {Array.from({ length: 4 }).map((_, i) => (
            <li key={i} className="p-1.5 sm:p-2 rounded-lg">
                <div className="flex items-start gap-1.5 sm:gap-2 animate-pulse">
                    <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-gray-200" />
                    <div className="flex-1 min-w-0">
                        <div className="h-2.5 sm:h-3 bg-gray-200 rounded w-2/3 mb-1.5 sm:mb-2" />
                        <div className="h-2.5 sm:h-3 bg-gray-100 rounded w-full mb-1" />
                        <div className="h-2.5 sm:h-3 bg-gray-100 rounded w-5/6" />
                    </div>
                </div>
            </li>
        ))}
    </ul>
);

const NotificationDropdown: React.FC<Props> = ({
                                                   items,
                                                   unreadCount,
                                                   onMarkAllAsRead,
                                                   onClickItem,
                                                   onLoadMore,
                                                   hasMore,
                                                   initializing = false,
                                                   loading = false,
                                               }) => {
    const nav = useNavigate();

    return (
        <DropdownWrapper width="w-[calc(100vw-2rem)] sm:w-[360px] md:w-96">
            <div className="flex justify-between items-center mb-2 -mx-2 text-xs sm:text-sm font-medium">
                <span className="text-black truncate">읽지 않은 알림 ({unreadCount})</span>
                <button
                    type="button"
                    onClick={onMarkAllAsRead}
                    className="text-green-600 hover:underline text-[10px] sm:text-xs whitespace-nowrap ml-2"
                >
                    모두 읽음
                </button>
            </div>
            <hr className="border-gray-200 mb-3 -mx-4 sm:-mx-6" />

            {initializing ? (
                <Skeleton />
            ) : (() => {
                // 모든 알림 표시 (읽음/읽지 않음 구분 없이)
                return items.length === 0 ? (
                    <EmptyState text="새로운 알림이 없어요" />
                ) : (
                    <ul className="list-none pl-0 space-y-1.5 sm:space-y-2 max-h-56 sm:max-h-64 overflow-y-auto pr-1">
                        {items.map((n) => {
                        // extra.actorName에 이미 처리된 닉네임이 있음
                        const actorName = n.extra?.actorName;
                        const profileUrl = n.thumbnail || n.extra?.profileImageUrl || null;

                        // 배우 미확정: '누군가' 또는 비어있거나 숫자만
                        const unknown =
                            !actorName || actorName === "누군가" || /^\d+$/.test(actorName);

                        // 이메일 첫 글자 또는 닉네임 첫 글자 사용
                        const initialSource = 
                            n.extra?.actorEmail?.split("@")?.[0] || 
                            actorName || 
                            n.title;
                        const initial = (initialSource?.[0] || "?").toUpperCase();

                        return (
                            <li key={String(n.id)} className="relative">
                                <button
                                    type="button"
                                    className="w-full text-left p-1.5 sm:p-2 rounded-lg text-xs sm:text-sm hover:bg-gray-50 cursor-pointer focus:outline-none"
                                    onClick={() => {
                                        onClickItem(n.id);
                                        nav(n.deepLink || "/");
                                    }}
                                >
                                    <UnreadBadge
                                        show={!n.read}
                                        radius="lg"
                                        colorClass="bg-green-500/10"
                                    />

                                    <div className="relative z-[1] flex items-start gap-1.5 sm:gap-2">
                                        {/* 배우 정보가 있을 때만 아바타 렌더링 */}
                                        {!unknown && (
                                            profileUrl ? (
                                                <img
                                                    src={profileUrl}
                                                    alt=""
                                                    className="w-7 h-7 sm:w-8 sm:h-8 rounded-full shrink-0 object-cover"
                                                />
                                            ) : (
                                                <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-gray-200 flex items-center justify-center shrink-0 text-xs sm:text-sm">
                                                    {initial}
                                                </div>
                                            )
                                        )}

                                        <div className="min-w-0 flex-1">
                                            <p className="font-medium truncate text-xs sm:text-sm">{n.title}</p>
                                            {n.body ? (
                                                <p className="text-gray-500 text-[10px] sm:text-xs line-clamp-2 whitespace-pre-line">
                                                    {n.body}
                                                </p>
                                            ) : null}
                                            <span className="text-gray-400 text-[10px] sm:text-xs">
                        {toRelativeTime(n.createdAt)}
                      </span>
                                        </div>
                                    </div>
                                </button>
                            </li>
                        );
                    })}

                    {hasMore && (
                        <li className="pt-1">
                            <button
                                type="button"
                                className="w-full text-center text-[10px] sm:text-xs text-gray-600 hover:underline py-1 disabled:opacity-60"
                                onClick={onLoadMore}
                                disabled={loading}
                            >
                                {loading ? "불러오는 중..." : "더 보기"}
                            </button>
                        </li>
                    )}
                </ul>
                );
            })()}
        </DropdownWrapper>
    );
};

export default NotificationDropdown;
