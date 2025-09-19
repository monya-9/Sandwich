// src/lib/fcm.ts
import { initializeApp } from "firebase/app";
import { getMessaging, getToken, isSupported, onMessage } from "firebase/messaging";
import { onAccessTokenChange } from "../utils/tokenStorage";

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
let isTokenRegistered = false; // 중복 등록 방지

async function registerWebPush(token: string, accessToken: string) {
    // 중복 등록 방지
    if (isTokenRegistered) {
        console.log("[FCM] already registered, skipping");
        return;
    }

    const res = await fetch("/api/push/register", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${accessToken}`,
        },
        credentials: "include",
        body: JSON.stringify({ platform: "WEB", token }),
    });
    if (!res.ok) throw new Error(`register failed ${res.status}`);
    
    isTokenRegistered = true;
    console.log("[FCM] registered successfully");
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
        if (!cachedFcmToken) return;
        (window as any).__FCM_TOKEN__ = cachedFcmToken;

        // 현재 AccessToken 있으면 즉시 등록, 없으면 로그인되면 등록
        const access =
            localStorage.getItem("accessToken") || sessionStorage.getItem("accessToken") || "";

        if (access) {
            try {
                await registerWebPush(cachedFcmToken, access);
            } catch (e) {
                console.warn("[FCM] initial register fail:", e);
            }
        } else {
            onAccessTokenChange(async (newAccess) => {
                if (newAccess && cachedFcmToken) {
                    try {
                        await registerWebPush(cachedFcmToken, newAccess);
                    } catch (e) {
                        console.warn("[FCM] deferred register fail:", e);
                    }
                }
            });
        }

        // 포그라운드 => OS 토스트 (중복 방지)
        onMessage(messaging, async (payload) => {
            const d: any = payload.data || {};
            const reg2 = await navigator.serviceWorker.getRegistration();
            
            // 중복 알림 방지를 위한 고유 태그 생성
            const notificationTag = d.messageId ? `msg-${d.messageId}` : 
                                  d.event ? `${d.event}-${d.resource?.id || 'unknown'}` : 
                                  `notify-${Date.now()}`;
            
            const url = (() => {
                const raw = d.deepLink || (d.roomId ? `/messages/${d.roomId}` : "/");
                try {
                    return new URL(raw, window.location.origin).toString();
                } catch {
                    return raw;
                }
            })();

            await reg2?.showNotification(d.title || d.senderName || "Sandwich", {
                body: d.body || d.preview || "메시지가 도착했어요",
                data: { url, raw: d },
                icon: d.icon || "/logo192.png",
                image: d.image,
                tag: notificationTag, // 고유 태그로 중복 방지
                renotify: true,
                timestamp: Date.now(),
                silent: false,
            });
        });
    } catch (e) {
        console.warn("[FCM] init failed:", e);
    }
}
