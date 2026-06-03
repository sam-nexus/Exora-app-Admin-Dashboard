import { initializeApp, getApps } from 'firebase/app';
import { getDatabase, ref, onValue, off } from 'firebase/database';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  databaseURL: import.meta.env.VITE_FIREBASE_DATABASE_URL,
};

const isFirebaseConfigured = Boolean(
  firebaseConfig.apiKey &&
    firebaseConfig.projectId &&
    firebaseConfig.databaseURL
);

let db = null;

const initDatabase = () => {
  if (!isFirebaseConfigured) {
    console.warn('Firebase database is not configured. Set VITE_FIREBASE_* env vars.');
    return null;
  }

  if (!getApps().length) {
    initializeApp(firebaseConfig);
  }

  if (!db) {
    db = getDatabase();
  }

  return db;
};

export const listenToUnreadNotifications = (userId, callback) => {
  if (!userId) return () => {};

  const database = initDatabase();
  if (!database) return () => {};

  const notificationsRef = ref(database, `notifications/${userId}/unread_count`);

  const unsubscribe = onValue(notificationsRef, (snapshot) => {
    const count = snapshot.val() || 0;
    callback(count);
  });

  return () => off(notificationsRef);
};

export const listenToNotificationUpdates = (userId, callback) => {
  if (!userId) return () => {};

  const database = initDatabase();
  if (!database) return () => {};

  const notificationsRef = ref(database, `notifications/${userId}`);

  const unsubscribe = onValue(notificationsRef, (snapshot) => {
    const data = snapshot.val();
    callback(data);
  });

  return () => off(notificationsRef);
};

export default initDatabase;
