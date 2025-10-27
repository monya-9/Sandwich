// front/src/api/security.ts
import api from "./axiosInstance";

export type SecurityEventType =
    | "OTP_ISSUE"
    | "OTP_VERIFY_OK"
    | "OTP_VERIFY_INVALID"
    | "OTP_VERIFY_EXPIRED"
    | "OTP_VERIFY_LOCKED";

export interface SecurityEventDTO {
    id: number;
    type: SecurityEventType;
    userId?: number | null;
    email?: string | null;
    pendingId?: string | null;
    ip?: string | null;
    ua?: string | null;
    details?: string | null;
    createdAt?: string | null;
}

export interface Page<T> {
    content: T[];
    totalElements: number;
    totalPages: number;
    number: number; // current page
    size: number;
}

export interface SecurityEventQuery {
    type?: SecurityEventType;
    email?: string;
    pendingId?: string;
    page?: number;
    size?: number;
    since?: string; // ISO8601
    until?: string; // ISO8601
}

/**
 * 관리용 감사 로그 조회 API (백엔드에 라우트 존재하지 않으면 404 처리)
 */
export async function fetchSecurityEvents(params: SecurityEventQuery): Promise<Page<SecurityEventDTO> | null> {
    try {
        const res = await api.get<Page<SecurityEventDTO>>("/admin/security/events", { params });
        return res.data;
    } catch (e: any) {
        if (e?.response?.status === 404) {
            // 백엔드 미구현인 경우에도 프론트는 정상 동작
            return null;
        }
        throw e;
    }
}


// ---------------- 디바이스 신뢰/무효화 ----------------
export interface UserDeviceDTO {
    id: number;
    deviceId: string;
    deviceName: string;
    lastIp: string;
    uaHash?: string;
    trustUntil: string; // ISO8601
    revokedAt?: string | null;
}

/** 내 계정의 신뢰된(미해지) 디바이스 목록 */
export async function listTrustedDevices(): Promise<UserDeviceDTO[]> {
    const res = await api.get<UserDeviceDTO[]>("/auth/devices");
    return res.data;
}

/** 현재 브라우저/디바이스만 무효화 (쿠키 제거 기대) */
export async function revokeCurrentDevice(): Promise<void> {
    await api.post("/auth/devices/revoke-current");
}

/** 특정 행(id) 단일 무효화 */
export async function revokeDeviceById(id: number): Promise<void> {
    await api.delete(`/auth/devices/${id}`);
}

/** 내 모든 신뢰 디바이스 무효화 */
export async function revokeAllMyDevices(): Promise<{ revoked: number } | void> {
    const res = await api.post<{ revoked: number }>("/auth/devices/revoke-all");
    return res.data;
}

/** (관리자) 특정 사용자 모든 디바이스 무효화 */
export async function adminRevokeAllDevicesByUser(userId: number): Promise<{ revoked: number }> {
    // baseURL("/api")를 우회해 /admin 경로로 직접 호출 (토큰 인터셉터는 그대로 사용)
    const res = await api.post<{ revoked: number }>(
        `/admin/devices/revoke-all/${userId}`,
        undefined,
        { baseURL: process.env.REACT_APP_API_BASE || "" }
        );
    return res.data;
}


