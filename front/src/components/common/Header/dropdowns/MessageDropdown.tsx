// src/components/Header/dropdowns/MessageDropdown.tsx
import React from 'react';
import EmptyState from './EmptyState';
import DropdownWrapper from './DropdownWrapper';

interface Message {
    id: number;
    title: string;
    preview: string;
    time: string;
    sender: string;
}

interface Props {
    messages: Message[];
}

const MessageDropdown = ({ messages }: Props) => {
    return (
        <DropdownWrapper width="w-80">
            {/* ✅ 항상 보이는 헤더 + 구분선 */}
            <div className="flex justify-between items-center mb-2 -mx-2 text-sm font-medium">
                <span className="text-black">메시지</span>
                <span className="text-green-600 cursor-pointer hover:underline text-xs">
                    모든 메시지 보기 &gt;
                </span>
            </div>
            <hr className="border-gray-200 mb-4 -mx-6" />

            {/* ✅ 내용 조건부 렌더링 */}
            {messages.length === 0 ? (
                <EmptyState text="새로운 메시지가 없어요" />
            ) : (
                <ul className="space-y-3">
                    {messages.map((msg) => (
                        <li key={msg.id} className="text-sm">
                            <p className="font-medium">{msg.sender}님이 메시지를 보냈습니다.</p>
                            <p className="text-gray-500 text-xs truncate">{msg.preview}</p>
                            <span className="text-gray-400 text-xs">{msg.time}</span>
                        </li>
                    ))}
                </ul>
            )}
        </DropdownWrapper>
    );
};

export default MessageDropdown;
