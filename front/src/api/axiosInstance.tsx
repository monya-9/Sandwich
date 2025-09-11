// src/api/axiosInstance.ts
import axios, { AxiosError, AxiosHeaders, AxiosRequestConfig } from "axios";

/**
 * 공용 axios 인스턴스
 * - baseURL: /api
 * - withCredentials: true (쿠키 사용 시)
 */
const api = axios.create({
    baseURL: "/api",
    withCredentials: true,
});

/* ---------------- Authorization 헤더 세팅 ---------------- */

function setAuthHeader(headers: AxiosRequestConfig["headers"], token: string) {
    if (!headers) return { Authorization: `Bearer ${token}` } as any;

    // Axios 1.x 의 AxiosHeaders 또는 set 메서드 보유 객체 대응
    if (headers instanceof AxiosHeaders || typeof (headers as any).set === "function") {
        (headers as AxiosHeaders).set("Authorization", `Bearer ${token}`);
        return headers;
    }
    (headers as any).Authorization = `Bearer ${token}`;
    return headers;
}

/* ---------------- Request 인터셉터 ---------------- */

api.interceptors.request.use((config) => {
    // 1) 토큰 자동 부착
    const token =
        localStorage.getItem("accessToken") || sessionStorage.getItem("accessToken");
    if (token) config.headers = setAuthHeader(config.headers, token);

    // 2) 업로드(FormData)일 때는 Content-Type을 **절대 수동 지정하지 않도록 제거**
    //    브라우저가 boundary 포함한 multipart/form-data 를 자동으로 채워준다.
    const data = config.data as any;
    if (data instanceof FormData) {
        const h: any = config.headers;
        // AxiosHeaders 인스턴스
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

/* ---------------- 401 리프레시 가능 여부 판정 ---------------- */

function isRefreshable401(error: AxiosError) {
    if (error.response?.status !== 401) return false;

    const url = String(error.config?.url || "");
    // 인증/리프레시 자체는 제외
    if (/\/auth\/(login|signin|register|refresh)/.test(url)) return false;

    const headers = (error.response?.headers || {}) as Record<string, string>;
    const www = headers["www-authenticate"] || headers["WWW-Authenticate"];
    if (typeof www === "string" && /invalid_token|expired/i.test(www)) return true;

    const data: any = error.response?.data;
    const code = (data?.code || data?.error || data?.errorCode || "").toString();
    const msg = (data?.message || "").toString().toLowerCase();

    // 서버 힌트
    if (/token.*expired|expired.*token|jwt.*expired/.test(msg)) return true;
    if (/TOKEN_?EXPIRED|INVALID_?TOKEN/.test(code)) return true;

    return false;
}

/* ---------------- 401 처리: refresh 단일 진행 + 대기열 ---------------- */

let isRefreshing = false;
let pendingQueue: Array<(token: string | null) => void> = [];

const ENABLE_REFRESH = true;
const REFRESH_ENDPOINT = "/api/auth/refresh";

function resolveQueue(token: string | null) {
    pendingQueue.forEach((cb) => cb(token));
    pendingQueue = [];
}

api.interceptors.response.use(
    (res) => res,
    async (error: AxiosError) => {
        const original: any = error.config;

        // 401 아니면 패스
        if (error.response?.status !== 401) return Promise.reject(error);

        // 이미 재시도한 요청은 중단
        if (original?._retry) return Promise.reject(error);

        // 리프레시 대상이 아니면 중단
        if (!ENABLE_REFRESH || !isRefreshable401(error)) {
            return Promise.reject(error);
        }

        original._retry = true;

        // 이미 리프레시 중이면 대기열에 등록
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

        // 리프레시 시작
        isRefreshing = true;
        try {
            const storedRefresh =
                localStorage.getItem("refreshToken") || sessionStorage.getItem("refreshToken");

            if (!storedRefresh) {
                resolveQueue(null);
                isRefreshing = false;
                return Promise.reject(error);
            }

            // 주의: refresh 는 전역 axios 사용 → api 인터셉터(Authorization 등) 회피
            const r = await axios.post(
                REFRESH_ENDPOINT,
                { refreshToken: storedRefresh }, // 쿠키 기반이면 {} 로 변경
                { withCredentials: true }
            );

            const { accessToken, refreshToken: newRefreshToken } = (r as any).data || {};
            if (!accessToken) throw new Error("No accessToken from refresh");

            const keep = !!localStorage.getItem("refreshToken");
            if (keep) {
                localStorage.setItem("accessToken", accessToken);
                if (newRefreshToken) localStorage.setItem("refreshToken", newRefreshToken);
            } else {
                sessionStorage.setItem("accessToken", accessToken);
                if (newRefreshToken) sessionStorage.setItem("refreshToken", newRefreshToken);
            }

            resolveQueue(accessToken);

            // 원 요청 재시도
            original.headers = setAuthHeader(original.headers, accessToken);
            return api(original);
        } catch (e) {
            // 리프레시 실패 → 대기열에 실패 알림, 토큰 제거는 여기서 하지 않음(루프 방지)
            resolveQueue(null);
            return Promise.reject(e);
        } finally {
            isRefreshing = false;
        }
    }
);

export default api;
