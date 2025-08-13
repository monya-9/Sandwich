import React from 'react';
import { Message } from '../../../types/Message';
import { timeAgo } from '../../../utils/time';

interface Props {
    message?: Message;
}

const bubble = 'bg-gray-100 rounded-xl px-4 py-3 shadow-sm';

const MessageDetail: React.FC<Props> = ({ message }) => {
    if (!message) {
        return (
            <div className="flex-1 flex items-center justify-center text-gray-400">
                메시지를 선택하세요.
            </div>
        );
    }

    return (
        <div className="flex-1 flex flex-col">
            {/* 상단 헤더 */}
            <div className="px-6 py-4 border-b flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-sm">
                    {message.sender[0].toUpperCase()}
                </div>
                <div className="flex flex-col">
                    <span className="font-semibold">{message.sender}</span>
                    <span className="text-xs text-gray-400">{timeAgo(message.createdAt)}</span>
                </div>
            </div>

            {/* 타임라인(간단 버전) */}
            <div className="flex-1 p-6">
                <div className="mx-auto text-center text-[11px] text-gray-400 mb-4">
                    {/* 필요하면 날짜 라벨 포맷으로 변경 */}
                    {new Date(message.createdAt).toLocaleDateString()}
                </div>

                <div className={`max-w-[520px] ${bubble}`}>
                    <div className="whitespace-pre-wrap text-sm text-gray-800">
                        {message.content}
                    </div>
                </div>
            </div>

            {/* 입력 영역 */}
            <div className="px-6 py-4 border-t flex items-center gap-2">
                <input
                    type="text"
                    placeholder="메시지 입력"
                    className="flex-1 border rounded-xl px-4 py-2 text-sm focus:outline-none"
                />
                <button className="px-4 py-2 bg-gray-900 text-white rounded-xl text-sm">
                    전송
                </button>
            </div>
        </div>
    );
};

export default MessageDetail;
