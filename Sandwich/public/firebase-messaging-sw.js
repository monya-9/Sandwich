/* /firebase-messaging-sw.js */
importScripts('https://www.gstatic.com/firebasejs/12.1.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/12.1.0/firebase-messaging-compat.js');

// ws-test.html과 동일한 설정
firebase.initializeApp({
  apiKey: "AIzaSyDEu2qTgKqvnPm0c9LU8u69xi-lELSWpp8",
  authDomain: "sandwich-b3e09.firebaseapp.com",
  projectId: "sandwich-b3e09",
  storageBucket: "sandwich-b3e09.firebasestorage.app",
  messagingSenderId: "1097062424285",
  appId: "1:1097062424285:web:67ea70c23d90de8ba0c534"
});

const messaging = firebase.messaging();

// 백그라운드 수신 시 브라우저 알림 표시
messaging.onBackgroundMessage((payload) => {
  console.log('[SW] onBackgroundMessage', payload);

  const notif = payload.notification || {};
  const data  = payload.data || {};

  const sender = data.senderName || '';
  const preview = data.preview || '';

  const title = notif.title || 'Sandwich';
  const body  = notif.body  || (sender ? `${sender}: ${preview}` : (preview || '메시지가 도착했어요'));

  const url   = data.deepLink || '/';
  const silent = data.silent === '1';

  self.registration.showNotification(title, {
    body,
    data: { url },
    // silent 옵션은 브라우저에 따라 무시될 수 있음
    silent,
    icon: '/icon-192.png'
  });
});

// 클릭하면 탭 포커스/네비게이트
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const url = (event.notification.data && event.notification.data.url) || '/';
  event.waitUntil((async () => {
    const clientsList = await clients.matchAll({ type: 'window', includeUncontrolled: true });
    for (const client of clientsList) {
      try { await client.focus(); await client.navigate(url); return; } catch(e){}
    }
    clients.openWindow(url);
  })());
});
