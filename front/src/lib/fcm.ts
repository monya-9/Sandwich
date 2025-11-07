// src/lib/fcm.ts
import { initializeApp } from "firebase/app";
import { getMessaging, getToken, isSupported, onMessage } from "firebase/messaging";
import { onAccessTokenChange } from "../utils/tokenStorage";
import api from "../api/axiosInstance";
import { isOnlineAndSubscribed } from "./ws/wsStateManager";

/** 서버와 동일한 웹앱 설정 */
const firebaseConfig = {
    apiKey: "AIzaSyDEu2qTgKqvnPm0c9LU8u69xi-lELSWpp8",
    authDomain: "sandwich-b3e09.firebaseapp.com",
    projectId: "sandwich-b3e09",
    storageBucket: "sandwich-b3e09.firebasestorage.app",
    messagingSenderId: "1097062424285",
    appId: "1:1097062424285:web:67ea70c23d90de8ba0c534",
};

const VAPID_KEY =
    "BPfv2mducX32XZ2U3xb_DSkGCY_TRU-SwHpmRjTn43NjA1CRmhU6lKNpPWG5XbMdX5XeaxjgKEQUjTllnNake4E";

let cachedFcmToken: string | null = null;

/**
 * 푸시 알림을 표시해야 하는지 확인
 * @param data FCM payload data
 * @returns true면 알림 표시 생략 (온라인 + 구독 중이거나 관련 페이지 보고 있음)
 */
async function checkShouldSkipNotification(data: any): Promise<boolean> {
    if (typeof window === "undefined") return false;
    
    try {
        const userId = Number(
            localStorage.getItem("userId") || sessionStorage.getItem("userId") || "0"
        );
        if (!userId || userId === 0) return false; // 로그인 안 했으면 알림 표시
        
        const currentPath = window.location.pathname;
        
        // 메시지 푸시인 경우
        if (data.roomId) {
            const roomId = Number(data.roomId);
            if (roomId) {
                const topic = `/topic/rooms/${roomId}`;
                
                // 1) 온라인 + 해당 방 구독 중인지 확인
                if (isOnlineAndSubscribed(userId, topic)) {
                    return true; // 푸시 생략
                }
                
                // 2) 현재 해당 메시지 방 페이지를 보고 있는지 확인
                if (currentPath === `/messages/${roomId}` || currentPath.startsWith(`/messages/${roomId}/`)) {
                    return true; // 푸시 생략
                }
            }
        }
        
        // 알림 푸시인 경우
        if (data.event || !data.roomId) {
            const topic = `/topic/users/${userId}/notifications`;
            
            // 1) 온라인 + 알림 토픽 구독 중인지 확인
            if (isOnlineAndSubscribed(userId, topic)) {
                return true; // 푸시 생략
            }
            
            // 2) 현재 알림 페이지를 보고 있는지 확인
            if (currentPath === "/notifications" || currentPath.startsWith("/notifications/")) {
                return true; // 푸시 생략
            }
        }
        
        return false; // 알림 표시해야 함
    } catch (error) {
        console.warn("[FCM] Error checking skip condition:", error);
        return false; // 에러 발생 시 안전하게 알림 표시
    }
}

async function registerWebPush(token: string) {
    try {
        await api.post("/push/register", { platform: "WEB", token });
    } catch (error: any) {
        // 401 오류인 경우 임시로 성공 처리
        if (error.response?.status === 401) {
            console.warn("[FCM] ⚠️ 백엔드 등록 실패 (401) - 토큰은 생성됨");
            return;
        }
        
        console.warn("[FCM] ⚠️ 백엔드 등록 실패 - 토큰은 생성됨:", error.message);
    }
}

