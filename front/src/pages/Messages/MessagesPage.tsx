// src/pages/Messages/MessagesPage.tsx
import React from "react";
import { useNavigate, useParams } from "react-router-dom";
import { dummyMessages as seed } from "../../data/dummyMessages";
import MessageList from "../../components/common/Message/MessageList";
import MessageDetail from "../../components/common/Message/MessageDetail";

const MessagesPage: React.FC = () => {
    const navigate = useNavigate();
    const { id } = useParams<{ id?: string }>();
    const routeId = id ? Number(id) : undefined;

    const [messages, setMessages] = React.useState(seed);
    const [selectedId, setSelectedId] = React.useState<number | undefined>(routeId);
    React.useEffect(() => setSelectedId(routeId), [routeId]);

    const handleSelect = (mid: number) => {
        setSelectedId(mid);
        // ✅ 선택 즉시 읽음 처리(낙관적)
        setMessages(prev =>
            prev.map(m => (m.id === mid ? { ...m, isRead: true, unreadCount: 0 } : m)),
        );
        navigate(`/messages/${mid}`);
    };

    // 상세에서 열릴 때도 안전하게 한 번 더 읽음 처리
    const markRead = (mid: number | string) => {
        setMessages(prev =>
            prev.map(m => (m.id === mid ? { ...m, isRead: true, unreadCount: 0 } : m)),
        );
        // TODO: await api.messages.markRead(mid)  // 실제 연동 시
    };

    const selectedMessage = messages.find(m => m.id === selectedId);

    return (
        <main className="mx-auto max-w-6xl px-4">
            <section className="bg-white rounded-lg border overflow-hidden flex h-[600px] min-h-0">
                <MessageList messages={messages} selectedId={selectedId} onSelect={handleSelect} />
                <MessageDetail
                    message={selectedMessage}
                    onSend={async () => {/* TODO: api */}}
                    onMarkRead={markRead}
                />
            </section>
        </main>
    );
};

export default MessagesPage;
