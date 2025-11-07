// src/utils/tokenStorage.ts
// ✅ httpOnly 쿠키 기반: 이 파일의 대부분 함수는 deprecated
// 토큰은 더 이상 localStorage에 저장되지 않고 httpOnly 쿠키로 관리됨

const ACCESS_KEY = "accessToken";
const REFRESH_KEY = "refreshToken";

/* ---------- 토큰 변경 이벤트 (WS 재연결 등에 사용) ---------- */
// ⚠️ deprecated: httpOnly 쿠키는 JS에서 접근 불가하므로 이벤트가 발생하지 않음
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
// ⚠️ deprecated: httpOnly 쿠키로 관리되므로 항상 null 반환
export const getToken = (): string | null => null;

// ⚠️ deprecated: httpOnly 쿠키로 관리되므로 사용하지 않음
export const setToken = (accessToken: string | null, keep: boolean) => {
    // ✅ 기존 토큰 삭제만 수행 (마이그레이션용)
    localStorage.removeItem(ACCESS_KEY);
    sessionStorage.removeItem(ACCESS_KEY);
    
    // httpOnly 쿠키로 관리되므로 저장하지 않음
    emitAccessTokenChange(null);
};

/* ---------- Refresh Token ---------- */
// ⚠️ deprecated: httpOnly 쿠키로 관리되므로 항상 null 반환
export const getRefreshToken = (): string | null => null;

// ⚠️ deprecated: httpOnly 쿠키로 관리되므로 사용하지 않음
export const setRefreshToken = (refreshToken: string | null, keep: boolean) => {
    // ✅ 기존 리프레시 토큰 삭제만 수행 (마이그레이션용)
    localStorage.removeItem(REFRESH_KEY);
    sessionStorage.removeItem(REFRESH_KEY);
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
