import api from "./axiosInstance";

type RawUserPos = Partial<{ positionId: number | null; positionName: string | null }>;
export type UserPosition = { id: number | null; name: string | null };

const normalize = (raw: RawUserPos | null): UserPosition => ({
    id: raw?.positionId ?? null,
    name: raw?.positionName ?? null,
});

export async function getMyPosition(): Promise<UserPosition> {
    try {
        const res = await api.get("/users/position");
        return normalize(res.data ?? null);
    } catch (error: any) {
        if (error.response?.status === 204) return { id: null, name: null };
        throw new Error(`getMyPosition failed: ${error.response?.status || error.message}`);
    }
}

export async function putMyPosition(positionId: number): Promise<void> {
    try {
        await api.put("/users/position", { positionId });
    } catch (error: any) {
        throw new Error(`putMyPosition failed: ${error.response?.status || error.message}`);
    }
}
