// src/api/users.ts
import api from "./axiosInstance";

export type Me = {
    id: number;
    email: string;
    username: string;
    nickname?: string | null;
    profileSlug?: string | null; // 프로필 URL용 슬러그
};

export async function getMe(): Promise<Me> {
    const { data } = await api.get<Me>("/users/me");
    return data;
}
