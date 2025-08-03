// AccessToken만 관리
export const getToken = () => {
    return (
        localStorage.getItem("accessToken") ||
        sessionStorage.getItem("accessToken")
    );
};

export const setToken = (accessToken: string, keep: boolean) => {
    const storage = keep ? localStorage : sessionStorage;
    storage.setItem("accessToken", accessToken);
};

export const clearToken = () => {
    localStorage.removeItem("accessToken");
    sessionStorage.removeItem("accessToken");
};
