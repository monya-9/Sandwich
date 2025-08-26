import { getToken } from "../utils/tokenStorage";

type ApiHeaders = Record<string, string>;
type RawUserPos = Partial<{ positionId: number | null; positionName: string | null }>;
export type UserPosition = { id: number | null; name: string | null };

const BASE =
    (typeof import.meta !== "undefined" && (import.meta as any).env?.VITE_API_BASE_URL) ||
    process.env.REACT_APP_API_BASE_URL ||
    process.env.NEXT_PUBLIC_API_BASE_URL ||
    "http://localhost:8080";

const authHeaders = (): ApiHeaders => {
    const token = getToken();
    return token ? { Authorization: `Bearer ${token}` } : {};
};

const withJson = (h: ApiHeaders = {}): ApiHeaders => ({
    "Content-Type": "application/json",
    ...h,
});

const normalize = (raw: RawUserPos | null): UserPosition => ({
    id: raw?.positionId ?? null,
    name: raw?.positionName ?? null,
});

export async function getMyPosition(): Promise<UserPosition> {
    const r = await fetch(`${BASE}/api/users/position`, { headers: authHeaders() });
    if (r.status === 204) return { id: null, name: null };
    if (!r.ok) throw new Error(`getMyPosition failed: ${r.status}`);
    const data = (await r.json()) as RawUserPos;
    return normalize(data ?? null);
}

export async function putMyPosition(positionId: number): Promise<void> {
    const r = await fetch(`${BASE}/api/users/position`, {
        method: "PUT",
        headers: withJson(authHeaders()),
        body: JSON.stringify({ positionId }),
    });
    if (!r.ok) throw new Error(`putMyPosition failed: ${r.status}`);
}
