import axios, { AxiosError, AxiosRequestConfig, AxiosHeaders } from "axios";

const api = axios.create({ baseURL: "/api" });

// 공용: 헤더에 Authorization 세팅 (AxiosHeaders | object 모두 대응)
function setAuthHeader(headers: AxiosRequestConfig["headers"], token: string) {
    if (!headers) return { Authorization: `Bearer ${token}` } as any;

    // Axios v1: AxiosHeaders에는 set 메서드가 있음
    if (headers instanceof AxiosHeaders || typeof (headers as any).set === "function") {
        (headers as AxiosHeaders).set("Authorization", `Bearer ${token}`);
        return headers;
    }

    // 그 외: 평범한 객체
    (headers as any).Authorization = `Bearer ${token}`;
    return headers;
}

// /api로 가는 요청에만 토큰 부착
api.interceptors.request.use((config) => {
    const url = config.url || "";
    if (url.startsWith("/")) {
        const token =
            localStorage.getItem("accessToken") || sessionStorage.getItem("accessToken");
        if (token) {
            config.headers = setAuthHeader(config.headers, token);
        }
    }
    return config;
});

// 401 → refresh
api.interceptors.response.use(
    (res) => res,
    async (error: AxiosError) => {
        const originalRequest: any = error.config;
        if (error.response?.status === 401 && !originalRequest?._retry) {
            originalRequest._retry = true;

            const refreshToken =
                localStorage.getItem("refreshToken") || sessionStorage.getItem("refreshToken");
            if (!refreshToken) {
                window.location.href = "/login";
                return Promise.reject(error);
            }

            try {
                const res = await axios.post("/api/auth/refresh", { refreshToken });
                const { accessToken, refreshToken: newRefreshToken } = (res as any).data;

                const keep = !!localStorage.getItem("refreshToken");
                if (keep) {
                    localStorage.setItem("accessToken", accessToken);
                    localStorage.setItem("refreshToken", newRefreshToken);
                } else {
                    sessionStorage.setItem("accessToken", accessToken);
                    sessionStorage.setItem("refreshToken", newRefreshToken);
                }

                // 원요청 재시도 시에도 안전하게 세팅
                originalRequest.headers = setAuthHeader(originalRequest.headers, accessToken);
                return api(originalRequest);
            } catch (refreshErr) {
                localStorage.clear();
                sessionStorage.clear();
                window.location.href = "/login";
                return Promise.reject(refreshErr);
            }
        }
        return Promise.reject(error);
    }
);

export default api;
