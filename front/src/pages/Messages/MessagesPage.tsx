// src/pages/MessagesPage.tsx
import React from "react";
import { useNavigate, useParams } from "react-router-dom";
import MessageList from "../../components/common/Message/MessageList";
import MessageDetail from "../../components/common/Message/MessageDetail";
import { fetchRooms, markRoomRead } from "../../api/messages";
import type { Message } from "../../types/Message";
import { onMessagesRefresh } from "../../lib/messageEvents";

const MessagesPage: React.FC = () => {
    const navigate = useNavigate();
    const { id } = useParams<{ id?: string }>();
    const routeRoomId = id ? Number(id) : undefined;

    const [items, setItems] = React.useState<Message[]>([]);
    const [selectedRoomId, setSelectedRoomId] =
        React.useState<number | undefined>(routeRoomId);
    const callReadOnce = React.useRef<Record<number, boolean>>({});

    const loadRooms = React.useCallback(async () => {
        try {
            const rooms = await fetchRooms();
            const mapped: Message[] = rooms
                .map((r) => ({
                    id: r.roomId,
                    roomId: r.roomId,
                    title: r.peerName,
                    sender: r.peerName, // 리스트에 항상 상대 표시
                    content: r.lastContent,
                    createdAt: r.lastAt,
                    isRead: r.unreadCount === 0,
                    unreadCount: r.unreadCount,
                    receiverId: r.peerId ?? null,
                }))
                .sort(
                    (a, b) =>
                        new Date(b.createdAt).getTime() -
                        new Date(a.createdAt).getTime()
                );
            setItems(mapped);
            // 자동 이동 X (URL 있을 때만)
            if (routeRoomId && mapped.some((m) => m.roomId === routeRoomId)) {
                setSelectedRoomId(routeRoomId);
            }
        } catch (e) {
            console.warn("[rooms] fetchRooms failed:", e);
            setItems([]);
        }
    }, [routeRoomId]);

    React.useEffect(() => { loadRooms(); }, [loadRooms]);
    React.useEffect(() => { setSelectedRoomId(routeRoomId); }, [routeRoomId]);

    // 헤더/드롭다운 등에서 새로고침 이벤트 오면 다시 불러오기
    React.useEffect(() => onMessagesRefresh(loadRooms), [loadRooms]);

    const handleSelect = async (roomId: number) => {
        setSelectedRoomId(roomId);
        navigate(`/messages/${roomId}`);

        // 낙관적 읽음 처리
        setItems((prev) =>
            prev.map((m) =>
                m.roomId === roomId ? { ...m, isRead: true, unreadCount: 0 } : m
            )
        );

        if (callReadOnce.current[roomId]) return;
        callReadOnce.current[roomId] = true;
        try {
            await markRoomRead(roomId);
        } catch (e) {
            console.warn("[read] markRoomRead failed:", e);
        }
    };

    const selectedMessage = React.useMemo(
        () => items.find((m) => m.roomId === selectedRoomId),
        [items, selectedRoomId]
    );

    return (
        <main className="mx-auto max-w-6xl px-4 mt-4">
            <section className="bg-white rounded-lg border overflow-hidden flex h-[600px] md:h-[680px] min-h-0">
                <MessageList
                    messages={items}
                    selectedId={selectedRoomId}
                    onSelect={handleSelect}
                />
                <MessageDetail
                    message={selectedMessage}
                    onSend={async () => { await loadRooms(); }}
                />
            </section>
        </main>
    );
};

export default MessagesPage;
