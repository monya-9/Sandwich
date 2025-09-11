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

// AccessToken 삭제
export const clearToken = () => {
    localStorage.removeItem("accessToken");
    sessionStorage.removeItem("accessToken");
};
