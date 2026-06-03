# 📱 **Exora Mobile App - Complete API Reference**

**Base URL**: `http://localhost:3000/api` (Local) | `https://exora-backend.onrender.com/api` (Production)

---

## � **Firebase Configuration for Mobile Developers**

### Firebase Project Details
```
Project ID: avian-brand-47460-g8
Database URL: https://avian-brand-47460-g8.firebaseio.com
API Key: AIzaSyBsGVkP4xOGVmQzX1Y2Z3A4B5C6D7E8F9G0
Messaging Sender ID: 523456789012
App ID: 1:523456789012:web:a1b2c3d4e5f6g7h8i9j0
```

---

### Flutter Configuration
**pubspec.yaml dependencies:**
```yaml
dependencies:
  flutter:
    sdk: flutter
  firebase_core: ^2.24.0
  firebase_messaging: ^14.6.0
  firebase_database: ^10.5.0
  http: ^1.1.0
```

**Initialize in main.dart:**
```dart
import 'package:firebase_core/firebase_core.dart';
import 'firebase_options.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  await Firebase.initializeApp(
    options: DefaultFirebaseOptions.currentPlatform,
  );
  runApp(const MyApp());
}
```

**Firebase Options (lib/firebase_options.dart):**
```dart
import 'package:firebase_core/firebase_core.dart';

class DefaultFirebaseOptions {
  static const FirebaseOptions currentPlatform = FirebaseOptions(
    apiKey: 'AIzaSyBsGVkP4xOGVmQzX1Y2Z3A4B5C6D7E8F9G0',
    appId: '1:523456789012:web:a1b2c3d4e5f6g7h8i9j0',
    messagingSenderId: '523456789012',
    projectId: 'avian-brand-47460-g8',
    databaseURL: 'https://avian-brand-47460-g8.firebaseio.com',
    authDomain: 'avian-brand-47460-g8.firebaseapp.com',
    storageBucket: 'avian-brand-47460-g8.appspot.com',
  );
}
```

---

### Android Configuration
**google-services.json** (Download from Firebase Console and place in `android/app/`)
```json
{
  "type": "service_account",
  "project_id": "avian-brand-47460-g8",
  "private_key_id": "c14b1e870b656466ea2326c92ad207ae6c1f7a82",
  "client_email": "firebase-adminsdk-xxx@avian-brand-47460-g8.iam.gserviceaccount.com",
  "client_id": "123456789",
  "auth_uri": "https://accounts.google.com/o/oauth2/auth",
  "token_uri": "https://oauth2.googleapis.com/token",
  "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs"
}
```

**Android Manifest (android/app/src/main/AndroidManifest.xml):**
```xml
<uses-permission android:name="android.permission.INTERNET" />
<uses-permission android:name="android.permission.POST_NOTIFICATIONS" />
```

---

### iOS Configuration
**GoogleService-Info.plist** (Download from Firebase Console and add to Xcode)
```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>CLIENT_ID</key>
  <string>xxx.apps.googleusercontent.com</string>
  <key>REVERSED_CLIENT_ID</key>
  <string>com.googleusercontent.apps.xxx</string>
  <key>PROJECT_ID</key>
  <string>avian-brand-47460-g8</string>
  <key>STORAGE_BUCKET</key>
  <string>avian-brand-47460-g8.appspot.com</string>
  <key>API_KEY</key>
  <string>AIzaSyBsGVkP4xOGVmQzX1Y2Z3A4B5C6D7E8F9G0</string>
  <key>GCM_SENDER_ID</key>
  <string>523456789012</string>
  <key>BUNDLE_ID</key>
  <string>com.exora.app</string>
</dict>
</plist>
```

---

### Initial Setup (After First Login)
```dart
// Call this after user successfully logs in
Future<void> setupNotifications(String userId, String platform) async {
  try {
    // 1. Request notification permission
    final settings = await FirebaseMessaging.instance.requestPermission();
    
    if (settings.authorizationStatus == AuthorizationStatus.authorized) {
      // 2. Get FCM token
      final fcmToken = await FirebaseMessaging.instance.getToken();
      
      if (fcmToken != null) {
        // 3. Register token with backend
        await http.post(
          Uri.parse('https://exora-backend.onrender.com/api/devices/register'),
          headers: {
            'Authorization': 'Bearer $userToken',
            'Content-Type': 'application/json',
          },
          body: jsonEncode({
            'token': fcmToken,
            'platform': platform, // 'android' or 'ios'
          }),
        );
        
        print('Device registered for notifications');
      }
    }
  } catch (e) {
    print('Error setting up notifications: $e');
  }
}
```

