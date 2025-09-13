// src/api/notifications.ts
import api from "./axiosInstance";
import type {
    NotificationPageDTO,
    UnreadCountDTO,
} from "../types/Notification";
import { toNotifyItem } from "../types/Notification";

export async function fetchNotifications(opt: { size?: number; cursor?: string } = {}) {
    const { size = 20, cursor } = opt;
    // baseURL이 "/api"이므로 선행 슬래시 없이!
    const { data } = await api.get<NotificationPageDTO>("notifications", {
        params: { size, cursor },
    });
    return {
        items: data.items.map(toNotifyItem),
        nextCursor: data.nextCursor ?? null,
    };
}

export async function fetchUnreadCount() {
    const { data } = await api.get<UnreadCountDTO>("notifications/unread-count");
    return data;
}

export async function markRead(ids: number[]) {
    // ✅ PATCH 메서드 사용
    const { data } = await api.patch<UnreadCountDTO>("notifications/read", { ids });
    return data;
}

export async function markAllRead() {
    // ✅ read-all 은 POST
    const { data } = await api.post<UnreadCountDTO>("notifications/read-all");
    return data;
}
