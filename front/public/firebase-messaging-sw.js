/* /public/firebase-messaging-sw.js
 * Sandwich FCM Service Worker (v7)
 * - 알림 타입별(title/body/link) 렌더링
 * - /rooms/:id → /messages/:id 자동 보정
 * - 아이콘/배지/이미지 지원
 * - 포커스/네비게이션 처리
 */

importScripts('https://www.gstatic.com/firebasejs/12.1.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/12.1.0/firebase-messaging-compat.js');

firebase.initializeApp({
    apiKey: "AIzaSyDEu2qTgKqvnPm0c9LU8u69xi-lELSWpp8",
    authDomain: "sandwich-b3e09.firebaseapp.com",
    projectId: "sandwich-b3e09",
    storageBucket: "sandwich-b3e09.firebasestorage.app",
    messagingSenderId: "1097062424285",
    appId: "1:1097062424285:web:67ea70c23d90de8ba0c534"
});

const messaging = firebase.messaging();

/** ====== 환경/리소스 ====== */
const APP_ORIGIN = process.env.REACT_APP_API_BASE; // 배포 시 실제 도메인(https)로 교체
const DEFAULT_ICON_PATH  = '/icons/logo-192.png'; // 정사각 PNG 권장(192x192)
const DEFAULT_BADGE_PATH = '/icons/logo-192.png';

/** ====== 유틸 ====== */
const toAbsUrl = (raw) => {
    try { return new URL(raw, APP_ORIGIN).toString(); }
    catch { return APP_ORIGIN; }
};

// /rooms/:id → /messages/:id 보정 (+ 쿼리/해시는 유지)
function normalizePath(path) {
    try {
        const u = new URL(path, APP_ORIGIN);
        const m = u.pathname.match(/^\/rooms\/([^\/?#]+)/);
        if (m && m[1]) u.pathname = `/messages/${m[1]}`;
        return u.toString();
    } catch { return toAbsUrl(path); }
}

// 딥링크 결정: payload에 deepLink가 있으면 우선, 없으면 타입별 기본 경로
function decideDeepLink(d) {
    if (d.deepLink) return d.deepLink;

    const t = (d.nType || d.type || '').toUpperCase();
    switch (t) {
        case 'MESSAGE_NEW':
        case 'MESSAGE':
            if (d.roomId) return `/messages/${d.roomId}`;
            return '/messages';
        case 'LIKE':
            return d.targetUrl || '/notifications';
        case 'COMMENT':
            return d.targetUrl || '/notifications';
        case 'FOLLOW':
            return d.targetUrl || '/notifications';
        default:
            return d.targetUrl || '/';
    }
}

// 제목/본문 결정: 타입별로 보기 좋게
function decideTitleBody(d) {
    const t = (d.nType || d.type || '').toUpperCase();
    const sender = d.senderName || '';
    const preview = d.preview || d.commentPreview || d.body || '';

    // 제목
    let title;
    switch (t) {
        case 'MESSAGE_NEW':
        case 'MESSAGE':
            title = '새 메시지';
            break;
        case 'LIKE':
            title = '새 좋아요';
            break;
        case 'COMMENT':
            title = '새 댓글';
            break;
        case 'FOLLOW':
            title = '새 팔로우';
            break;
        default:
            title = d.title || '새 알림';
            break;
    }

    // 본문
    let body;
    if (sender && preview) body = `${sender}: ${preview}`;
    else if (preview)      body = preview;
    else                   body = d.body || '알림이 도착했어요';

    return { title, body };
}

/** ====== 알림 표출 공통 ====== */
async function show(payload) {
    const d = (payload && payload.data) ? payload.data : (payload || {});

    const { title, body } = decideTitleBody(d);

    // 링크 만들고 절대 URL + /rooms → /messages 교정
    const linkRaw = decideDeepLink(d);
    const url = normalizePath(linkRaw);

    // 아이콘/배지/이미지
    const icon  = d.icon  ? toAbsUrl(d.icon)  : toAbsUrl(DEFAULT_ICON_PATH);
    const badge = d.badge ? toAbsUrl(d.badge) : toAbsUrl(DEFAULT_BADGE_PATH);
    const image = d.image ? toAbsUrl(d.image) : undefined;

    // 중복 제어 태그(가능하면 고유 id 사용)
    const tag =
        (d.notifId && `n-${d.notifId}`) ||
        (d.messageId && `msg-${d.messageId}`) ||
        (d.roomId && `room-${d.roomId}`) ||
        'sandwich-noti';

    const options = {
        body,
        data: { url, raw: d },
        icon,
        badge,
        image,
        tag,
        renotify: true,
        timestamp: Date.now(),
        silent: false
    };

    return self.registration.showNotification(title, options);
}

/** ====== SW 라이프사이클 ====== */
self.addEventListener('install', () => { self.skipWaiting?.(); });
self.addEventListener('activate', () => { clients.claim?.(); });

/** ====== FCM/Push 핸들링 ====== */
messaging.onBackgroundMessage((payload) => {
    // console.log('[SW] onBackgroundMessage', payload);
    return show(payload);
});

self.addEventListener('push', (event) => {
    try {
        const payload = event.data?.json?.() ?? {};
        event.waitUntil(show(payload));
    } catch (e) {
        // console.log('[SW] push parse error', e);
    }
});

/** ====== 클릭 시 포커스/네비게이션 ====== */
self.addEventListener('notificationclick', (event) => {
    event.notification.close();
    const url = (event.notification?.data && event.notification.data.url) || APP_ORIGIN;

    event.waitUntil((async () => {
        const list = await clients.matchAll({ type: 'window', includeUncontrolled: true });
        for (const c of list) {
            try { await c.focus(); await c.navigate(url); return; } catch {}
        }
        await clients.openWindow(url);
    })());
});