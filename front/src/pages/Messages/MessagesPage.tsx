// src/pages/MessagesPage.tsx
import React from "react";
import { useNavigate, useParams } from "react-router-dom";
import MessageList from "../../components/common/Message/MessageList";
import MessageDetail from "../../components/common/Message/MessageDetail";
import { fetchRooms, markRoomRead, fetchRoomMeta } from "../../api/messages";
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
                    avatarUrl: r.partnerAvatarUrl || undefined,
                }))
                .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()),
        [],
    );

    const loadFirstPage = React.useCallback(async (preserveSelection = false) => {
        if (loadingRef.current) return;
        loadingRef.current = true;
        try {
            const rooms = await fetchRooms(0, PAGE_SIZE);
            const mapped = mapRooms(rooms);
            setItems(mapped);
            setHasMore(rooms.length === PAGE_SIZE);
            setPage(0);

            // preserveSelection이 false일 때만 자동 선택 (초기 로드 시에만)
            if (!preserveSelection && routeRoomId && mapped.some((m) => m.roomId === routeRoomId)) {
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
        const handler = async (detail?: { roomId?: number; reason?: string }) => {
            // 특정 방의 메시지가 업데이트된 경우, 해당 방의 메타만 즉시 업데이트 (디테일 창 열림 여부와 무관)
            if (detail?.roomId) {
                try {
                    const meta = await fetchRoomMeta(detail.roomId);
                    setItems((prev) => {
                        const updated = prev.map((m) => {
                            if (m.roomId === detail.roomId) {
                                return {
                                    ...m,
                                    content: meta.lastMessagePreview || m.content,
                                    createdAt: meta.lastMessageAt || m.createdAt,
                                    isRead: meta.unreadCount === 0,
                                    unreadCount: meta.unreadCount,
                                };
                            }
                            return m;
                        });
                        // 최신순으로 재정렬
                        return updated.sort(
                            (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
                        );
                    });
                } catch (e) {
                    console.warn("[refresh] fetchRoomMeta failed:", e);
                }
            }
            
            // 전체 리스트는 디바운스 후 업데이트 (다른 방의 변경사항 반영)
            // preserveSelection=true로 현재 선택된 메시지 유지
            if (refreshTimerRef.current) window.clearTimeout(refreshTimerRef.current);
            refreshTimerRef.current = window.setTimeout(() => {
                loadFirstPage(true); // 현재 선택 유지
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

    React.useEffect(() => { 
        setSelectedRoomId(routeRoomId);
        
        // URL로 직접 들어왔을 때도 읽음 처리
        if (routeRoomId && !callReadOnce.current[routeRoomId]) {
            callReadOnce.current[routeRoomId] = true;
            markRoomRead(routeRoomId).then(() => {
                emitMessageRead(routeRoomId);
                setItems((prev) =>
                    prev.map((m) => (m.roomId === routeRoomId ? { ...m, isRead: true, unreadCount: 0 } : m)),
                );
            }).catch((e) => {
                console.warn("[read] markRoomRead failed (URL direct):", e);
            });
        }
    }, [routeRoomId]);

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
        <main className="mx-auto max-w-6xl xl:max-w-6xl 2xl:max-w-[2600px] px-2 sm:px-4 xl:px-4 2xl:px-20 mt-2 sm:mt-4">
            <section className="bg-white dark:bg-[var(--surface)] rounded-lg border dark:border-[var(--border-color)] overflow-hidden flex flex-col md:flex-row h-[calc(100vh-100px)] sm:h-[530px] md:h-[600px] xl:h-[600px] 2xl:h-[800px] min-h-0">
                {/* 모바일: 선택된 메시지가 없으면 목록, 있으면 상세 표시 */}
                {/* 데스크탑: 항상 목록과 상세 함께 표시 */}
                <div className={`flex flex-col ${selectedRoomId && 'hidden md:flex'} w-full md:w-[320px] xl:w-[320px] 2xl:w-[500px] shrink-0 border-r dark:border-[var(--border-color)]`}>
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
                            className="w-full py-2 text-xs sm:text-sm text-gray-500 dark:text-white/70 hover:text-gray-700 dark:hover:text-white disabled:opacity-50"
                        >
                            {loading ? "불러오는 중…" : "이전 대화 더 보기"}
                        </button>
                    )}
                </div>

                <div className={`flex-1 ${!selectedRoomId && 'hidden md:flex'}`}>
                    <MessageDetail
                        message={selectedMessage}
                        onSend={async (messageId, body) => {
                            // 메시지 전송 후 서버에서 최신 메타 정보 가져와서 리스트 업데이트
                            if (selectedRoomId) {
                                try {
                                    const meta = await fetchRoomMeta(selectedRoomId);
                                    setItems((prev) => {
                                        const updated = prev.map((m) => {
                                            if (m.roomId === selectedRoomId) {
                                                return {
                                                    ...m,
                                                    content: meta.lastMessagePreview || m.content,
                                                    createdAt: meta.lastMessageAt || m.createdAt,
                                                    isRead: meta.unreadCount === 0,
                                                    unreadCount: meta.unreadCount,
                                                };
                                            }
                                            return m;
                                        });
                                        // 최신순으로 재정렬
                                        return updated.sort(
                                            (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
                                        );
                                    });
                                } catch (e) {
                                    console.warn("[onSend] fetchRoomMeta failed:", e);
                                    // 실패 시 임시로 로컬 업데이트
                                    const now = new Date().toISOString();
                                    setItems((prev) => {
                                        const updated = prev.map((m) => {
                                            if (m.roomId === selectedRoomId) {
                                                return {
                                                    ...m,
                                                    content: body,
                                                    createdAt: now,
                                                    isRead: true,
                                                    unreadCount: 0,
                                                };
                                            }
                                            return m;
                                        });
                                        return updated.sort(
                                            (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
                                        );
                                    });
                                }
                            }
                            // 백그라운드에서 전체 리스트 갱신 (현재 선택 유지)
                            loadFirstPage(true).catch(() => {});
                        }}
                        onBack={() => {
                            setSelectedRoomId(undefined);
                            navigate('/messages');
                        }}
                    />
                </div>
            </section>
        </main>
    );
};

export default MessagesPage;
