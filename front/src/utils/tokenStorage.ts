// src/utils/tokenStorage.ts
const ACCESS_KEY = "accessToken";
const REFRESH_KEY = "refreshToken";

/* ---------- 토큰 변경 이벤트 (WS 재연결 등에 사용) ---------- */
export type TokenListener = (accessToken: string | null) => void;
const listeners = new Set<TokenListener>();

export const onAccessTokenChange = (fn: TokenListener) => {
    listeners.add(fn);
    return () => listeners.delete(fn);
};
function emitAccessTokenChange(token: string | null) {
    listeners.forEach((fn) => fn(token));
}

/* ---------- Access Token ---------- */
export const getToken = (): string | null =>
    localStorage.getItem(ACCESS_KEY) || sessionStorage.getItem(ACCESS_KEY);

/** keep=true면 localStorage, false면 sessionStorage에 저장 */
export const setToken = (accessToken: string | null, keep: boolean) => {
    // 먼저 모두 제거
    localStorage.removeItem(ACCESS_KEY);
    sessionStorage.removeItem(ACCESS_KEY);

    if (accessToken) {
        const storage = keep ? localStorage : sessionStorage;
        storage.setItem(ACCESS_KEY, accessToken);
    }
    emitAccessTokenChange(accessToken ?? null);
};

/* ---------- Refresh Token (쿠키 기반이면 사용 안 할 수도 있음) ---------- */
export const getRefreshToken = (): string | null =>
    localStorage.getItem(REFRESH_KEY) || sessionStorage.getItem(REFRESH_KEY);

/** keep=true면 localStorage, false면 sessionStorage에 저장 */
export const setRefreshToken = (refreshToken: string | null, keep: boolean) => {
    localStorage.removeItem(REFRESH_KEY);
    sessionStorage.removeItem(REFRESH_KEY);

    if (refreshToken) {
        const storage = keep ? localStorage : sessionStorage;
        storage.setItem(REFRESH_KEY, refreshToken);
    }
};

/* ---------- 모두 삭제 ---------- */
export const clearToken = () => {
    localStorage.removeItem(ACCESS_KEY);
    sessionStorage.removeItem(ACCESS_KEY);
    localStorage.removeItem(REFRESH_KEY);
    sessionStorage.removeItem(REFRESH_KEY);
    emitAccessTokenChange(null);
};
