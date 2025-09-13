// src/api/emojis.ts
import api from "../api/axiosInstance";

export type EmojiCategory = string; // 서버는 string[] 반환

export type EmojiItem = {
    char: string;         // 🟢 실제 이모지 문자가 여기에 옴
    shortcode?: string;   // :grinning:
    category?: string;
    keywords?: string[];
};

export type EmojiListResponse = {
    total: number;
    page: number; // 0-based
    size: number;
    items: EmojiItem[];
};

// 카테고리: string[]
export async function getEmojiCategories(): Promise<string[]> {
    const { data } = await api.get<string[]>("/emojis/categories");
    // 방어: 배열 아니면 빈 배열
    return Array.isArray(data) ? data : [];
}

// 목록: { total,page,size,items[] }
export async function listEmojis(params: {
    category?: string;
    page?: number; // 0-based
    size?: number; // 서버가 1~200 제한
    q?: string;
}): Promise<EmojiListResponse> {
    const { data } = await api.get<EmojiListResponse>("/emojis", { params });
    const safe = (v: any) => (typeof v === "number" && isFinite(v) ? v : 0);
    return {
        total: safe(data?.total),
        page: safe(data?.page),
        size: safe(data?.size) || (params.size ?? 60),
        items: Array.isArray(data?.items) ? data!.items : [],
    };
}
