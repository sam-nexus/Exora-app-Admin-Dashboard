# Exora Backend

## Firebase push notification setup

The backend now supports Firebase Cloud Messaging using the Firebase Admin SDK.

### Required environment variables

- `SUPABASE_URL`
- `SUPABASE_SERVICE_KEY`
- `SUPABASE_ANON_KEY`
- `JWT_SECRET`
- One of:
  - `FIREBASE_SERVICE_ACCOUNT_JSON_BASE64`
  - `FIREBASE_SERVICE_ACCOUNT_JSON`
  - `FIREBASE_SERVICE_ACCOUNT_PATH`

> The Android client config JSON you provided is for the mobile app itself. The backend still needs a Firebase service account credential for server-side FCM.

### API endpoints

#### Register a device token

POST `/api/devices/register`

Body:

```json
{
  "token": "<fcm-device-token>",
  "platform": "android"
}
```

Requires an authenticated user token.

#### Create a notification

POST `/api/notifications`

Body for single user:

```json
{
  "title": "New message",
  "message": "You have a new admin notification.",
  "recipientId": "user-uuid",
  "link": "/dashboard"
}
```

Body for broadcast:

```json
{
  "title": "System alert",
  "message": "Please review the new policy.",
  "broadcast": true,
  "recipientRole": "user"
}
```

Requires an admin JWT.

#### Fetch notifications

GET `/api/notifications`

Query params:

- `unread=true` to return only unread notifications

#### Mark notification as read

PATCH `/api/notifications/:id/read`

Requires an authenticated user token.

### Notes

- `profiles.device_tokens` is used to store FCM device tokens.
- Notifications are still stored in a single `notifications` table.
- The Android `api_key` and `mobilesdk_app_id` values are for the client, not for server push authorization.
