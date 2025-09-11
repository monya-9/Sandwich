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

export type RoomMeta = {
    roomId: number;
    partnerId: number;
    partnerName: string;
    partnerAvatarUrl: string | null;
    lastMessageId: number | null;
    lastMessageType: ServerMessageType | null;
    lastMessagePreview: string | null;
    lastMessageAt: string | null;
    unreadCount: number;
};

/** ===== 파일 다운로드 URL ===== */
export type FileUploadDTO = {
    path: string;     // uuid.ext
    filename: string; // 원본명
    mimeType: string;
    size: number;
};

export const fileUrl = (filenameOrPath: string) =>
    `/api/files/${encodeURIComponent(filenameOrPath)}`;

/** 서버 → 프런트 필드 정규화 (+ payload 문자열 JSON 안전 파싱) */
function normalizeMessage(raw: any, fallbackRoomId?: number): ServerMessage {
    const rawPayload = raw.payload ?? null;
    const payload =
        typeof rawPayload === "string"
            ? (() => { try { return JSON.parse(rawPayload); } catch { return rawPayload; } })()
            : rawPayload;

    // 🔧 첨부 payload 정규화: 항상 url을 고정 생성 (캐시 키 안정화)
    if (payload && typeof payload === "object") {
        const p: any = payload;
        // path만 있을 때 url 생성
        if (typeof p.url !== "string" && typeof p.path === "string" && p.path) {
            p.url = fileUrl(p.path);
        }
        // url이 /api/files/.. 형식이 아닐 경우만 보정 (이미 올바르면 손대지 않음)
        if (typeof p.url === "string" && !/^https?:\/\//i.test(p.url)) {
            // 이미 '/api/files/'로 시작하면 그대로 유지
            if (!p.url.startsWith("/api/files/")) {
                p.url = `/api/files/${encodeURIComponent(p.url)}`;
            }
        }
    }

    return {
        messageId: raw.messageId ?? raw.id,
        roomId: raw.roomId ?? fallbackRoomId ?? 0,
        senderId: raw.senderId,
        receiverId: raw.receiverId,
        type: raw.type,
        content: raw.content ?? null,
        payload,
        read: Boolean(raw.read ?? raw.isRead),
        createdAt: raw.createdAt ?? raw.created_at ?? null,
        mine: raw.mine,
    };
}

/** ===== 업로드/메시징 API ===== */

/** 첨부 + ATTACHMENT 메시지 생성 (백엔드 단일 엔드포인트) */
export async function uploadAttachment(roomId: number, file: File): Promise<ServerMessage> {
    const form = new FormData();
    form.append("file", file); // 필드명은 반드시 'file'

    const token =
        localStorage.getItem("accessToken") || sessionStorage.getItem("accessToken");

    const res = await fetch(`/api/messages/${roomId}/attachments`, {
        method: "POST",
        body: form,
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        // 중요: Content-Type 설정하지 말 것! (브라우저가 boundary 포함하여 자동 설정)
        credentials: "include",
    });

    // JSON 파싱 시도
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
        // 백엔드 에러 메시지 그대로 보여주기
        const msg = (data && (data.message || data.error || data.code)) || `HTTP ${res.status}`;
        throw new Error(msg);
    }
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

    const rawItems: any[] = data.items ?? data.content ?? [];
    const items = rawItems.map((r) => normalizeMessage(r, roomId));

    const resp: RoomHistoryResponse = {
        items,
        nextCursor: data.nextCursor ?? data.nextCursorId ?? null,
        size: data.size ?? items.length,
    };
    return resp;
}

/** 참가자 */
export async function fetchRoomParticipants(roomId: number) {
    const { data } = await api.get<RoomParticipant[]>(`/rooms/${roomId}/participants`);
    return data ?? [];
}

/** 메타 (헤더/목록 요약에 사용) */
export async function fetchRoomMeta(roomId: number) {
    const { data } = await api.get<RoomMeta>(`/rooms/${roomId}/meta`);
    return data;
}

/** (호환용) sendAttachment – 현재는 /attachments 단일 경로만 사용 */
export async function sendAttachment(roomId: number, file: File): Promise<ServerMessage> {
    return uploadAttachment(roomId, file);
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
