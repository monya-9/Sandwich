// src/pages/Messages/MessagesPage.tsx
import React from "react";
import { useNavigate, useParams } from "react-router-dom";
import { dummyMessages as seed } from "../../data/dummyMessages";
import MessageList from "../../components/common/Message/MessageList";
import MessageDetail from "../../components/common/Message/MessageDetail";
import { markRoomRead } from "../../api/messages";

const MessagesPage: React.FC = () => {
    const navigate = useNavigate();
    const { id } = useParams<{ id?: string }>();
    const routeId = id ? Number(id) : undefined;

    const [messages, setMessages] = React.useState(seed);
    const [selectedId, setSelectedId] = React.useState<number | undefined>(routeId);
    React.useEffect(() => setSelectedId(routeId), [routeId]);

    const handleSelect = (mid: number) => {
        setSelectedId(mid);
        // 낙관적 읽음 처리
        setMessages(prev =>
            prev.map(m => (m.id === mid ? { ...m, isRead: true, unreadCount: 0 } : m)),
        );
        navigate(`/messages/${mid}`);
    };

    const markRead = async (mid: number | string) => {
        setMessages(prev =>
            prev.map(m => (m.id === mid ? { ...m, isRead: true, unreadCount: 0 } : m)),
        );
        const target = messages.find(m => m.id === mid);
        if (target?.roomId) {
            try { await markRoomRead(target.roomId); } catch { /* noop */ }
        }
    };

    const selectedMessage = messages.find(m => m.id === selectedId);

    return (
        <main className="mx-auto max-w-6xl px-4 mt-4">
            <section className="bg-white rounded-lg border overflow-hidden flex h-[600px] min-h-0">
                <MessageList messages={messages} selectedId={selectedId} onSelect={handleSelect} />
                <MessageDetail
                    message={selectedMessage}
                    onSend={async () => { /* 전송 성공 후 별도 동작 필요 시 여기에 */ }}
                    onMarkRead={markRead}
                />
            </section>
        </main>
    );
};

export default MessagesPage;
