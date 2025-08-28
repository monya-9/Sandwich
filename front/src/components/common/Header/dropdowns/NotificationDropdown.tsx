import React from "react";
import { toRelativeTime } from "../../../../utils/time";
import DropdownWrapper from "./DropdownWrapper";
import EmptyState from "./EmptyState";
import UnreadBadge from "../../UnreadBadge";
import type { Notification } from "../../../../types/Notification";

interface Props {
    notifications: Notification[];
    onMarkAllAsRead: () => void;
}

const NotificationDropdown: React.FC<Props> = ({ notifications, onMarkAllAsRead }) => {
    const unreadCount = notifications.filter((n) => !n.isRead).length;

    return (
        <DropdownWrapper width="w-96">
            {/* 헤더 — 메시지 드롭다운과 동일 */}
            <div className="flex justify-between items-center mb-2 -mx-2 text-sm font-medium">
                <span className="text-black">읽지 않은 알림 ({unreadCount})</span>
                <button
                    type="button"
                    onClick={onMarkAllAsRead}
                    className="text-green-600 hover:underline text-xs"
                >
                    모두 읽음
                </button>
            </div>
            <hr className="border-gray-200 mb-3 -mx-6" />

            {notifications.length === 0 ? (
                <EmptyState text="새로운 알림이 없어요" />
            ) : (
                // ✅ 메시지 드롭다운과 동일한 리스트 레이아웃/크기
                <ul className="list-none pl-0 space-y-2 max-h-64 overflow-y-auto pr-1">
                    {notifications.map((n) => (
                        <li key={n.id} className="relative">
                            {/* 메시지 드롭다운과 동일한 아이템 컨테이너 */}
                            <button
                                type="button"
                                className="w-full text-left p-2 rounded-lg text-sm hover:bg-gray-50 cursor-default focus:outline-none"
                            >
                                {/* ✅ 안읽음 오버레이 (연한 초록) */}
                                <UnreadBadge show={!n.isRead} radius="lg" colorClass="bg-green-500/10" />

                                {/* 실제 내용은 오버레이 위로 */}
                                <div className="relative z-[1] flex items-start gap-2">
                                    {n.thumbnail ? (
                                        <img
                                            src={n.thumbnail}
                                            alt=""
                                            className="w-8 h-8 rounded-full shrink-0 object-cover"
                                        />
                                    ) : (
                                        <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center shrink-0">
                                            {n.sender[0]?.toUpperCase()}
                                        </div>
                                    )}

                                    <div className="min-w-0">
                                        {/* 제목 느낌: 발신자 */}
                                        <p className="font-medium truncate">{n.sender}</p>

                                        {/* 본문 — 메시지 드롭다운과 동일하게 text-xs */}
                                        <p className="text-gray-500 text-xs line-clamp-2 whitespace-pre-line">
                                            {n.message}
                                        </p>

                                        {/* 시간 */}
                                        <span className="text-gray-400 text-xs">
                      {toRelativeTime(n.createdAt)}
                    </span>
                                    </div>
                                </div>
                            </button>
                        </li>
                    ))}
                </ul>
            )}
        </DropdownWrapper>
    );
};

export default NotificationDropdown;
