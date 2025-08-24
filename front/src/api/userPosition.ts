// src/api/userPosition.ts
type ApiHeaders = Record<string, string>;

const BASE =
    process.env.REACT_APP_API_BASE_URL ??
    process.env.NEXT_PUBLIC_API_BASE_URL ??
    "http://localhost:8080";

const authHeaders = (): ApiHeaders => {
    const token = localStorage.getItem("accessToken");
    return token ? { Authorization: `Bearer ${token}` } : {};
};

// JSON 헤더 합치기 도우미
const withJson = (h: ApiHeaders = {}): ApiHeaders => ({
    "Content-Type": "application/json",
    ...h,
});

export async function getMyPosition(): Promise<{ positionName: string } | null> {
    const r = await fetch(`${BASE}/api/users/position`, {
        headers: authHeaders(), // ✅ 타입 맞음
    });
    if (r.status === 204) return null;
    if (!r.ok) throw new Error("getMyPosition failed");
    return r.json();
}

export async function putMyPosition(positionId: number) {
    const r = await fetch(`${BASE}/api/users/position`, {
        method: "PUT",
        headers: withJson(authHeaders()), // ✅ 스프레드 가능
        body: JSON.stringify({ positionId }),
    });
    if (!r.ok) throw new Error("putMyPosition failed");
}
