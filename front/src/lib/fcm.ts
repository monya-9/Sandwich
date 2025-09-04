// src/lib/fcm.ts
import { initializeApp } from "firebase/app";
import { getMessaging, getToken, isSupported, onMessage } from "firebase/messaging";
import { emitMessagesRefresh } from "../lib/messageEvents";

const firebaseConfig = {
    apiKey: "YOUR_KEY",
    authDomain: "YOUR_AUTH_DOMAIN",
    projectId: "YOUR_PROJECT_ID",
    messagingSenderId: "YOUR_SENDER_ID",
    appId: "YOUR_APP_ID",
};
const VAPID_KEY = "YOUR_VAPID_PUBLIC_KEY";

export async function initFCM() {
    try {
        if (typeof window === "undefined" || typeof navigator === "undefined") return;
        if (!("serviceWorker" in navigator)) return;

        const supported = await isSupported().catch(() => false);
        if (!supported) return;

        const { protocol, hostname } = window.location; // ← window.location만 사용
        const isLocal = hostname === "localhost" || hostname === "127.0.0.1";
        if (protocol !== "https:" && !isLocal) return;

        // 반드시 루트 경로
        const registration = await navigator.serviceWorker.register("/firebase-messaging-sw.js", { scope: "/" });

        const app = initializeApp(firebaseConfig);
        const messaging = getMessaging(app);

        await getToken(messaging, {
            vapidKey: VAPID_KEY,
            serviceWorkerRegistration: registration,
        }).catch(() => null);

        onMessage(messaging, () => {
            // 포그라운드에서 푸시 수신하면 목록 새로고침
            emitMessagesRefresh();
        });
    } catch {
        // 실패해도 앱 동작에는 영향 없음
    }
}
