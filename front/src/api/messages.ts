// src/api/messages.ts
import api from "./axiosInstance";

/** ===== 서버 스키마 ===== */
export type ServerMessageType =
    | "GENERAL"
    | "EMOJI"
    | "PROJECT_PROPOSAL"
    | "PROJECT_OFFER"
    | "JOB_OFFER"
    | "ATTACHMENT"
    | "SYSTEM";

export type SendMessageBody = {
    targetUserId: number;
    type: ServerMessageType;
    content: string;
    payload?: unknown | null;

    companyName?: string | null;
    position?: string | null;
    salary?: string | null;
    location?: string | null;
    isNegotiable?: boolean | null;
    title?: string | null;
    contact?: string | null;
    budget?: string | number | null;
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
    payload?: any | null;
    read: boolean;
    createdAt?: string | null;
    mine?: boolean;
};

type PageResp<T> = {
    content: T[];
    totalPages: number;
    totalElements: number;
    number: number;
    size: number;
};

/** ===== 방 목록 DTO(백엔드) ===== */
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

/** ===== 프런트 요약 ===== */
export type RoomSummary = {
    roomId: number;
    peerId?: number;
    peerName: string;
    lastContent: string;
    lastAt: string;
    unreadCount: number;
};

export type RoomParticipant = {
    id: number;
    nickname: string;
    profileImage: string | null;
};

/** ===== 파일 업로드/다운로드 ===== */
export type FileUploadDTO = {
    path: string;     // uuid.ext
    filename: string; // 원본명
    mimeType: string;
    size: number;
};

export const fileUrl = (filenameOrPath: string) =>
    `/api/files/${encodeURIComponent(filenameOrPath)}`;

/** 서버 → 프런트 필드 정규화 */
function normalizeMessage(raw: any, fallbackRoomId?: number): ServerMessage {
    return {
        messageId: raw.messageId ?? raw.id,                // ★ 핵심
        roomId: raw.roomId ?? fallbackRoomId ?? 0,
        senderId: raw.senderId,
        receiverId: raw.receiverId,
        type: raw.type,
        content: raw.content ?? null,
        payload: raw.payload ?? null,
        read: Boolean(raw.read ?? raw.isRead),
        createdAt: raw.createdAt ?? raw.created_at ?? null,
        mine: raw.mine,
    };
}

/** ⚠️ multipart 헤더 수동 지정 금지 */
export async function uploadFile(file: File): Promise<FileUploadDTO> {
    const form = new FormData();
    form.append("file", file);
    const { data } = await api.post<FileUploadDTO>("/files", form);
    return data;
}

/** 신스펙: 첨부 + ATTACHMENT 메시지 생성 */
export async function uploadAttachment(roomId: number, file: File): Promise<ServerMessage> {
    const form = new FormData();
    form.append("file", file); // 필드명 'file'
    const { data } = await api.post(`/messages/${roomId}/attachments`, form);
    return normalizeMessage(data, roomId);
}

/** 메시지 전송 */
export async function postMessage(body: SendMessageBody) {
    const { data } = await api.post("/messages", body);
    return normalizeMessage(data);
}

export async function markRoomRead(roomId: number) {
    await api.patch(`/messages/${roomId}/read`);
}

export async function getMessage(messageId: number) {
    const { data } = await api.get(`/messages/${messageId}`);
    return normalizeMessage(data);
}

export async function deleteMessage(messageId: number) {
    await api.delete(`/messages/${messageId}`);
}

/** 방 목록 */
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

/** 방 히스토리(커서) */
export type RoomHistoryResponse = {
    items: ServerMessage[];
    nextCursor: number | null;
    size: number;
};

export async function fetchRoomMessages(roomId: number, cursorId?: number, size = 30) {
    const { data } = await api.get<any>(`/rooms/${roomId}`, {
        params: { cursorId, size },
    });

    // 서버 응답 유연 대응
    const rawItems: any[] = data.items ?? data.content ?? [];
    const items = rawItems.map((r) => normalizeMessage(r, roomId));

    const resp: RoomHistoryResponse = {
        items,
        nextCursor: data.nextCursor ?? data.nextCursorId ?? null,
        size: data.size ?? items.length,
    };
    return resp;
}

// 참가자
export async function fetchRoomParticipants(roomId: number) {
    const { data } = await api.get<RoomParticipant[]>(
        `/rooms/${roomId}/participants`
    );
    return data ?? [];
}

/** (옵션) 대화 캡처 */
export async function downloadRoomScreenshot(
    roomId: number,
    opts?: { tz?: string; width?: number; theme?: "light" | "dark" }
) {
    const tz = opts?.tz || Intl.DateTimeFormat().resolvedOptions().timeZone || "Asia/Seoul";
    const width = String(opts?.width ?? 960);
    const theme = opts?.theme || "light";

    const token = localStorage.getItem("accessToken") || sessionStorage.getItem("accessToken");
    const headers: Record<string, string> = {};
    if (token) headers.Authorization = `Bearer ${token}`;

    const qs = `?tz=${encodeURIComponent(tz)}&width=${encodeURIComponent(width)}&theme=${encodeURIComponent(theme)}`;
    const candidates = [
        `/api/rooms/${roomId}/screenshot${qs}`,
        `/api/messages/${roomId}/screenshot${qs}`,
    ];

    let res: Response | null = null;
    for (const url of candidates) {
        try {
            res = await fetch(url, { method: "GET", headers });
            if (res.ok) break;
        } catch {}
    }
    if (!res || !res.ok) {
        const body = res ? await res.text().catch(() => "") : "";
        throw new Error(`스크린샷 요청 실패${res ? ` (${res.status})` : ""}: ${body || "알 수 없음"}`);
    }

    const blob = await res.blob();
    const cd = res.headers.get("Content-Disposition") || "";
    const m = /filename\*?=(?:UTF-8''|")?([^;"']+)/i.exec(cd);
    const filename = (m && decodeURIComponent(m[1])) || `room-${roomId}.png`;

    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
}