---

## �🔐 **Authentication Endpoints**

### 1. Login
```
POST /auth/login
Content-Type: application/json

{
  "email": "student@example.com",
  "password": "password123"
}
```
**Response:**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "uuid",
    "full_name": "John Doe",
    "email": "student@example.com",
    "role": "student"
  }
}
```

### 2. Register
```
POST /auth/register
Content-Type: application/json

{
  "fullName": "Jane Doe",
  "email": "jane@example.com",
  "password": "securePassword123"
}
```
**Response:**
```json
{
  "token": "jwt_token",
  "user": { ... }
}
```

### 3. Forgot Password
```
POST /auth/forgot-password
Content-Type: application/json

{
  "email": "user@example.com"
}
```
**Response:**
```json
{
  "message": "Reset link sent to email"
}
```

### 4. Reset Password
```
POST /auth/reset-password
Content-Type: application/json

{
  "token": "reset_token_from_email",
  "newPassword": "newPassword123"
}
```

---

## 🏢 **Departments Endpoints**

### 1. Get All Departments
```
GET /departments
Authorization: Bearer {jwt_token}
```
**Response:**
```json
[
  {
    "id": "uuid-1",
    "name": "Information Technology",
    "icon": "💻",
    "created_at": "2024-01-15T10:30:00Z"
  },
  {
    "id": "uuid-2",
    "name": "Electrical Engineering",
    "icon": "⚡",
    "created_at": "2024-01-15T10:30:00Z"
  }
]
```

---

## 📚 **Courses Endpoints**

### 1. Get All Courses
```
GET /courses
Authorization: Bearer {jwt_token}
```

### 2. Get Courses by Department
```
GET /courses?department_id={id}
Authorization: Bearer {jwt_token}
```

### 3. Get Courses by Type (Regular/Mock/Exit)
```
GET /courses?department_id={id}&type=regular
GET /courses?department_id={id}&type=mock
GET /courses?department_id={id}&type=exit
Authorization: Bearer {jwt_token}
```

**Response:**
```json
[
  {
    "id": "uuid",
    "department_id": "uuid",
    "name": "C++ Fundamentals",
    "type": "regular",
    "created_at": "2024-01-15T10:30:00Z",
    "is_locked": false
  },
  {
    "id": "uuid",
    "department_id": "uuid",
    "name": "C++ Mock Exam",
    "type": "mock",
    "created_at": "2024-01-15T10:30:00Z",
    "is_locked": false
  }
]
```

---

## ❓ **Questions Endpoints**

### 1. Get Questions by Course
```
GET /questions?course_id={id}
Authorization: Bearer {jwt_token}
```

**Response:**
```json
[
  {
    "id": "uuid",
    "course_id": "uuid",
    "question_text": "What is Object Oriented Programming?",
    "options": [
      "A programming paradigm",
      "A data structure",
      "A design pattern",
      "A database type"
    ],
    "correct_index": 0,
    "explanation": "OOP is a programming paradigm based on the concept of objects..."
  }
]
```

### 2. Submit Answer (Optional tracking)
```
POST /questions/{id}/submit
Authorization: Bearer {jwt_token}
Content-Type: application/json

