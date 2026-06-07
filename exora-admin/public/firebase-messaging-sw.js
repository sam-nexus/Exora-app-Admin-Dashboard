// Bypass ESLint environment overrides by explicitly pulling from the global 'self' scope
const { importScripts, clients } = self;

importScripts(
  "https://www.gstatic.com/firebasejs/9.0.0/firebase-app-compat.js",
);
importScripts(
  "https://www.gstatic.com/firebasejs/9.0.0/firebase-messaging-compat.js",
);

self.firebase.initializeApp({
  apiKey: "AIzaSyCgublnE7Lw55C9odsKXH2YITud__FUbwg",
  authDomain: "avian-brand-474607-g8.firebaseapp.com",
  projectId: "avian-brand-474607-g8",
  storageBucket: "avian-brand-474607-g8.firebasestorage.app",
  messagingSenderId: "455487033561",
  appId: "1:455487033561:web:84f7b81f25c6f6f5f82ec8",
  databaseURL: "https://avian-brand-474607-g8-default-rtdb.firebaseio.com",
});

const messaging = self.firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  const title = payload.notification?.title || "New notification";
  const options = {
    body: payload.notification?.body || "",
    icon: "/logoIcon.png",
    data: payload.data || {},
  };
  self.registration.showNotification(title, options);
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  if (event.notification.data?.link) {
    event.waitUntil(clients.openWindow(event.notification.data.link));
  }
});
