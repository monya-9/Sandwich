// src/api/users.ts
import api from "./axiosInstance";

export type Me = {
    id: number;
    email: string;
    username: string;
    nickname?: string | null;
};

export async function getMe(): Promise<Me> {
    const { data } = await api.get<Me>("/users/me");
    return data;
}
