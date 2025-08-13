import React from 'react';
import { useNavigate } from 'react-router-dom';
// 상대경로가 맞게 수정: 드롭다운 폴더 기준으로 4단계 상위가 src
import { toRelativeTime } from '../../../../utils/time';
import DropdownWrapper from './DropdownWrapper';
import EmptyState from './EmptyState';
import type { Message } from '../../../../types/Message';

interface Props {
    messages: Message[];
}

const MessageDropdown: React.FC<Props> = ({ messages }) => {
    const navigate = useNavigate();

    return (
        <DropdownWrapper width="w-96">
            {/* 헤더 */}
            <div className="flex justify-between items-center mb-2 -mx-2 text-sm font-medium">
                <span className="text-black">메시지</span>
                <button
                    type="button"
                    onClick={() => navigate('/messages')}
                    className="text-green-600 cursor-pointer hover:underline text-xs"
                >
                    모든 메시지 보기 &gt;
                </button>
            </div>
            <hr className="border-gray-200 mb-3 -mx-6" />

            {/* 본문 */}
            {messages.length === 0 ? (
                <EmptyState text="새로운 메시지가 없어요" />
            ) : (
                // ✅ 약 5개 높이만 보이게 + 내부 스크롤
                <ul className="space-y-3 max-h-64 overflow-y-auto pr-1">
                    {messages.map((m) => (
                        <li key={m.id} className="text-sm">
                            <p className="font-medium truncate">{m.title}</p>
                            <p className="text-gray-500 text-xs line-clamp-2 whitespace-pre-line">
                                {m.content}
                            </p>
                            <span className="text-gray-400 text-xs">{toRelativeTime(m.createdAt)}</span>
                        </li>
                    ))}
                </ul>
            )}
        </DropdownWrapper>
    );
};

export default MessageDropdown;
