/* /firebase-messaging-sw.js */
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

self.addEventListener('install', () => {
  console.log('[SW] install');
  self.skipWaiting?.();
});
self.addEventListener('activate', () => {
  console.log('[SW] activate');
  clients.claim?.();
});


messaging.onBackgroundMessage((payload) => {
  console.log('[SW] onBackgroundMessage payload=', payload);

  const d = payload.data || {};
  console.log('[SW] parsed data=', d);

  const title = d.title || 'Sandwich';
  const body  = d.body  || d.preview || '메시지가 도착했어요';
  const url   = d.deepLink || '/';
  const silent = d.silent === '1';

  const options = {
    body,
    data: { url, raw: d },
    silent,
    tag: `room-${d.roomId || 'unknown'}`, // 같은 방 중복 방지용
    renotify: false
    // icon: '/icon-192.png',  // 원하면 추가
    // badge: '/badge.png'
  };

  console.log('[SW] showNotification', title, options);
  self.registration.showNotification(title, options);
});

self.addEventListener('notificationclick', (event) => {
  console.log('[SW] notificationclick data=', event.notification?.data);
  event.notification.close();
  const url = (event.notification.data && event.notification.data.url) || '/';
  event.waitUntil((async () => {
    const list = await clients.matchAll({ type: 'window', includeUncontrolled: true });
    for (const c of list) {
      try { await c.focus(); await c.navigate(url); return; } catch {}
    }
    await clients.openWindow(url);
  })());


});
self.addEventListener('push', (event) => {
  try {
    const payload = event.data?.json?.() ?? {};
    const d = payload.data || payload || {};
    const title = d.title || 'Sandwich';
    const body  = d.body  || '메시지가 도착했어요';
    const url   = d.deepLink || '/';
    console.log('[SW] push event fallback', d);
    event.waitUntil(
      self.registration.showNotification(title, { body, data: { url, raw: d } })
    );
  } catch (e) {
    console.log('[SW] push event parse error', e);
  }
});