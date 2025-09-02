// src/api/axiosInstance.ts
import axios, { AxiosError, AxiosHeaders, AxiosRequestConfig } from "axios";

const api = axios.create({
    baseURL: "/api",
    withCredentials: true, // 쿠키 리프레시거나 same-site면 OK. 쿠키 안 쓰면 false여도 무해
});

// ---- 공용: Authorization 세팅 ----
function setAuthHeader(headers: AxiosRequestConfig["headers"], token: string) {
    if (!headers) return { Authorization: `Bearer ${token}` } as any;
    if (headers instanceof AxiosHeaders || typeof (headers as any).set === "function") {
        (headers as AxiosHeaders).set("Authorization", `Bearer ${token}`);
        return headers;
    }
    (headers as any).Authorization = `Bearer ${token}`;
    return headers;
}

// 항상 토큰 부착
api.interceptors.request.use((config) => {
    const token =
        localStorage.getItem("accessToken") || sessionStorage.getItem("accessToken");
    if (token) config.headers = setAuthHeader(config.headers, token);
    return config;
});

// ---- 리프레시 조건 가드 ----
function isRefreshable401(error: AxiosError) {
    if (error.response?.status !== 401) return false;

    const url = String(error.config?.url || "");
    // 인증 API 자체는 스킵
    if (/\/auth\/(login|signin|register|refresh)/.test(url)) return false;

    const headers = (error.response?.headers || {}) as Record<string, string>;
    const www = headers["www-authenticate"] || headers["WWW-Authenticate"];
    if (typeof www === "string" && /invalid_token|expired/i.test(www)) return true;

    const data: any = error.response?.data;
    const code = (data?.code || data?.error || data?.errorCode || "").toString();
    const msg = (data?.message || "").toString().toLowerCase();

    // 서버가 아래 값 중 하나라도 내려주면 리프레시
    if (/token.*expired|expired.*token|jwt.*expired/.test(msg)) return true;
    if (/TOKEN_?EXPIRED|INVALID_?TOKEN/.test(code)) return true;

    // 그 외(자격없음, 사용자없음 등)는 리프레시 대상 아님
    return false;
}

// ===== 401 처리: refresh 단일 진행 + 대기열 =====
let isRefreshing = false;
let pendingQueue: Array<(token: string | null) => void> = [];
const ENABLE_REFRESH = true; // 필요시 false로 끄기
const REFRESH_ENDPOINT = "/api/auth/refresh"; // 서버와 반드시 일치

function resolveQueue(token: string | null) {
    pendingQueue.forEach((cb) => cb(token));
    pendingQueue = [];
}

api.interceptors.response.use(
    (res) => res,
    async (error: AxiosError) => {
        const original: any = error.config;

        // 401 아니면 통과
        if (error.response?.status !== 401) return Promise.reject(error);

        // 이미 재시도했다면 종료
        if (original?._retry) return Promise.reject(error);

        // 리프레시 비활성화거나, 리프레시할 만한 401이 아니면 종료
        if (!ENABLE_REFRESH || !isRefreshable401(error)) {
            return Promise.reject(error);
        }

        original._retry = true;

        // 이미 누가 리프레시 중이면 대기열에 걸기
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

            // 주의: refresh는 글로벌 axios로 호출해야 api 인터셉터의 Authorization이 안 붙음
            const r = await axios.post(
                REFRESH_ENDPOINT,
                { refreshToken: storedRefresh }, // 서버가 쿠키 기반이면 {}로 바꾸세요
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
            // 리프레시 실패 → 대기열 실패 알림만 하고, 토큰은 여기서 지우지 않음(루프 방지)
            resolveQueue(null);
            return Promise.reject(e);
        } finally {
            isRefreshing = false;
        }
    }
);

export default api;
