// src/api/messages.ts
import api from "../api/axiosInstance";

/** ===== 서버 스키마 (Swagger) ===== */
export type ServerMessageType = "GENERAL" | "EMOJI" | "PROJECT_OFFER" | "SYSTEM";

export type SendMessageBody = {
    targetUserId: number;       // 수신자
    type: ServerMessageType;    // GENERAL | EMOJI | PROJECT_OFFER ...
    content: string;

    // 선택 필드 (채용/프로젝트 제안 등에서 사용)
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

    companyName?: string | null;
    position?: string | null;
    salary?: string | null;
    location?: string | null;
    isNegotiable?: boolean | null;
    title?: string | null;
    contact?: string | null;
    budget?: string | null;
    description?: string | null;

    read: boolean;
};

/** ===== API calls ===== */
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

/** 첨부 업로드 (멀티파트) */
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

/** 파일 접근 URL */
export const fileUrl = (filename: string) =>
    `/api/files/${encodeURIComponent(filename)}`;
