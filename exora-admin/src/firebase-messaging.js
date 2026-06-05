import { initializeApp, getApps } from "firebase/app";
import { getMessaging, getToken, onMessage } from "firebase/messaging";

const firebaseConfig = {
  apiKey:            import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain:        import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId:         import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket:     import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId:             import.meta.env.VITE_FIREBASE_APP_ID,
};

const vapidKey = import.meta.env.VITE_FIREBASE_VAPID_KEY;

const isFirebaseConfigured = Boolean(
  firebaseConfig.apiKey &&
  firebaseConfig.projectId &&
  firebaseConfig.messagingSenderId &&
  firebaseConfig.appId &&
  vapidKey,
);

let messagingInstance = null;

const initFirebaseApp = () => {
  if (!isFirebaseConfigured) return null;

  try {
    if (!getApps().length) {
      initializeApp(firebaseConfig);
    }
    if (!messagingInstance) {
      messagingInstance = getMessaging();
    }
    return messagingInstance;
  } catch (error) {
    return null;
  }
};

export const registerForPushNotifications = async () => {
  if (!isFirebaseConfigured) return null;

  if (!("Notification" in window) || !("serviceWorker" in navigator)) return null;

  try {
    const registration = await navigator.serviceWorker.register("/firebase-messaging-sw.js", {
      scope: "/",
    });

    const messaging = initFirebaseApp();
    if (!messaging) return null;

    const permission = await Notification.requestPermission();
    if (permission !== "granted") return null;

    const token = await getToken(messaging, {
      vapidKey,
      serviceWorkerRegistration: registration,
    });

    return token;
  } catch {
    return null;
  }
};

export const listenForForegroundMessages = (callback) => {
  const messaging = initFirebaseApp();
  if (!messaging) return () => {};

  const unsubscribe = onMessage(messaging, (payload) => {
    if (typeof callback === "function") {
      callback(payload);
    }
  });

  return unsubscribe;
};
