# 🔌 Exora Platform - Complete API Endpoints

**Base URL**: `http://localhost:3000/api` (Local) | `https://exora-backend.render.com/api` (Production)

---

## 📚 **Courses**

### Get All Courses
```
GET /courses
GET /courses?department_id={id}
GET /courses?department_id={id}&type=regular|mock|exit
```
**Response**: `[{ id, department_id, name, type, created_at, is_locked }, ...]`

### Create Course
```
POST /courses
Content-Type: application/json

{
  "department_id": "uuid",
  "name": "C++ Basics",
  "type": "regular" | "mock" | "exit"
}
```
**Response**: `{ message, courseId, type }`

### Update Course
```
PUT /courses/{id}
Content-Type: application/json

{
  "name": "Advanced C++",
  "type": "mock"
}
```

### Delete Course
```
DELETE /courses/{id}
```

---

## 👥 **Users**

### Get All Users
```
GET /users
```
**Response**: `[{ id, full_name, email, role, created_at }, ...]`

### Get Single User
```
GET /users/{id}
```

### Create User (Admin Only)
```
POST /users
Content-Type: application/json

{
  "fullName": "John Doe",
  "email": "john@example.com",
  "password": "securePassword",
  "role": "admin" | "student"
}
```
**Response**: `{ message: "User created" }`

### Update User
```
PUT /users/{id}
Content-Type: application/json

{
  "full_name": "Jane Doe",
  "email": "jane@example.com"
}
```

### Delete User (Admin Only)
```
DELETE /users/{id}
```

### Lock/Unlock User Courses
```
POST /courses/toggle-all/{userId}
```
**Response**: `{ message: "All courses locked/unlocked for user" }`

### Lock All Courses for All Users (Admin Only)
```
POST /courses/lock-all-users
```

---

## 🏢 **Departments**

### Get All Departments
```
GET /departments
```
**Response**: 
```json
[{
  "id": "uuid",
  "name": "Information Technology",
  "icon": "💻",
  "created_at": "2024-01-15T10:30:00Z"
}, ...]
```

### Create Department (Admin Only)
```
POST /departments
Content-Type: application/json

{
  "name": "Computer Science",
  "icon": "🖥️"
}
```
**Response**: `{ id, message: "Department created" }`

### Update Department (Admin Only)
```
PUT /departments/{id}
Content-Type: application/json

{
  "name": "CS Engineering",
  "icon": "⚙️"
}
```

### Delete Department (Admin Only)
```
DELETE /departments/{id}
```

---

## ❓ **Questions**

### Get Questions by Course
```
GET /questions?course_id={id}
```
**Response**:
```json
[{
  "id": "uuid",
  "course_id": "uuid",
  "question_text": "What is OOP?",
  "options": ["Option A", "Option B", "Option C", "Option D"],
  "correct_index": 0,
  "explanation": "Explanation text"
}, ...]
```

### Create Question (Admin Only)
```
POST /questions
Content-Type: application/json

{
  "course_id": "uuid",
  "question_text": "What is a variable?",
  "options": ["A", "B", "C", "D"],
  "correct_index": 1,
  "explanation": "A variable is..."
}
```

### Update Question (Admin Only)
```
PUT /questions/{id}
Content-Type: application/json

{
  "question_text": "Updated question",
  "options": [...],
  "correct_index": 2,
  "explanation": "..."
}
```

### Delete Question (Admin Only)
```
DELETE /questions/{id}
```

---

## 💳 **Payments**

### Get All Payments
```
GET /payments
```

### Get User Payments
```
GET /payments?user_id={id}
```

### Create Payment (Student)
```
POST /payments
Content-Type: multipart/form-data

{
  "course_id": "uuid",
  "amount": 50.00,
  "receipt": <file> (PDF/Image)
}
```
**Response**: `{ id, status: "pending", message }`

### Update Payment Status (Admin Only)
```
PUT /payments/{id}
Content-Type: application/json

{
  "status": "approved" | "rejected"
}
```

---

## 🔔 **Notifications**

### Get Notifications
```
GET /notifications
GET /notifications?unread=true
```
**Response**:
```json
[{
  "id": "uuid",
  "recipient_id": "uuid",
  "title": "Course Updated",
  "message": "New questions added",
  "link": "/courses/123",
  "is_read": false,
  "created_at": "2024-01-15T10:30:00Z"
}, ...]
```

### Send Notification (Admin Only)
```
POST /notifications
Content-Type: application/json

{
  "title": "New Assignment",
  "message": "Check your inbox",
  "link": "/dashboard",
  "recipientId": "uuid",  // For single notification
  "broadcast": false      // Set true for broadcast
}
```

**For Broadcast Notifications**:
```json
{
  "title": "System Maintenance",
  "message": "Server maintenance on Sunday",
  "broadcast": true,
  "recipientRole": "student" | "admin"
}
```

### Mark Notification as Read
```
PATCH /notifications/{id}/read
```

---

## 🔐 **Authentication**

### Login
```
POST /auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123"
}
```
**Response**:
```json
{
  "token": "jwt_token_here",
  "user": {
    "id": "uuid",
    "full_name": "John Doe",
    "email": "john@example.com",
    "role": "student" | "admin"
  }
}
```

### Register
```
POST /auth/register
Content-Type: application/json

{
  "fullName": "Jane Doe",
  "email": "jane@example.com",
  "password": "password123"
}
```

### Forgot Password
```
POST /auth/forgot-password
Content-Type: application/json

{
  "email": "user@example.com"
}
```

### Reset Password
```
POST /auth/reset-password
Content-Type: application/json

{
  "token": "reset_token",
  "newPassword": "newPassword123"
}
```

---

## 📊 **Statistics**

### Get Dashboard Stats (Admin Only)
```
GET /stats/dashboard
```
**Response**:
```json
{
  "totalDepartments": 5,
  "totalCourses": 24,
  "totalUsers": 150,
  "totalStudents": 145,
  "totalAdmins": 5,
  "newUsersToday": 3
}
```

---

## 🔗 **Required Headers**

All authenticated endpoints require:
```
Authorization: Bearer {jwt_token}
Content-Type: application/json
```

---

## ⚠️ **Error Responses**

### 400 Bad Request
```json
{ "error": "Validation error message" }
```

### 401 Unauthorized
```json
{ "error": "Missing or invalid token" }
```

### 403 Forbidden
```json
{ "error": "Access denied. Admin only." }
```

### 404 Not Found
```json
{ "error": "Resource not found" }
```

### 500 Server Error
```json
{ "error": "Internal server error" }
```

---

## 📝 **Course Types**

- **regular**: 📚 Regular Practice Course
- **mock**: 📝 Mock Exam (timed, scored)
- **exit**: 🎓 Exit Exam (final assessment)

---

## 🚀 **Quick Start for Mobile**

1. **Login** → Get JWT token
2. **Fetch Departments** → `GET /departments`
3. **Fetch Courses** → `GET /courses?department_id={id}&type=regular`
4. **Fetch Questions** → `GET /questions?course_id={id}`
5. **Get Notifications** → `GET /notifications`

---

**Last Updated**: June 3, 2026
**Version**: 1.0.0
