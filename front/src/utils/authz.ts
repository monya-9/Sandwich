import api from "../api/axiosInstance";

// ✅ httpOnly 쿠키 기반: localStorage 토큰 체크 제거
// 대신 서버 API로 권한 확인 (캐시 사용)

let adminCheckCache: { isAdmin: boolean; timestamp: number } | null = null;
const CACHE_DURATION = 5 * 60 * 1000; // 5분

/**
 * ✅ httpOnly 쿠키 기반: 서버 API로 관리자 권한 확인
 * @returns Promise<boolean> - 관리자 권한 여부
 */
export async function isAdmin(): Promise<boolean> {
    // 캐시 확인
    if (adminCheckCache && Date.now() - adminCheckCache.timestamp < CACHE_DURATION) {
        return adminCheckCache.isAdmin;
    }

    try {
        const { data } = await api.get("/users/me");
        const roles = data.roles || [];
        const isAdminUser = roles.includes("ROLE_ADMIN") || roles.includes("ADMIN");
        
        // 캐시 저장
        adminCheckCache = { isAdmin: isAdminUser, timestamp: Date.now() };
        
        return isAdminUser;
    } catch {
        // API 실패 시 false 반환
        adminCheckCache = { isAdmin: false, timestamp: Date.now() };
        return false;
    }
}

/**
 * 관리자 권한 캐시 무효화 (로그아웃 시 호출)
 */
export function clearAdminCache(): void {
    adminCheckCache = null;
}