{
  "selected_index": 0
}
```

---

## 🔔 **Notifications Endpoints**

### 1. Get All Notifications
```
GET /notifications
Authorization: Bearer {jwt_token}
```

**Response:**
```json
[
  {
    "id": "uuid-1",
    "recipient_id": "uuid",
    "title": "New Assignment",
    "message": "New practice questions added to C++ course",
    "link": "/courses/uuid",
    "is_read": false,
    "created_at": "2024-01-15T10:30:00Z"
  },
  {
    "id": "uuid-2",
    "recipient_id": "uuid",
    "title": "Course Unlocked",
    "message": "Advanced C++ course is now available",
    "link": "/courses/uuid2",
    "is_read": true,
    "created_at": "2024-01-14T15:20:00Z"
  }
]
```

**Error Responses:**
- `401 Unauthorized` - Invalid or missing token
- `500 Internal Server Error` - Server error

---

### 2. Get Unread Notifications Only
```
GET /notifications?unread=true
Authorization: Bearer {jwt_token}
```

**Response:**
```json
[
  {
    "id": "uuid-1",
    "recipient_id": "uuid",
    "title": "New Assignment",
    "message": "New practice questions added to C++ course",
    "link": "/courses/uuid",
    "is_read": false,
    "created_at": "2024-01-15T10:30:00Z"
  }
]
```

**Status Codes:**
- `200 OK` - Success
- `401 Unauthorized` - Invalid token
- `500 Internal Server Error` - Database error

---

### 3. Mark Notification as Read
```
PATCH /notifications/{id}/read
Authorization: Bearer {jwt_token}
```

**Response:**
```json
{
  "message": "Notification marked as read."
}
```

**Error Responses:**
- `404 Not Found` - Notification ID doesn't exist
- `403 Forbidden` - Notification doesn't belong to user
- `401 Unauthorized` - Invalid token

---

## 🔥 **Firebase Real-Time Notifications (Mobile)**

### Setup Firebase in Your Mobile App

**1. Initialize Firebase (Android/iOS/Flutter)**
```kotlin
// Android
FirebaseApp.initializeApp(context)
```

```swift
// iOS
FirebaseApp.configure()
```

```dart
// Flutter
await Firebase.initializeApp()
```

---

### 2. Listen to Unread Count (Real-Time Updates)

The system automatically updates the unread notification count in Firebase Realtime Database at:
```
notifications/{userId}/unread_count
```

**Example (Flutter):**
```dart
import 'package:firebase_database/firebase_database.dart';

final database = FirebaseDatabase.instance;

void listenToUnreadCount(String userId) {
  database
    .ref('notifications/$userId/unread_count')
    .onValue
    .listen((event) {
      final unreadCount = event.snapshot.value as int? ?? 0;
      print('Unread notifications: $unreadCount');
      // Update UI with unread count
      updateNotificationBadge(unreadCount);
    });
}
```

**Example (Android - Kotlin):**
```kotlin
val database = FirebaseDatabase.getInstance()
val unreadRef = database.getReference("notifications/$userId/unread_count")

unreadRef.addValueEventListener(object : ValueEventListener {
    override fun onDataChange(snapshot: DataSnapshot) {
        val unreadCount = snapshot.value as? Long ?: 0
        Log.d("Notifications", "Unread: $unreadCount")
        updateBadge(unreadCount.toInt())
    }

    override fun onCancelled(error: DatabaseError) {
        Log.e("Firebase", "Error: ${error.message}")
    }
})
```

**Example (iOS - Swift):**
```swift
import FirebaseDatabase

let ref = Database.database().reference()

ref.child("notifications").child(userId).child("unread_count").observe(.value) { snapshot in
    let unreadCount = snapshot.value as? Int ?? 0
    print("Unread notifications: \(unreadCount)")
    updateNotificationBadge(unreadCount)
}
```

---

### 3. Listen to Last Updated Timestamp (For Polling Fallback)

```
notifications/{userId}/last_updated
```

Use this to trigger a manual API call if real-time listener fails.

---

### 4. Receive Push Notifications (FCM)

When a notification is created, it's automatically sent via Firebase Cloud Messaging (FCM).

**Required: Register Device Token on Login**
```
POST /devices/register
Authorization: Bearer {jwt_token}
Content-Type: application/json

{
  "token": "firebase_fcm_token",
  "platform": "android"
}
```

See **Device Registration Endpoints** section below.

---

### 5. Data in Push Notification Payload

```json
{
  "notification": {
    "title": "New Assignment",
    "body": "Practice questions added to C++ course"
  },
  "data": {
    "link": "/courses/uuid"
  }
}
```

**Handle notification in your app:**
```dart
// Flutter
FirebaseMessaging.onMessage.listen((RemoteMessage message) {
  print('Got a message whilst in the foreground!');
  print('Message data: ${message.data}');
  
  if (message.notification != null) {
    print('Message notification: ${message.notification}');
    showNotificationUI(message);
  }
  
  navigateToLink(message.data['link']);
});
```

---

## 📱 **Device Registration Endpoints**

### 1. Register Device for Push Notifications
```
POST /devices/register
Authorization: Bearer {jwt_token}
Content-Type: application/json

{
  "token": "firebase_fcm_token_from_device",
  "platform": "android"
}
```

**Platforms:** `android` | `ios` | `web`

**Response:**
```json
{
  "message": "Device token registered successfully."
}
```

**Important:** Call this endpoint immediately after user logs in.

**Example (Flutter):**
```dart
Future<void> registerDeviceToken() async {
  final token = await FirebaseMessaging.instance.getToken();
  
  if (token != null) {
    await api.post('/devices/register', {
      'token': token,
      'platform': 'android', // or 'ios'
    });
  }
}
```

---

### 2. Update Device Token (When Token Refreshes)
```
POST /devices/register
Authorization: Bearer {jwt_token}
Content-Type: application/json

