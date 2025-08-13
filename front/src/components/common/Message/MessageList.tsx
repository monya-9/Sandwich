import React from 'react';
import { Message } from '../../../types/Message';
import { timeAgo } from '../../../utils/time';

interface Props {
    messages: Message[];
    selectedId?: number;
    onSelect: (id: number) => void;
}

const MessageList: React.FC<Props> = ({ messages, selectedId, onSelect }) => {
    return (
        <aside className="w-full md:w-[320px] border-r border-gray-200">
            {/* 상단 헤더 */}
            <div className="px-4 py-3 flex items-center justify-between border-b">
                <span className="font-semibold">메시지</span>
                {/* 필요하면 필터/정렬 버튼 위치 */}
            </div>

            {/* 아이템들 */}
            <div className="divide-y">
                {messages.map((msg) => (
                    <button
                        key={msg.id}
                        onClick={() => onSelect(msg.id)}
                        className={`w-full text-left px-4 py-3 hover:bg-gray-50 ${
                            selectedId === msg.id ? 'bg-gray-100' : ''
                        }`}
                    >
                        <div className="flex items-center gap-2">
                            {/* 읽음/안읽음 점: 안읽음=초록, 읽음=빨강 */}
                            <span
                                className={`inline-block w-2.5 h-2.5 rounded-full ${
                                    msg.isRead ? 'bg-[#ef4444]' : 'bg-[#22c55e]'
                                }`}
                            />
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between gap-2">
                                    <span className="font-medium truncate">{msg.sender}</span>
                                    <span className="text-xs text-gray-400 shrink-0">
                    {timeAgo(msg.createdAt)}
                  </span>
                                </div>
                                <p className="text-xs text-gray-500 truncate">{msg.content}</p>
                            </div>
                        </div>
                    </button>
                ))}
            </div>
        </aside>
    );
};

export default MessageList;