export async function initFCM() {
    try {
        if (typeof window === "undefined" || !("serviceWorker" in navigator)) return;
        const ok = await isSupported().catch(() => false);
        if (!ok) return;

        // HTTPS 필수(로컬 허용)
        const { protocol, hostname } = window.location;
        const isLocal = hostname === "localhost" || hostname === "127.0.0.1";
        if (protocol !== "https:" && !isLocal) return;

        // 권한
        if (Notification.permission !== "granted") {
            const p = await Notification.requestPermission();
            if (p !== "granted") return;
        }

        // SW 등록 (중복 등록 방지)
        let reg = await navigator.serviceWorker.getRegistration();
        if (!reg) {
            reg = await navigator.serviceWorker.register("/firebase-messaging-sw.js", { scope: "/" });
        }

        // Firebase/Messaging
        const app = initializeApp(firebaseConfig);
        const messaging = getMessaging(app);

        // FCM 토큰
        cachedFcmToken = await getToken(messaging, {
            vapidKey: VAPID_KEY,
            serviceWorkerRegistration: reg,
        });
        if (!cachedFcmToken) {
            console.error("[FCM] Failed to get FCM token");
            return;
        }
        (window as any).__FCM_TOKEN__ = cachedFcmToken;

        // ✅ httpOnly 쿠키 기반: 항상 등록 시도 (쿠키가 있으면 성공, 없으면 실패)
        // 로그인 후 자동으로 쿠키가 설정되므로, 이후 페이지 새로고침 시 자동 등록됨
        try {
            await registerWebPush(cachedFcmToken);
            console.log("[FCM] 푸시 알림 등록 성공");
        } catch (error: any) {
            console.log("[FCM] 푸시 등록 실패 (로그인 필요):", error?.message || error);
            
            // ✅ 로그인 후 다시 시도: AuthContext의 로그인 이벤트 감지
            const handleAuthChange = () => {
                if (!cachedFcmToken) return;
                console.log("[FCM] 로그인 감지, 푸시 등록 재시도");
                registerWebPush(cachedFcmToken).then(() => {
                    console.log("[FCM] 푸시 알림 등록 성공 (재시도)");
                }).catch((err) => {
                    console.error("[FCM] 푸시 등록 재시도 실패:", err);
                });
            };
            
            // 페이지 새로고침 없이 로그인 시 자동 등록
            window.addEventListener("auth:login:success", handleAuthChange, { once: true });
        }

        // 포그라운드 => OS 토스트 (중복 방지)
        onMessage(messaging, async (payload) => {
            const d: any = payload.data || {};
            
            // ✅ 방어 로직: WebSocket 연결/구독 상태 및 현재 경로 확인
            const shouldSkipNotification = await checkShouldSkipNotification(d);
            if (shouldSkipNotification) {
                console.log('[FCM] Push notification skipped: user is online and subscribed or viewing relevant page', d);
                return; // 알림 표시하지 않음
            }
            
            const reg2 = await navigator.serviceWorker.getRegistration();
            
            // 중복 알림 방지를 위한 고유 태그 생성
            const notificationTag = d.messageId ? `msg-${d.messageId}` : 
                                  d.event ? `${d.event}-${d.resource?.id || 'unknown'}` : 
                                  `notify-${Date.now()}`;
            
            const url = (() => {
                const raw = d.deepLink || (d.roomId ? `/messages/${d.roomId}` : "/");
                console.log('[FCM][DEBUG] raw deepLink:', raw);
                try {
                    // 절대 URL인 경우 그대로 사용, 상대 URL인 경우만 현재 origin과 조합
                    if (raw.startsWith('http://') || raw.startsWith('https://')) {
                        console.log('[FCM][DEBUG] absolute URL, using as-is:', raw);
                        return raw; // 절대 URL은 그대로 사용
                    } else {
                        // 상대 URL인 경우에만 현재 origin과 조합
                        const currentOrigin = window.location.protocol + '//' + window.location.host;
                        const result = new URL(raw, currentOrigin).toString();
                        console.log('[FCM][DEBUG] relative URL, combining with origin:', currentOrigin, '->', result);
                        return result;
                    }
                } catch (error) {
                    console.warn('[FCM] URL generation failed:', error);
                    return raw;
                }
            })();

            await reg2?.showNotification(d.title || d.senderName || "Sandwich", {
                body: d.body || d.preview || "메시지가 도착했어요",
                data: { url, raw: d },
                icon: d.icon || "/logo192.png",
                tag: notificationTag, // 고유 태그로 중복 방지
                silent: false,
            });
        });
    } catch (e) {
        console.warn("[FCM] init failed:", e);
    }
}