{
  "token": "new_firebase_fcm_token",
  "platform": "android"
}
```

**Listen for token refresh:**
```dart
FirebaseMessaging.instance.onTokenRefresh.listen((newToken) {
  registerDeviceToken(); // Re-register with new token
});
```

---

## 🔔 **Notification Best Practices for Mobile**

### 1. Check Permissions at Launch
```dart
final settings = await FirebaseMessaging.instance.requestPermission();

if (settings.authorizationStatus == AuthorizationStatus.authorized) {
  print('User granted permission');
} else if (settings.authorizationStatus == AuthorizationStatus.provisional) {
  print('User granted provisional permission');
} else {
  print('User declined or has not yet granted permission');
}
```

### 2. Handle Background Notifications
```dart
@pragma('vm:entry-point')
Future<void> firebaseMessagingBackgroundHandler(RemoteMessage message) async {
  print("Handling a background message: ${message.messageId}");
  // Handle notification when app is in background
}

FirebaseMessaging.onBackgroundMessage(firebaseMessagingBackgroundHandler);
```

### 3. Deep Linking Example
```dart
// When notification is tapped, navigate to the link
void handleNotificationTap(String? link) {
  if (link != null) {
    Navigator.of(context).pushNamed(link);
  }
}
```

### 4. Retry Logic for Failed API Calls
```dart
Future<List<Notification>> fetchNotificationsWithRetry({int maxRetries = 3}) async {
  for (int i = 0; i < maxRetries; i++) {
    try {
      return await api.get('/notifications?unread=true');
    } catch (e) {
      if (i == maxRetries - 1) rethrow;
      await Future.delayed(Duration(seconds: 2 << i)); // Exponential backoff
    }
  }
}
```

---

## ✅ **Mobile Notification Setup Checklist**

### Phase 1: Initial Setup
- [ ] Download `google-services.json` (Android) / `GoogleService-Info.plist` (iOS) from Firebase Console
- [ ] Add Firebase dependencies to `pubspec.yaml`
- [ ] Initialize Firebase in `main.dart`
- [ ] Set up Firebase options with project credentials
- [ ] Configure Android manifest permissions
- [ ] Configure iOS notification capabilities

### Phase 2: Authentication & Registration
- [ ] Implement user login endpoint
- [ ] After successful login, call `setupNotifications()` function
- [ ] Store JWT token securely (use secure storage package)
- [ ] Register device token with backend: `POST /devices/register`

### Phase 3: Real-Time Listeners
- [ ] Set up Firebase Realtime Database listener for unread count
- [ ] Display notification badge with unread count
- [ ] Add error handling and fallback to polling

### Phase 4: Push Notifications
- [ ] Request notification permission on app launch
- [ ] Handle foreground messages: `FirebaseMessaging.onMessage`
- [ ] Handle background messages: `firebaseMessagingBackgroundHandler`
- [ ] Implement deep linking when notification is tapped
- [ ] Handle token refresh: `FirebaseMessaging.instance.onTokenRefresh`

### Phase 5: Testing
- [ ] Test login → notification registration flow
- [ ] Test receiving push notifications (foreground & background)
- [ ] Test unread count badge updating in real-time
- [ ] Test marking notification as read
- [ ] Test deep linking from notification tap
- [ ] Test with network disabled (polling fallback)

---

## 📋 **Quick Reference - Notification URLs**

| Action | Endpoint | Method |
|--------|----------|--------|
| Get all notifications | `/notifications` | GET |
| Get unread only | `/notifications?unread=true` | GET |
| Mark as read | `/notifications/{id}/read` | PATCH |
| Register device | `/devices/register` | POST |
| Firebase DB (unread count) | `notifications/{userId}/unread_count` | REALTIME |
| Firebase DB (last update) | `notifications/{userId}/last_updated` | REALTIME |

---

## 🚨 **Common Issues & Solutions**

### Issue 1: FCM Token Not Registering
```dart
// Check token is not null
final token = await FirebaseMessaging.instance.getToken();
if (token == null) {
  print('FCM token is null - check Firebase configuration');
}

