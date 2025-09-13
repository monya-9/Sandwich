// src/lib/fcm.ts
import { initializeApp } from "firebase/app";
import { getMessaging, getToken, isSupported, onMessage } from "firebase/messaging";
import { onAccessTokenChange } from "../utils/tokenStorage";

/** 서버에서 쓰는 동일한 웹앱 설정 */
const firebaseConfig = {
    apiKey: "AIzaSyDEu2qTgKqvnPm0c9LU8u69xi-lELSWpp8",
    authDomain: "sandwich-b3e09.firebaseapp.com",
    projectId: "sandwich-b3e09",
    storageBucket: "sandwich-b3e09.firebasestorage.app",
    messagingSenderId: "1097062424285",
    appId: "1:1097062424285:web:67ea70c23d90de8ba0c534",
};

/** FCM VAPID 공개키 */
const VAPID_KEY =
    "BPfv2mducX32XZ2U3xb_DSkGCY_TRU-SwHpmRjTn43NjA1CRmhU6lKNpPWG5XbMdX5XeaxjgKEQUjTllnNake4E";

let cachedFcmToken: string | null = null;

async function registerWebPush(token: string, accessToken: string) {
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
    console.log("[FCM] registered");
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

        // SW 등록
        const reg = await navigator.serviceWorker.register("/firebase-messaging-sw.js", { scope: "/" });

        // Firebase init + Messaging
        const app = initializeApp(firebaseConfig);
        const messaging = getMessaging(app);

        // FCM 토큰
        cachedFcmToken = await getToken(messaging, {
            vapidKey: VAPID_KEY,
            serviceWorkerRegistration: reg,
        });
        if (!cachedFcmToken) return;
        console.log("[FCM] token:", cachedFcmToken);
        (window as any).__FCM_TOKEN__ = cachedFcmToken; // 디버그용

        // 현재 accessToken 있으면 즉시 등록, 없으면 로그인되면 등록
        const access =
            localStorage.getItem("accessToken") || sessionStorage.getItem("accessToken") || "";

        if (access) {
            try { await registerWebPush(cachedFcmToken, access); }
            catch (e) { console.warn("[FCM] initial register fail:", e); }
        } else {
            onAccessTokenChange(async (newAccess) => {
                if (newAccess && cachedFcmToken) {
                    try { await registerWebPush(cachedFcmToken, newAccess); }
                    catch (e) { console.warn("[FCM] deferred register fail:", e); }
                }
            });
        }

        // 포그라운드에서도 OS 토스트 띄우기(원치 않으면 이 블록 제거)
        onMessage(messaging, async (payload) => {
            const d: any = payload.data || {};
            const reg2 = await navigator.serviceWorker.getRegistration();
            // 상대경로 → 절대경로 보정
            const url = (() => {
                const raw = d.deepLink || (d.roomId ? `/messages/${d.roomId}` : "/");
                try { return new URL(raw, window.location.origin).toString(); }
                catch { return raw; }
            })();

            await reg2?.showNotification(d.title || d.senderName || "Sandwich", {
                body: d.body || d.preview || "메시지가 도착했어요",
                data: { url, raw: d },
                icon: d.icon || "/logo192.png",
                image: d.image,
                tag: d.messageId ? `msg-${d.messageId}` : `room-${d.roomId || "unknown"}`,
                renotify: true,
                timestamp: Date.now(),
                silent: false,
            });
        });
    } catch (e) {
        console.warn("[FCM] init failed:", e);
    }
}
