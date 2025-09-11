// src/pages/MessagesPage.tsx
import React from "react";
import { useNavigate, useParams } from "react-router-dom";
import MessageList from "../../components/common/Message/MessageList";
import MessageDetail from "../../components/common/Message/MessageDetail";
import { fetchRooms, markRoomRead } from "../../api/messages";
import type { Message } from "../../types/Message";
import { onMessagesRefresh, emitMessageRead } from "../../lib/messageEvents";

const PAGE_SIZE = 20;

const MessagesPage: React.FC = () => {
    const navigate = useNavigate();
    const { id } = useParams<{ id?: string }>();
    const routeRoomId = id ? Number(id) : undefined;

    const [items, setItems] = React.useState<Message[]>([]);
    const [selectedRoomId, setSelectedRoomId] = React.useState<number | undefined>(routeRoomId);

    const [page, setPage] = React.useState(0);
    const [hasMore, setHasMore] = React.useState(true);
    const [loading, setLoading] = React.useState(false); // 버튼 UI용

    const loadingRef = React.useRef(false);              // 동시 실행 가드
    const refreshTimerRef = React.useRef<number | null>(null); // 디바운스 타이머
    const callReadOnce = React.useRef<Record<number, boolean>>({});

    const mapRooms = React.useCallback(
        (rooms: Awaited<ReturnType<typeof fetchRooms>>) =>
            rooms
                .map((r) => ({
                    id: r.roomId,
                    roomId: r.roomId,
                    title: r.peerName,
                    sender: r.peerName,
                    content: r.lastContent,
                    createdAt: r.lastAt,
                    isRead: r.unreadCount === 0,
                    unreadCount: r.unreadCount,
                    receiverId: r.peerId ?? null,
                }))
                .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()),
        [],
    );

    const loadFirstPage = React.useCallback(async () => {
        if (loadingRef.current) return;
        loadingRef.current = true;
        try {
            const rooms = await fetchRooms(0, PAGE_SIZE);
            const mapped = mapRooms(rooms);
            setItems(mapped);
            setHasMore(rooms.length === PAGE_SIZE);
            setPage(0);

            if (routeRoomId && mapped.some((m) => m.roomId === routeRoomId)) {
                setSelectedRoomId(routeRoomId);
            }
        } catch (e) {
            console.warn("[rooms] fetchRooms first page failed:", e);
            setItems([]);
            setHasMore(false);
            setPage(0);
        } finally {
            loadingRef.current = false;
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [mapRooms, routeRoomId]);

    const loadMore = React.useCallback(async () => {
        if (loading || !hasMore) return;
        setLoading(true);
        try {
            const nextPage = page + 1;
            const rooms = await fetchRooms(nextPage, PAGE_SIZE);
            const mapped = mapRooms(rooms);

            setItems((prev) => {
                const byId = new Map<number, Message>();

                // ✅ 키 보장: roomId ?? id 가 숫자일 때만 set
                prev.forEach((m) => {
                    const key =
                        typeof (m as any).roomId === "number"
                            ? (m as any).roomId
                            : typeof (m as any).id === "number"
                                ? (m as any).id
                                : undefined;
                    if (typeof key === "number") byId.set(key, m);
                });

                mapped.forEach((m) => {
                    const key =
                        typeof (m as any).roomId === "number"
                            ? (m as any).roomId
                            : typeof (m as any).id === "number"
                                ? (m as any).id
                                : undefined;
                    if (typeof key === "number") byId.set(key, m);
                });

                return Array.from(byId.values()).sort(
                    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
                );
            });

            setHasMore(rooms.length === PAGE_SIZE);
            setPage(nextPage);
        } catch (e) {
            console.warn("[rooms] fetchRooms more failed:", e);
        } finally {
            setLoading(false);
        }
    }, [loading, hasMore, page, mapRooms]);

    React.useEffect(() => { loadFirstPage(); }, [loadFirstPage]);

    React.useEffect(() => {
        const handler = () => {
            if (refreshTimerRef.current) window.clearTimeout(refreshTimerRef.current);
            refreshTimerRef.current = window.setTimeout(() => {
                loadFirstPage();
                refreshTimerRef.current = null;
            }, 300);
        };
        const unsubscribe = onMessagesRefresh(handler);
        return () => {
            if (refreshTimerRef.current) window.clearTimeout(refreshTimerRef.current);
            unsubscribe?.();
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    React.useEffect(() => { setSelectedRoomId(routeRoomId); }, [routeRoomId]);

    const handleSelect = async (roomId: number) => {
        setSelectedRoomId(roomId);
        navigate(`/messages/${roomId}`);

        setItems((prev) =>
            prev.map((m) => (m.roomId === roomId ? { ...m, isRead: true, unreadCount: 0 } : m)),
        );

        emitMessageRead(roomId);

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
        [items, selectedRoomId],
    );

    return (
        <main className="mx-auto max-w-6xl px-4 mt-4">
            <section className="bg-white rounded-lg border overflow-hidden flex h-[530px] md:h-[600px] min-h-0">
                <div className="flex flex-col w-[320px] shrink-0 border-r">
                    <MessageList
                        messages={items}
                        selectedId={selectedRoomId}
                        onSelect={handleSelect}
                    />
                    {hasMore && (
                        <button
                            type="button"
                            onClick={loadMore}
                            disabled={loading}
                            className="w-full py-2 text-sm text-gray-500 hover:text-gray-700 disabled:opacity-50"
                        >
                            {loading ? "불러오는 중…" : "이전 대화 더 보기"}
                        </button>
                    )}
                </div>

                <MessageDetail
                    message={selectedMessage}
                    onSend={async () => { await loadFirstPage(); }}
                />
            </section>
        </main>
    );
};

export default MessagesPage;
