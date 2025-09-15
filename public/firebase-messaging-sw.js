/* public/firebase-messaging-sw.js */
importScripts('https://www.gstatic.com/firebasejs/9.6.11/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.6.11/firebase-messaging-compat.js');

firebase.initializeApp({
    apiKey: "YOUR_KEY",
    authDomain: "YOUR_AUTH_DOMAIN",
    projectId: "YOUR_PROJECT_ID",
    messagingSenderId: "YOUR_SENDER_ID",
    appId: "YOUR_APP_ID",
});

const messaging = firebase.messaging();

self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (e) => e.waitUntil(self.clients.claim()));

// 백그라운드 수신 알림 (옵션)
messaging.onBackgroundMessage((payload) => {
    const title = payload?.notification?.title || '새 메시지';
    const body = payload?.notification?.body || '';
    self.registration.showNotification(title, { body, icon: '/favicon.ico' });
});
