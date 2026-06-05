/* eslint-disable no-unused-vars */

import { initializeApp, getApps } from "firebase/app";
import { getDatabase, ref, onValue, off } from "firebase/database";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  // fallback to known URL so SDK doesn't log "Can't determine Firebase Database URL"
  databaseURL: import.meta.env.VITE_FIREBASE_DATABASE_URL ||
    'https://avian-brand-474607-g8-default-rtdb.firebaseio.com',
};

const DB_APP_NAME = "exora-db";

const isFirebaseConfigured = Boolean(
  firebaseConfig.apiKey &&
  firebaseConfig.projectId &&
  firebaseConfig.databaseURL,
);

let db = null;

const initDatabase = () => {
  if (!isFirebaseConfigured) {
    console.warn(
      "Firebase database is not configured correctly. Check your .env file.",
    );
    return null;
  }

  try {
    // Use a named app to avoid conflicts with the messaging app instance
    const existingApps = getApps();
    const dbApp =
      existingApps.find((a) => a.name === DB_APP_NAME) ||
      initializeApp(firebaseConfig, DB_APP_NAME);

    if (!db) {
      db = getDatabase(dbApp);
    }

    return db;
  } catch (error) {
    console.error("Error initializing Firebase database:", error);
    return null;
  }
};

export const listenToUnreadNotifications = (userId, callback) => {
  if (!userId) {
    console.warn("No userId provided for unread notifications");
    return () => {};
  }

  const database = initDatabase();
  if (!database) return () => {};

  const notificationsRef = ref(
    database,
    `notifications/${userId}/unread_count`,
  );

  onValue(
    notificationsRef,
    (snapshot) => {
      const count = snapshot.val() || 0;
      callback(count);
    },
    (error) => {
      console.error("Error listening to unread notifications:", error);
    },
  );

  // Return cleanup function
  return () => {
    off(notificationsRef);
  };
};

export const listenToNotificationUpdates = (userId, callback) => {
  if (!userId) return () => {};

  const database = initDatabase();
  if (!database) return () => {};

  const notificationsRef = ref(database, `notifications/${userId}`);

  onValue(
    notificationsRef,
    (snapshot) => {
      const data = snapshot.val();
      callback(data);
    },
    (error) => {
      console.error("Error listening to notification updates:", error);
    },
  );

  return () => off(notificationsRef);
};

export default initDatabase;