// Check network is available
final isOnline = await checkNetworkConnectivity();
if (!isOnline) {
  print('No internet - cannot register device');
}
```

### Issue 2: Notifications Not Showing
- Check app has notification permission granted
- Check Firebase Cloud Messaging is enabled in Firebase Console
- Check device token is registered with backend
- Check backend has valid Firebase service account

### Issue 3: Real-Time Updates Not Working
```dart
// Fallback to polling every 10 seconds
Future<void> pollNotifications(String userId) async {
  Timer.periodic(Duration(seconds: 10), (_) async {
    try {
      final response = await http.get(
        Uri.parse('https://exora-backend.onrender.com/api/notifications?unread=true'),
        headers: {'Authorization': 'Bearer $token'},
      );
      if (response.statusCode == 200) {
        final notifications = jsonDecode(response.body) as List;
        updateBadge(notifications.length);
      }
    } catch (e) {
      print('Polling error: $e');
    }
  });
}
```

### Issue 4: Token Expiration
```dart
// Always refresh token before API calls
Future<String?> getValidToken() async {
  final token = await secureStorage.read(key: 'jwt_token');
  if (_isTokenExpired(token)) {
    // Refresh token or re-login
    return null;
  }
  return token;
}
```

---

## 📞 **Support & Contact**

**Backend Issues:** Check server logs on Render dashboard  
**Firebase Issues:** Check Firebase Console > Database & Messaging  
**API Issues:** Test with Postman using the endpoints provided above  
**Security Issues:** Contact: samuelbiranu6@gmail.com

---

## 📱 **Device Registration Endpoints**

### 1. Register Device for Push Notifications
```
POST /devices/register
Authorization: Bearer {jwt_token}
Content-Type: application/json

{
  "token": "firebase_fcm_token_from_device",
  "platform": "android"
}
```

**Platforms:** `android` | `ios` | `web`

**Response:**
```json
{
  "message": "Device token registered successfully."
}
```

**Note:** Call this endpoint when user logs in to enable push notifications.

---

## 💳 **Payments Endpoints**

### 1. Get Payment History
```
GET /payments
Authorization: Bearer {jwt_token}
```

### 2. Get User's Payments
```
GET /payments?user_id={id}
Authorization: Bearer {jwt_token}
```

**Response:**
```json
[
  {
    "id": "uuid",
    "user_id": "uuid",
    "course_id": "uuid",
    "amount": 50.00,
    "status": "approved",
    "receipt_url": "https://...",
    "created_at": "2024-01-15T10:30:00Z"
  }
]
```

### 3. Upload Payment Receipt
```
POST /payments
Authorization: Bearer {jwt_token}
Content-Type: multipart/form-data

{
  "course_id": "uuid",
  "amount": 50.00,
  "receipt": <binary_file>
}
```

**File Types:** PDF, JPG, PNG  
**Max Size:** 5MB

**Response:**
```json
{
  "id": "uuid",
  "status": "pending",
  "message": "Payment receipt uploaded. Awaiting admin approval."
}
```

---

## 👤 **User Profile Endpoints**

### 1. Get Current User Profile
```
GET /users/profile
Authorization: Bearer {jwt_token}
```

**Response:**
```json
{
  "id": "uuid",
  "full_name": "John Doe",
  "email": "john@example.com",
  "role": "student",
  "created_at": "2024-01-15T10:30:00Z",
  "device_tokens": [
    {
      "token": "fcm_token",
      "platform": "android",
      "added_at": "2024-01-15T10:35:00Z"
    }
  ]
}
```

### 2. Update Profile
```
PUT /users/{id}
Authorization: Bearer {jwt_token}
Content-Type: application/json

