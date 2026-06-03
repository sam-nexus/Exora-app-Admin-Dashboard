# 📱 **Exora Mobile App - Complete API Reference**

**Base URL**: `http://localhost:3000/api` (Local) | `https://exora-backend.onrender.com/api` (Production)

---

## 🔐 **Authentication Endpoints**

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

### 2. Get Unread Notifications Only
```
GET /notifications?unread=true
Authorization: Bearer {jwt_token}
```

**Response:**
```json
[
  {
    "id": "uuid",
    "recipient_id": "uuid",
    "title": "New Assignment",
    "message": "New practice questions added to C++ course",
    "link": "/courses/uuid",
    "is_read": false,
    "created_at": "2024-01-15T10:30:00Z"
  }
]
```

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
