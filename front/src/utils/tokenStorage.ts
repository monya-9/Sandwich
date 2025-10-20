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

export const setToken = (accessToken: string | null, keep: boolean) => {
    // ✅ 기존 토큰 삭제
    localStorage.removeItem(ACCESS_KEY);
    sessionStorage.removeItem(ACCESS_KEY);

    if (accessToken) {
        const storage = keep ? localStorage : sessionStorage;
        storage.setItem(ACCESS_KEY, accessToken);
    }
    emitAccessTokenChange(accessToken ?? null);
};

/* ---------- Refresh Token ---------- */
export const getRefreshToken = (): string | null =>
    localStorage.getItem(REFRESH_KEY) || sessionStorage.getItem(REFRESH_KEY);

export const setRefreshToken = (refreshToken: string | null, keep: boolean) => {
    // ✅ 기존 리프레시 토큰 삭제
    localStorage.removeItem(REFRESH_KEY);
    sessionStorage.removeItem(REFRESH_KEY);

    if (refreshToken) {
        const storage = keep ? localStorage : sessionStorage;
        storage.setItem(REFRESH_KEY, refreshToken);
    }
};

/* ---------- 모든 사용자 데이터 삭제 ---------- */
export const clearAllUserData = () => {
    const keysToRemove = [
        ACCESS_KEY,
        REFRESH_KEY,
        "userEmail",
        "userNickname", 
        "userUsername",
        "userProfileName",
        "userId"
        // lastLoginMethod는 브라우저 설정이므로 삭제하지 않음
    ];
    
    keysToRemove.forEach(key => {
        localStorage.removeItem(key);
        sessionStorage.removeItem(key);
    });
    
    // ✅ 프로젝트 캐시도 삭제 (깜빡임 방지)
    localStorage.removeItem("my_projects_cache_v1");
    localStorage.removeItem("profile_work_order");
    
    emitAccessTokenChange(null);
};

/* ---------- 토큰만 삭제 ---------- */
export const clearToken = () => {
    localStorage.removeItem(ACCESS_KEY);
    sessionStorage.removeItem(ACCESS_KEY);
    localStorage.removeItem(REFRESH_KEY);
    sessionStorage.removeItem(REFRESH_KEY);
    emitAccessTokenChange(null);
};
