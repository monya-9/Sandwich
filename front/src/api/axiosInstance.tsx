// src/api/axiosInstance.ts
import axios, { AxiosError, AxiosHeaders, AxiosRequestConfig } from "axios";

const api = axios.create({
    baseURL: "/api",
    withCredentials: true,
});

/* -------- Authorization 헤더 세팅 -------- */
function setAuthHeader(headers: AxiosRequestConfig["headers"], token: string) {
    if (!headers) return { Authorization: `Bearer ${token}` } as any;
    if (headers instanceof AxiosHeaders || typeof (headers as any).set === "function") {
        (headers as AxiosHeaders).set("Authorization", `Bearer ${token}`);
        return headers;
    }
    (headers as any).Authorization = `Bearer ${token}`;
    return headers;
}

/* -------- Request 인터셉터 -------- */
api.interceptors.request.use((config) => {
    // 1) 토큰 자동 부착
    const token = localStorage.getItem("accessToken") || sessionStorage.getItem("accessToken");
    if (token) config.headers = setAuthHeader(config.headers, token);

    // 2) FormData면 Content-Type 제거(브라우저가 자동 설정)
    const data = config.data as any;
    if (data instanceof FormData) {
        const h: any = config.headers;
        if (h?.get && h?.delete) {
            if (h.get("Content-Type")) h.delete("Content-Type");
            if (h.get("content-type")) h.delete("content-type");
        } else if (h) {
            if (h["Content-Type"]) delete h["Content-Type"];
            if ((h as any)["content-type"]) delete (h as any)["content-type"];
        }
    }
    return config;
});

/* -------- 401 리프레시 가능 여부 -------- */
function isRefreshable401(error: AxiosError) {
    if (error.response?.status !== 401) return false;

    const url = String(error.config?.url || "");
    // 인증/리프레시 자체는 제외
    if (/\/auth\/(login|signin|register|refresh)/.test(url)) return false;

    // ✅ 백엔드는 body refreshToken 필수 → 로컬/세션에 없으면 시도하지 않음
    const hasRT =
        !!localStorage.getItem("refreshToken") || !!sessionStorage.getItem("refreshToken");
    return hasRT;
}

/* -------- 401 처리: refresh 단일 진행 + 대기열 -------- */
let isRefreshing = false;
let pendingQueue: Array<(token: string | null) => void> = [];

const REFRESH_ENDPOINT = "/api/auth/refresh";

function resolveQueue(token: string | null) {
    pendingQueue.forEach((cb) => cb(token));
    pendingQueue = [];
}

api.interceptors.response.use(
    (res) => res,
    async (error: AxiosError) => {
        const original: any = error.config;

        if (error.response?.status !== 401) return Promise.reject(error);
        if (original?._retry) return Promise.reject(error);

        if (!isRefreshable401(error)) {
            return Promise.reject(error);
        }

        original._retry = true;

        if (isRefreshing) {
            return new Promise((resolve, reject) => {
                pendingQueue.push((newToken) => {
                    if (!newToken) return reject(error);
                    try {
                        original.headers = setAuthHeader(original.headers, newToken);
                        resolve(api(original));
                    } catch (e) {
                        reject(e);
                    }
                });
            });
        }

        isRefreshing = true;
        try {
            const storedRefresh =
                localStorage.getItem("refreshToken") || sessionStorage.getItem("refreshToken");
            if (!storedRefresh) throw new Error("No refresh token stored");

            // refresh는 전역 axios로(Authorization 인터셉터 회피)
            const r = await axios.post(
                REFRESH_ENDPOINT,
                { refreshToken: storedRefresh },
                { withCredentials: true }
            );

            const { accessToken, refreshToken: newRefreshToken } = (r as any).data || {};
            if (!accessToken) throw new Error("No accessToken from refresh");

            const keep = !!localStorage.getItem("refreshToken");
            if (keep) {
                localStorage.setItem("accessToken", accessToken);
                if (newRefreshToken !== undefined && newRefreshToken !== null) {
                    localStorage.setItem("refreshToken", newRefreshToken);
                }
            } else {
                sessionStorage.setItem("accessToken", accessToken);
                if (newRefreshToken !== undefined && newRefreshToken !== null) {
                    sessionStorage.setItem("refreshToken", newRefreshToken);
                }
            }

            resolveQueue(accessToken);

            original.headers = setAuthHeader(original.headers, accessToken);
            return api(original);
        } catch (e) {
            resolveQueue(null);
            return Promise.reject(e);
        } finally {
            isRefreshing = false;
        }
    }
);

export default api;
