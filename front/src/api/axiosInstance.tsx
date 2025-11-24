// src/api/axiosInstance.ts
import axios, { AxiosError, AxiosHeaders, AxiosRequestConfig } from "axios";
import { getV3Token } from "../lib/recaptchaV3";

const api = axios.create({
    baseURL: "/api",
    withCredentials: true,
    timeout: 15000, // 15초 타임아웃 (서버 응답이 너무 느릴 때 빠르게 실패 처리)
    // ⚠️ 주의: 개별 API 호출에서 timeout을 명시하면 그 값이 우선됨
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

/* -------- Public API 판단 (헤더 우선 + URL 패턴 폴백) -------- */
/**
 * Public API 판단 로직
 * 
 * 우선순위:
 * 1. 헤더 기반 체크 (X-Skip-Auth-Refresh) - 명시적이고 신뢰성 높음
 * 2. URL 패턴 기반 체크 - 헤더 누락 시 안전망 역할
 * 
 * 참고: SecurityConfig.java의 permitAll 경로와 일치해야 함
 * 위치: Sandwich/Sandwich/src/main/java/.../SecurityConfig.java
 */
function isPublicApiRequest(config: any): boolean {
    const url = String(config.url || '').toLowerCase();
    const method = String(config.method || 'get').toUpperCase();
    
    // ✅ 1순위: URL 패턴 기반 체크 (가장 빠르고 확실 - 핫 개발자처럼!)
    // GET 메서드이고 Public API 패턴이면 즉시 반환
    if (method === 'GET') {
        const publicApiPatterns = [
            // 프로젝트 (가장 자주 사용)
            /^\/projects(\?|$)/,                          // GET /api/projects
            /^\/projects\/\d+(\?|$)/,                    // GET /api/projects/{id} (단일 ID)
            /^\/projects\/\d+\/\d+(\?|$)/,               // GET /api/projects/{userId}/{projectId}
            /^\/projects\/\d+\/\d+\/contents(\?|$)/,     // GET /api/projects/{userId}/{projectId}/contents
            /^\/projects\/user\/\d+(\?|$)/,              // GET /api/projects/user/{userId}
            /^\/projects\/meta\/summary(\?|$)/,          // GET /api/projects/meta/summary
            
            // 댓글
            /^\/comments\//,
            
            // 챌린지
            /^\/challenges(\?|$)/,
            /^\/challenges\/\d+(\?|$)/,
            /^\/challenges\/\d+\/leaderboard(\?|$)/,
            /^\/challenges\/\d+\/submissions(\?|$)/,          // GET /api/challenges/{id}/submissions
            /^\/challenges\/\d+\/submissions\/\d+(\?|$)/,    // GET /api/challenges/{id}/submissions/{submissionId}
            
            // 사용자 프로필
            /^\/users\/\d+(\?|$)/,
            /^\/users\/\d+\/representative-careers(\?|$)/,
            /^\/users\/\d+\/follow-counts(\?|$)/,
            /^\/users\/check-nickname(\?|$)/,  // 닉네임 중복 체크 (회원가입 단계)
            
            // 프로필
            /^\/profiles\/\d+\/collection-count(\?|$)/,
            
            // 검색
            /^\/search\/accounts(\?|$)/,
            
            // Discovery
            /^\/discovery\/hot-developers(\?|$)/,
            
            // 추천 (Reco)
            /^\/reco\/top\/week(\?|$)/,
            
            // 메타 정보
            /^\/meta\//,
        ];
        
        if (publicApiPatterns.some(pattern => pattern.test(url))) {
            return true; // URL 패턴으로 즉시 인식 (헤더 체크 없음!)
        }
    }
    
    // ✅ 2순위: 인증/로그인 관련 API (모든 메서드 허용)
    const authApiPatterns = [
        /^\/auth\/(login|signup|refresh)$/,
        /^\/auth\/otp\//,
        /^\/email\//,
        /^\/auth\/check-email(\?|$)/,
    ];
    
    if (authApiPatterns.some(pattern => pattern.test(url))) {
        return true;
    }
    
    // ✅ 3순위: 헤더 기반 체크 (명시적 신호가 있을 때만 - 빠른 URL 패턴 체크 후)
    try {
        const headers: any = config.headers || {};
        let headerValue = null;
        
        // 가장 빠른 방식: 직접 접근 먼저 시도
        if (headers && typeof headers === 'object') {
            headerValue = headers['X-Skip-Auth-Refresh'] || 
                         headers['x-skip-auth-refresh'] ||
                         headers['X-SKIP-AUTH-REFRESH'];
        }
        
        // AxiosHeaders나 get 메서드가 있는 경우만 추가 체크 (느림)
        if (!headerValue) {
            if (headers instanceof AxiosHeaders) {
                headerValue = headers.get('X-Skip-Auth-Refresh') || headers.get('x-skip-auth-refresh');
            } else if (typeof headers.get === 'function') {
                headerValue = headers.get('X-Skip-Auth-Refresh') || headers.get('x-skip-auth-refresh');
            }
        }
        
        if (headerValue === '1' || headerValue === 1 || String(headerValue) === '1') {
            return true;
        }
    } catch (e) {
        // 헤더 체크 실패는 무시 (URL 패턴으로 이미 대부분 처리됨)
    }
    
    return false;
}

/* -------- reCAPTCHA v3 자동 부착 활성화 -------- */
let recaptchaInstalled = false;
/** 특정 경로에 요청 보낼 때 v3 토큰을 X-Recaptcha-Token 으로 자동 부착 */
export function enableRecaptchaV3OnPaths(actionMap: Record<string, string>) {
    if (recaptchaInstalled) return;
    recaptchaInstalled = true;

    api.interceptors.request.use(async (config) => {
        // ✅ Public API 체크: URL 패턴 + 헤더 기반 (이중 체크) - 먼저 체크해서 불필요한 처리 건너뛰기
        const isPublicApi = isPublicApiRequest(config);
        
        if (isPublicApi) {
            // Public API는 인증/reCAPTCHA 처리 없이 즉시 반환 (성능 최적화)
            return config;

        }

        // 1) ✅ 쿠키 전용: Authorization 헤더 세팅 제거
        // 쿠키가 자동 전송되므로 별도 헤더 불필요
        // const token = localStorage.getItem("accessToken") || sessionStorage.getItem("accessToken");
        // if (token) config.headers = setAuthHeader(config.headers, token);

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

        // 3) 일부 GET 요청에 자동으로 X-Skip-Auth-Refresh 헤더 추가
        // ⚠️ 주의: /users/me는 인증 필요한 API이므로 제외
        const url = String(config.url || "");
        const method = (config.method || 'get').toLowerCase();
        const isSkipAuthRefresh = method === 'get' && (
            url.includes('/challenges') ||
            url.includes('/ext/reco') ||
            url.includes('/me/credits') ||
            url.includes('/me/rewards') ||
            url.includes('/likes') ||
            url.includes('/comments')
        );
        
        if (isSkipAuthRefresh) {
            const headers: any = config.headers || {};
            if (headers instanceof AxiosHeaders || typeof headers.set === "function") {
                headers.set("X-Skip-Auth-Refresh", "1");
            } else {
                headers["X-Skip-Auth-Refresh"] = "1";
            }
            config.headers = headers;
        }

        // 4) reCAPTCHA v3: 지정 경로에만 헤더 자동 부착
        try {
            if (typeof window !== "undefined") {
                const match = Object.entries(actionMap).find(([path]) => url.startsWith(path));
                if (match) {
                    const [, action] = match;
                    try {
                        // reCAPTCHA 타임아웃 추가 (3초) - 블로킹 방지
                        const v3tokenPromise = getV3Token(action);
                        const timeoutPromise = new Promise<string>((_, reject) => 
                            setTimeout(() => reject(new Error("reCAPTCHA timeout")), 3000)
                        );
                        const v3token = await Promise.race([v3tokenPromise, timeoutPromise]);
                        
                        if (v3token) {
                            const h: any = config.headers || {};
                            if (h instanceof AxiosHeaders || typeof h.set === "function") {
                                h.set("X-Recaptcha-Token", v3token);
                            } else {
                                h["X-Recaptcha-Token"] = v3token;
                            }
                            config.headers = h;
                        }
                    } catch (v3Error) {
                        // v3 토큰 발급 실패/타임아웃해도 서버에서 RECAPTCHA_FAIL 로 처리되므로 요청은 그대로 진행
                        console.warn('[Recaptcha] v3 token 발급 실패/타임아웃:', v3Error);
                    }
                }
            }
        } catch (error) {
            // 전체 interceptor 처리 실패해도 요청은 진행
            console.warn('[Request Interceptor] 처리 중 오류 발생:', error);
        }

        return config;
    });
}

/* -------- 401 리프레시 가능 여부 -------- */
function isRefreshable401(error: AxiosError) {
    if (error.response?.status !== 401) return false;

    const url = String(error.config?.url || "");
    // 인증/리프레시 자체는 제외
    if (/\/auth\/(login|signin|register|refresh)/.test(url)) return false;

    // ✅ 쿠키 기반이므로 항상 리프레시 시도 (백엔드가 쿠키 확인)
    return true;
}

/* -------- 401 처리: refresh 단일 진행 + 대기열 -------- */
let isRefreshing = false;
let pendingQueue: Array<(success: string | null) => void> = [];

const REFRESH_ENDPOINT = "/api/auth/refresh";

function resolveQueue(success: string | null) {
    pendingQueue.forEach((cb) => cb(success));
    pendingQueue = [];
}

api.interceptors.response.use(
    (res) => res,
    async (error: AxiosError) => {
        const original: any = error.config;

        // 특정 요청은 401이라도 리프레시를 시도하지 않고 즉시 실패시킨다
        try {
            const h: any = original?.headers;
            const skip = h?.get ? (h.get('X-Skip-Auth-Refresh') === '1') : (h?.['X-Skip-Auth-Refresh'] === '1' || h?.['x-skip-auth-refresh'] === '1');
            if (skip) return Promise.reject(error);
        } catch {}

        if (error.response?.status !== 401) return Promise.reject(error);
        if (original?._retry) return Promise.reject(error);

        if (!isRefreshable401(error)) {
            // refresh token이 없으면 그냥 에러 반환 (로그인하지 않은 상태)
            // 페이지 새로고침하지 않음
            return Promise.reject(error);
        }

        original._retry = true;

        if (isRefreshing) {
            return new Promise((resolve, reject) => {
                pendingQueue.push((success) => {
                    if (!success) return reject(error);
                    try {
                        // ✅ 쿠키로 자동 전송되므로 헤더 세팅 불필요
                        resolve(api(original));
                    } catch (e) {
                        reject(e);
                    }
                });
            });
        }

        isRefreshing = true;
        try {
            // ✅ 쿠키 기반이므로 빈 바디로 호출 (백엔드가 쿠키에서 REFRESH_TOKEN 읽음)
            const r = await axios.post(
                REFRESH_ENDPOINT,
                {},
                { withCredentials: true }
            );

            // 새 ACCESS_TOKEN/REFRESH_TOKEN은 쿠키로 다시 설정됨
            // localStorage 갱신 불필요, Authorization 헤더 불필요
            resolveQueue("");  // 빈 문자열로 큐 해결

            return api(original);
        } catch (e) {
            resolveQueue(null);
            
            // ✅ 리프레시 실패 시 자동 로그아웃 (새로고침 제거)
            console.warn('[AUTH] 리프레시 토큰 실패, 자동 로그아웃 처리');
            try {
                const { clearAllUserData } = await import('../utils/tokenStorage');
                clearAllUserData();
                
                // ✅ httpOnly 쿠키 방식: 새로고침 대신 로그인 페이지로 리다이렉트
                // 현재 페이지가 로그인 필수 페이지가 아니면 그냥 두기
                const publicPaths = ['/login', '/join', '/'];
                if (!publicPaths.some(p => window.location.pathname.startsWith(p))) {
                    window.location.href = '/login';
                }
            } catch (logoutError) {
                console.error('[AUTH] 자동 로그아웃 실패:', logoutError);
            }
            
            return Promise.reject(e);
        } finally {
            isRefreshing = false;
        }
    }
);

export default api;
