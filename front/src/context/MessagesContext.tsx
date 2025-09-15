// src/context/MessagesContext.tsx
import React from "react";
import type { Message } from "../types/Message";
import { fetchRooms } from "../api/messages";
import { onMessagesRefresh, onMessageRead } from "../lib/messageEvents";

type Ctx = {
    messages: Message[];
    totalUnread: number;
    loadRooms: () => Promise<void>;
    markAsReadLocal: (roomId: number) => void;
};

const MessagesContext = React.createContext<Ctx | null>(null);

function normalize(rooms: any[]): Message[] {
    return rooms
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
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

export function MessagesProvider({ children }: { children: React.ReactNode }) {
    const [messages, setMessages] = React.useState<Message[]>([]);

    const loadRooms = React.useCallback(async () => {
        const rooms = await fetchRooms();
        setMessages(normalize(rooms));
    }, []);

    const markAsReadLocal = React.useCallback((roomId: number) => {
        setMessages((prev) =>
            prev.map((m) =>
                (m.roomId ?? (m as any).id) === roomId ? { ...m, isRead: true, unreadCount: 0 } : m
            )
        );
    }, []);

    // 초기 로드
    React.useEffect(() => {
        loadRooms().catch(() => void 0);
    }, [loadRooms]);

    // 전역 이벤트: 읽음 → 로컬 즉시 패치
    React.useEffect(() => onMessageRead((roomId) => markAsReadLocal(roomId)), [markAsReadLocal]);

    // 전역 이벤트: 보냄/수신/삭제 → 목록 새로고침
    React.useEffect(
        () =>
            onMessagesRefresh((d) => {
                if (d?.reason && ["sent", "recv", "delete"].includes(d.reason)) {
                    loadRooms().catch(() => void 0);
                }
            }),
        [loadRooms]
    );

    const totalUnread = React.useMemo(
        () => messages.reduce((n, m) => n + (m.unreadCount ?? (m.isRead ? 0 : 1)), 0),
        [messages]
    );

    const value: Ctx = { messages, totalUnread, loadRooms, markAsReadLocal };
    return <MessagesContext.Provider value={value}>{children}</MessagesContext.Provider>;
}

export function useMessages() {
    const ctx = React.useContext(MessagesContext);
    if (!ctx) throw new Error("useMessages must be used within MessagesProvider");
    return ctx;
}
