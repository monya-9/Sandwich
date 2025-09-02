// src/pages/MessagesPage.tsx
import React from "react";
import { useNavigate, useParams } from "react-router-dom";
import MessageList from "../../components/common/Message/MessageList";
import MessageDetail from "../../components/common/Message/MessageDetail";
import { fetchRooms, markRoomRead } from "../../api/messages";
import type { Message } from "../../types/Message";

const MessagesPage: React.FC = () => {
    const navigate = useNavigate();
    const { id } = useParams<{ id?: string }>();
    const routeRoomId = id ? Number(id) : undefined;

    const [items, setItems] = React.useState<Message[]>([]);
    const [selectedRoomId, setSelectedRoomId] = React.useState<number | undefined>(routeRoomId);
    const callReadOnce = React.useRef<Record<number, boolean>>({});

    const loadRooms = React.useCallback(async () => {
        try {
            const rooms = await fetchRooms();
            const mapped: Message[] = rooms
                .map((r) => ({
                    id: r.roomId,          // 리스트 key
                    roomId: r.roomId,
                    title: r.peerName,
                    sender: r.peerName,
                    content: r.lastContent,
                    createdAt: r.lastAt,
                    isRead: r.unreadCount === 0,
                    unreadCount: r.unreadCount,
                    // ✅ 상세에서 상대 id로 사용 (없으면 undefined)
                    receiverId: r.peerId ?? null,
                }))
                .sort(
                    (a, b) =>
                        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
                );

            setItems(mapped);

            if (!routeRoomId && mapped[0]?.roomId) {
                setSelectedRoomId(mapped[0].roomId!);
                navigate(`/messages/${mapped[0].roomId}`);
            }
        } catch (e) {
            console.warn("[rooms] fetchRooms failed:", e);
            setItems([]);
        }
    }, [navigate, routeRoomId]);

    React.useEffect(() => { loadRooms(); }, [loadRooms]);
    React.useEffect(() => { setSelectedRoomId(routeRoomId); }, [routeRoomId]);

    const handleSelect = async (roomId: number) => {
        setSelectedRoomId(roomId);
        navigate(`/messages/${roomId}`);

        // 낙관적 읽음 처리
        setItems((prev) =>
            prev.map((m) => (m.roomId === roomId ? { ...m, isRead: true, unreadCount: 0 } : m))
        );

        // 서버 읽음 (중복 방지)
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
                    onSend={async () => { await loadRooms(); }}  // 전송 뒤 목록 갱신
                />
            </section>
        </main>
    );
};

export default MessagesPage;
