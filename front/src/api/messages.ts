// src/api/messages.ts
import api from "./axiosInstance";

/** ===== 서버 스키마 ===== */
export type ServerMessageType = "GENERAL" | "EMOJI" | "PROJECT_OFFER" | "SYSTEM";

export type SendMessageBody = {
    targetUserId: number;
    type: ServerMessageType;
    content: string;
    payload?: string | null;
    companyName?: string | null;
    position?: string | null;
    salary?: string | null;
    location?: string | null;
    isNegotiable?: boolean | null;
    title?: string | null;
    contact?: string | null;
    budget?: string | null;
    description?: string | null;
    clientNonce?: string | null;
};

export type ServerMessage = {
    messageId: number;
    roomId: number;
    senderId: number;
    receiverId: number;
    type: ServerMessageType;
    content: string | null;
    read: boolean;
    createdAt?: string | null; // optional 방어
};

/** ====== 방 목록(Page 래퍼) ====== */
type PageResp<T> = {
    content: T[];
    totalPages: number;
    totalElements: number;
    number: number; // current page
    size: number;
};

/** 백엔드 Room 목록 DTO (스웨거/네트워크 탭과 1:1) */
export type RoomListItemResponse = {
    roomId: number;
    partnerId: number;
    partnerName: string;
    partnerAvatarUrl: string | null;
    lastMessageId: number;
    lastMessageType: ServerMessageType;
    lastMessagePreview: string;
    lastMessageAt: string; // ISO
    unreadCount: number;
};

/** 프런트에서 쓰는 방 요약 */
export type RoomSummary = {
    roomId: number;
    peerId?: number;
    peerName: string;
    lastContent: string;
    lastAt: string;
    unreadCount: number;
};

/** 공통 API */
export async function postMessage(body: SendMessageBody) {
    const { data } = await api.post<ServerMessage>("/messages", body);
    return data;
}

export async function markRoomRead(roomId: number) {
    await api.patch(`/messages/${roomId}/read`);
}

export async function getMessage(messageId: number) {
    const { data } = await api.get<ServerMessage>(`/messages/${messageId}`);
    return data;
}

export async function deleteMessage(messageId: number) {
    await api.delete(`/messages/${messageId}`);
}

export async function uploadAttachment(roomId: number, file: File) {
    const form = new FormData();
    form.append("file", file);
    const { data } = await api.post<ServerMessage>(
        `/messages/${roomId}/attachments`,
        form,
        { headers: { "Content-Type": "multipart/form-data" } }
    );
    return data;
}

export const fileUrl = (filename: string) =>
    `/api/files/${encodeURIComponent(filename)}`;

export async function downloadRoomScreenshot(
    roomId: number,
    opts?: { tz?: string; width?: number; theme?: "light" | "dark" }
) {
    const token =
        localStorage.getItem("accessToken") || sessionStorage.getItem("accessToken");
    const tz = opts?.tz || "Asia/Seoul";
    const width = String(opts?.width ?? 960);
    const theme = opts?.theme || "light";

    const res = await fetch(
        `/api/messages/${roomId}/screenshot?tz=${encodeURIComponent(tz)}&width=${encodeURIComponent(
            width
        )}&theme=${encodeURIComponent(theme)}`,
        { method: "GET", headers: token ? { Authorization: `Bearer ${token}` } : {} }
    );
    if (!res.ok) {
        const t = await res.text();
        throw new Error(`캡처 실패: ${res.status} ${t}`);
    }
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `room-${roomId}.png`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
}

/** ✅ 방 목록: /api/rooms */
export async function fetchRooms(page = 0, size = 20) {
    const { data } = await api.get<PageResp<RoomListItemResponse>>("/rooms", {
        params: { page, size },
    });

    const list: RoomSummary[] = data.content.map((r) => ({
        roomId: r.roomId,
        peerId: r.partnerId,
        peerName: r.partnerName,
        lastContent: r.lastMessagePreview,
        lastAt: r.lastMessageAt,
        unreadCount: r.unreadCount,
    }));
    return list;
}

/** ✅ 방 히스토리: /api/rooms/{roomId}?cursorId&size (최신 30개 등) */
export type RoomHistoryResponse = {
    items: ServerMessage[];    // 백엔드 DTO 명과 다르면 여기만 맞춰주면 됨
    nextCursor: number | null;
    size: number;
};

export async function fetchRoomMessages(
    roomId: number,
    cursorId?: number,
    size = 30
) {
    const { data } = await api.get<RoomHistoryResponse>(`/rooms/${roomId}`, {
        params: { cursorId, size },
    });
    return data;
}
