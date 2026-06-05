import * as admin from 'firebase-admin';
import * as dotenv from 'dotenv';

dotenv.config();

const serviceAccountJsonBase64 = process.env.FIREBASE_SERVICE_ACCOUNT_JSON_BASE64;
const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
const serviceAccountPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH;
const databaseURL = process.env.FIREBASE_DATABASE_URL || 'https://avian-brand-474607-g8-default-rtdb.firebaseio.com';

if (!admin.apps.length) {
  try {
    if (serviceAccountJsonBase64) {
      const serviceAccount = JSON.parse(
        Buffer.from(serviceAccountJsonBase64, 'base64').toString('utf8'),
      );
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        databaseURL: databaseURL,
      });
      console.log('✅ Firebase Admin initialized (base64 service account)');
    } else if (serviceAccountJson) {
      admin.initializeApp({
        credential: admin.credential.cert(JSON.parse(serviceAccountJson)),
        databaseURL: databaseURL,
      });
      console.log('✅ Firebase Admin initialized (JSON service account)');
    } else if (serviceAccountPath) {
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccountPath),
        databaseURL: databaseURL,
      });
      console.log('✅ Firebase Admin initialized (service account path)');
    } else {
      console.warn('⚠️ Firebase service account not configured. FCM notifications will be disabled.');
    }
  } catch (err) {
    console.error('❌ Firebase Admin initialization failed:', err);
  }
}

export default admin;