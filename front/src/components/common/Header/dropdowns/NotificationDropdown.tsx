// src/components/Header/dropdowns/NotificationDropdown.tsx
import React from 'react';
import EmptyState from './EmptyState';
import DropdownWrapper from './DropdownWrapper';

interface Notification {
    id: number;
    message: string;
    time: string;
    sender: string;
    thumbnail?: string;
    isRead?: boolean;
}

interface Props {
    notifications: Notification[];
    onMarkAllAsRead: () => void;
}

const NotificationDropdown = ({ notifications, onMarkAllAsRead }: Props) => {
    const unreadCount = notifications.filter(n => !n.isRead).length;

    return (
        <DropdownWrapper width="w-80">
            <div className="flex justify-between items-center mb-2 text-sm font-medium -mx-2">
                <span className="text-black">읽지 않은 알림 ({unreadCount})</span>
                <span
                    className="text-green-600 cursor-pointer hover:underline text-xs"
                    onClick={onMarkAllAsRead}
                >
                    모두 읽음
                </span>
            </div>

            <hr className="border-gray-200 mb-4 -mx-6" />

            {notifications.length === 0 ? (
                <EmptyState text="새로운 알림이 없어요" />
            ) : (
                <ul className="space-y-3 px-6">
                    {notifications.map((noti) => (
                        <li key={noti.id} className="flex gap-3 text-sm">
                            {noti.thumbnail ? (
                                <img src={noti.thumbnail} alt="thumbnail" className="w-8 h-8 rounded-full" />
                            ) : (
                                <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                                    {noti.sender[0].toUpperCase()}
                                </div>
                            )}
                            <div>
                                <p>{noti.message}</p>
                                <span className="text-gray-400 text-xs">{noti.time}</span>
                            </div>
                        </li>
                    ))}
                </ul>
            )}
        </DropdownWrapper>
    );
};

export default NotificationDropdown;
