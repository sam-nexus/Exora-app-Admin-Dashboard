import * as admin from 'firebase-admin';
import * as dotenv from 'dotenv';

dotenv.config();

// Firebase Admin SDK initialization.
// Backend requires a service account JSON, not the Android API key payload.
// Use one of these env vars:
// - FIREBASE_SERVICE_ACCOUNT_JSON_BASE64
// - FIREBASE_SERVICE_ACCOUNT_JSON
// - FIREBASE_SERVICE_ACCOUNT_PATH
const serviceAccountJsonBase64 = process.env.FIREBASE_SERVICE_ACCOUNT_JSON_BASE64;
const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
const serviceAccountPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH;

if (serviceAccountJsonBase64) {
  const serviceAccount = JSON.parse(
    Buffer.from(serviceAccountJsonBase64, 'base64').toString('utf8'),
  );
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
} else if (serviceAccountJson) {
  admin.initializeApp({
    credential: admin.credential.cert(JSON.parse(serviceAccountJson)),
  });
} else if (serviceAccountPath) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccountPath),
  });
} else {
  console.warn(
    'Firebase service account not configured. FCM notifications will be disabled.',
  );
}

export default admin;
