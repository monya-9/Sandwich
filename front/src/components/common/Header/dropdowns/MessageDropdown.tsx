import React from "react";
import { useNavigate } from "react-router-dom";
import { toRelativeTime } from "../../../../utils/time";
import DropdownWrapper from "./DropdownWrapper";
import EmptyState from "./EmptyState";
import UnreadBadge from "../../UnreadBadge";
import type { Message } from "../../../../types/Message";

interface Props {
    messages: Message[];
}

const MessageDropdown: React.FC<Props> = ({ messages }) => {
    const navigate = useNavigate();

    const goDetail = (id: number | string) => {
        navigate(`/messages/${id}`);
    };

    return (
        <DropdownWrapper width="w-96">
            <div className="flex justify-between items-center mb-2 -mx-2 text-sm font-medium">
                <span className="text-black">메시지</span>
                <button
                    type="button"
                    onClick={() => navigate("/messages")}
                    className="text-green-600 cursor-pointer hover:underline text-xs"
                >
                    모든 메시지 보기 &gt;
                </button>
            </div>
            <hr className="border-gray-200 mb-3 -mx-6" />

            {messages.length === 0 ? (
                <EmptyState text="새로운 메시지가 없어요" />
            ) : (
                <ul className="list-none pl-0 space-y-2 max-h-64 overflow-y-auto pr-1">
                    {messages.map((m) => (
                        <li key={m.id} className="relative">
                            {/* 클릭 영역 전체를 버튼으로 */}
                            <button
                                type="button"
                                onClick={() => goDetail(m.id)}
                                onKeyDown={(e) => {
                                    if (e.key === "Enter" || e.key === " ") {
                                        e.preventDefault();
                                        goDetail(m.id);
                                    }
                                }}
                                className="w-full text-left p-2 rounded-lg text-sm hover:bg-gray-50 cursor-pointer focus:outline-none focus:ring-2 focus:ring-green-500/30"
                            >
                                {/* 읽지 않은 항목 하이라이트 */}
                                <UnreadBadge show={!m.isRead} radius="lg" colorClass="bg-green-500/10" />
                                <div className="relative z-[1]">
                                    <p className="font-medium truncate">{m.title}</p>
                                    <p className="text-gray-500 text-xs line-clamp-2 whitespace-pre-line">
                                        {m.content}
                                    </p>
                                    <span className="text-gray-400 text-xs">
                    {toRelativeTime(m.createdAt)}
                  </span>
                                </div>
                            </button>
                        </li>
                    ))}
                </ul>
            )}
        </DropdownWrapper>
    );
};

export default MessageDropdown;
