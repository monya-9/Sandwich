// src/utils/tokenStorage.ts

// AccessToken 가져오기
export const getToken = () => {
    return (
        localStorage.getItem("accessToken") ||
        sessionStorage.getItem("accessToken")
    );
};

// AccessToken 저장
export const setToken = (accessToken: string, keep: boolean) => {
    const storage = keep ? localStorage : sessionStorage;
    storage.setItem("accessToken", accessToken);
};

// ⚡ RefreshToken 저장/가져오기 (401 재발급용)
export const getRefreshToken = () => {
    return (
        localStorage.getItem("refreshToken") ||
        sessionStorage.getItem("refreshToken")
    );
};

export const setRefreshToken = (refreshToken: string | null, keep: boolean) => {
    const storages = [localStorage, sessionStorage];
    // 먼저 둘 다 정리
    storages.forEach(s => s.removeItem("refreshToken"));
    if (refreshToken) {
        const storage = keep ? localStorage : sessionStorage;
        storage.setItem("refreshToken", refreshToken);
    }
};

// Access/Refresh 모두 삭제
export const clearToken = () => {
    localStorage.removeItem("accessToken");
    sessionStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
    sessionStorage.removeItem("refreshToken");
};
