// src/api/message.adapter.ts
import type { ServerMessage } from "./messages";

/** UI에서 쓰는 메시지 타입 */
export type UiMessage = {
    id: number;
    title: string;
    content: string;
    createdAt: string;
    sender: string;
    isRead: boolean;
    unreadCount?: number;

    // 백엔드 메타
    roomId?: number;
    senderId?: number;
    receiverId?: number;
    serverType?: string;
};

export function serverToUi(
    s: ServerMessage,
    opts?: { senderName?: string; createdAt?: string }
): UiMessage {
    const title = (s.content ?? "").slice(0, 40) || "(빈 메시지)";
    return {
        id: s.messageId,
        title,
        content: s.content ?? "",
        createdAt: opts?.createdAt ?? new Date().toISOString(),
        sender: opts?.senderName ?? `user#${s.senderId}`,
        isRead: s.read,
        unreadCount: s.read ? 0 : 1,
        roomId: s.roomId,
        senderId: s.senderId,
        receiverId: s.receiverId,
        serverType: s.type,
    };
}