{
  "full_name": "Jane Doe",
  "email": "jane@example.com"
}
```

---

## 📊 **Statistics Endpoints**

### 1. Get Student Dashboard Stats
```
GET /stats/dashboard
Authorization: Bearer {jwt_token}
```

**Response:**
```json
{
  "coursesEnrolled": 12,
  "coursesCompleted": 5,
  "practiceQuestionsAttempted": 150,
  "averageScore": 78.5,
  "mockExamsGiven": 3,
  "exitExamsGiven": 1
}
```

---

## 🔄 **Complete Student App Flow**

### **Step 1: Authentication**
```
1. User enters email & password
2. POST /auth/login
3. Save returned JWT token locally
4. Store user info
```

### **Step 2: Device Registration**
```
1. Get Firebase FCM token
2. POST /devices/register
3. This enables push notifications
```

### **Step 3: Load Home Screen**
```
1. GET /departments (show all departments)
2. GET /stats/dashboard (show student stats)
3. GET /notifications?unread=true (show unread count)
```

### **Step 4: Browse Courses**
```
1. User selects department
2. GET /courses?department_id={id}
3. Show tabs: Regular | Mock | Exit
4. GET /courses?department_id={id}&type=regular
5. GET /courses?department_id={id}&type=mock
6. GET /courses?department_id={id}&type=exit
```

### **Step 5: Practice Mode**
```
1. User selects course
2. GET /questions?course_id={id}
3. Display questions one by one
4. User selects answer
5. Show correct answer + explanation
```

### **Step 6: Mock/Exit Exam**
```
1. Start exam
2. GET /questions?course_id={id}
3. Timer starts
4. Submit answers
5. Calculate score
6. Show results
```

### **Step 7: Payments**
```
1. User needs to pay for course
2. POST /payments (upload receipt)
3. GET /payments (check status)
4. Once approved, unlock course
```

---

## 🎯 **Quick Reference Table**

| Feature | Endpoint | Method | Auth Required |
|---------|----------|--------|---|
| **Login** | `/auth/login` | POST | ❌ |
| **Register** | `/auth/register` | POST | ❌ |
| **Departments** | `/departments` | GET | ✅ |
| **Courses** | `/courses?department_id={id}` | GET | ✅ |
| **Courses by Type** | `/courses?department_id={id}&type=regular` | GET | ✅ |
| **Questions** | `/questions?course_id={id}` | GET | ✅ |
| **Notifications** | `/notifications` | GET | ✅ |
| **Unread Notifications** | `/notifications?unread=true` | GET | ✅ |
| **Mark Read** | `/notifications/{id}/read` | PATCH | ✅ |
| **Register Device** | `/devices/register` | POST | ✅ |
| **Upload Payment** | `/payments` | POST | ✅ |
| **Payment History** | `/payments` | GET | ✅ |
| **User Profile** | `/users/profile` | GET | ✅ |
| **Update Profile** | `/users/{id}` | PUT | ✅ |
| **Dashboard Stats** | `/stats/dashboard` | GET | ✅ |

---

## 📋 **Required Headers**

All authenticated requests require:
```
Authorization: Bearer {jwt_token}
Content-Type: application/json
```

---

## ⚠️ **Error Handling**

### **400 Bad Request**
```json
{
  "error": "Invalid course_id format"
}
```

### **401 Unauthorized**
```json
{
  "error": "Missing or invalid token"
}
```

### **404 Not Found**
```json
{
  "error": "Course not found"
}
```

### **500 Server Error**
```json
{
  "error": "Internal server error"
}
```

---

## 💡 **Best Practices for Mobile**

1. **Token Storage**: Save JWT in secure storage (Keychain/Keystore)
2. **Caching**: Cache departments & courses locally
3. **Offline Mode**: Store downloaded questions locally
4. **Error Handling**: Show user-friendly error messages
5. **Retry Logic**: Implement exponential backoff
6. **Push Notifications**: Handle both foreground & background messages
7. **Rate Limiting**: Don't spam API calls
8. **Session Management**: Refresh token before expiry

---

## 🚀 **Sample Mobile Implementation**

```javascript
// 1. Login
const login = async (email, password) => {
  const response = await fetch('http://localhost:3000/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  });
  const data = await response.json();
  localStorage.setItem('token', data.token);
  return data.user;
};

// 2. Register Device
const registerDevice = async (fcmToken, platform) => {
  const token = localStorage.getItem('token');
  await fetch('http://localhost:3000/api/devices/register', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ token: fcmToken, platform })
  });
};

// 3. Get Departments
const getDepartments = async () => {
  const token = localStorage.getItem('token');
  const response = await fetch('http://localhost:3000/api/departments', {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  return response.json();
};

// 4. Get Courses by Type
const getCourses = async (deptId, type) => {
  const token = localStorage.getItem('token');
  const url = `http://localhost:3000/api/courses?department_id=${deptId}&type=${type}`;
  const response = await fetch(url, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  return response.json();
};

// 5. Get Questions
const getQuestions = async (courseId) => {
  const token = localStorage.getItem('token');
  const response = await fetch(`http://localhost:3000/api/questions?course_id=${courseId}`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  return response.json();
};

// 6. Get Notifications
const getNotifications = async () => {
  const token = localStorage.getItem('token');
  const response = await fetch('http://localhost:3000/api/notifications?unread=true', {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  return response.json();
};
```

---

**Last Updated:** June 3, 2026  
**Version:** 1.0.0  
**For:** Mobile App Developers (Android, iOS, Flutter, React Native)
