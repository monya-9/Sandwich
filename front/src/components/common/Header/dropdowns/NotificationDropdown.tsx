import React from 'react';
import { toRelativeTime } from '../../../../utils/time';
import DropdownWrapper from './DropdownWrapper';
import EmptyState from './EmptyState';
import type { Notification } from '../../../../types/Notification';

interface Props {
    notifications: Notification[];
    onMarkAllAsRead: () => void;
}

const NotificationDropdown: React.FC<Props> = ({ notifications, onMarkAllAsRead }) => {
    const unreadCount = notifications.filter(n => !n.isRead).length;

    return (
        <DropdownWrapper width="w-96">
            <div className="flex justify-between items-center mb-2 -mx-2 text-sm font-medium">
                <span className="text-black">읽지 않은 알림 ({unreadCount})</span>
                <button type="button" onClick={onMarkAllAsRead} className="text-green-600 hover:underline text-xs">
                    모두 읽음
                </button>
            </div>
            <hr className="border-gray-200 mb-3 -mx-6" />

            {notifications.length === 0 ? (
                <EmptyState text="새로운 알림이 없어요" />
            ) : (
                // ✅ 약 5개 높이만 보이게 + 내부 스크롤
                <ul className="space-y-3 max-h-64 overflow-y-auto pr-1">
                    {notifications.map((n) => (
                        <li key={n.id} className="flex items-start gap-3 text-sm">
                            {n.thumbnail ? (
                                <img src={n.thumbnail} alt="" className="w-8 h-8 rounded-full shrink-0" />
                            ) : (
                                <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center shrink-0">
                                    {n.sender[0]?.toUpperCase()}
                                </div>
                            )}
                            <div className="min-w-0">
                                <p className="font-medium leading-5 break-words">{n.message}</p>
                                <span className="text-gray-400 text-xs">{toRelativeTime(n.createdAt)}</span>
                            </div>
                        </li>
                    ))}
                </ul>
            )}
        </DropdownWrapper>
    );
};

export default NotificationDropdown;
