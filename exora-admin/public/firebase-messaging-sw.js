importScripts('https://www.gstatic.com/firebasejs/10.12.2/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.12.2/firebase-messaging-compat.js');

// Firebase config is hardcoded here because service workers
// cannot access Vite env vars (import.meta.env is not available in SW scope)
firebase.initializeApp({
  apiKey: 'AIzaSyBsGVkP4xOGVmQzX1Y2Z3A4B5C6D7E8F9G0',
  authDomain: 'avian-brand-47460-g8.firebaseapp.com',
  projectId: 'avian-brand-47460-g8',
  storageBucket: 'avian-brand-47460-g8.appspot.com',
  messagingSenderId: '523456789012',
  appId: '1:523456789012:web:a1b2c3d4e5f6g7h8i9j0',
});

// Use compat API — NOT firebase.getMessaging(), that's the modular API
const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  const title = payload.notification?.title || 'New notification';
  const options = {
    body: payload.notification?.body || '',
    icon: '/logoIcon.png',
    data: payload.data || {},
  };
  self.registration.showNotification(title, options);
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  if (event.notification.data?.link) {
    event.waitUntil(clients.openWindow(event.notification.data.link));
  }
});
