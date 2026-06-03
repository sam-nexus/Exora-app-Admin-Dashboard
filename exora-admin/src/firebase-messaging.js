import { initializeApp, getApps } from 'firebase/app';
import { getMessaging, getToken, onMessage } from 'firebase/messaging';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

const vapidKey = import.meta.env.VITE_FIREBASE_VAPID_KEY;

const isFirebaseConfigured = Boolean(
  firebaseConfig.apiKey &&
    firebaseConfig.projectId &&
    firebaseConfig.messagingSenderId &&
    firebaseConfig.appId &&
    vapidKey
);

const initFirebaseApp = () => {
  if (!isFirebaseConfigured) return null;
  if (!getApps().length) {
    initializeApp(firebaseConfig);
  }
  return getMessaging();
};

export const registerForPushNotifications = async () => {
  if (!isFirebaseConfigured) {
    console.warn('Firebase messaging is not configured. Set VITE_FIREBASE_* env vars.');
    return null;
  }

  if (!('Notification' in window) || !('serviceWorker' in navigator)) {
    console.warn('Browser does not support notifications or service workers.');
    return null;
  }

  try {
    await navigator.serviceWorker.register(new URL('./firebase-messaging-sw.js', import.meta.url), { type: 'module' });
    const messaging = initFirebaseApp();
    if (!messaging) return null;

    const permission = await Notification.requestPermission();
    if (permission !== 'granted') {
      console.warn('Notification permission not granted.');
      return null;
    }

    const token = await getToken(messaging, { vapidKey });
    return token;
  } catch (error) {
    console.error('Failed to register for push notifications:', error);
    return null;
  }
};

export const listenForForegroundMessages = (callback) => {
  const messaging = initFirebaseApp();
  if (!messaging) return () => {};

  const unsubscribe = onMessage(messaging, (payload) => {
    if (typeof callback === 'function') {
      callback(payload);
    }
  });

  return unsubscribe;
};
