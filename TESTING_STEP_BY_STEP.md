# 🧪 STEP-BY-STEP TESTING PROCEDURE

> **Before you start**: Make sure backend is running on `http://localhost:3000`

---

## 📍 STEP 1: Import Postman Collection

### What to do:
1. Open Postman
2. Click **Import** button (top-left corner)
3. Select **Upload Files**
4. Choose: `Exora-Notification-System.postman_collection.json`
5. Click **Import**

### Expected result:
```
✅ Collection appears in left sidebar
   Exora - Complete Notification System
   ├── 1. Authentication
   ├── 2. Courses
   ├── 3. Notifications - Student View
   ├── 4. Unlock Requests
   └── 5. Payments
```

---

## 🔑 STEP 2: Admin Login

### Open request:
`1. Authentication` → `Admin Login`

### What you see:
```json
POST {{base_url}}/auth/login
Headers: Content-Type: application/json
Body: {
  "email": "admin@exora.com",
  "password": "admin123"
}
```

### Click **Send** button

### Expected response:
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "email": "admin@exora.com",
    "role": "admin"
  }
}
```

### ✅ Verify:
- Response code: `200 OK`
- Token starts with `eyJ` (JWT format)
- Check in Postman: **Collections** → **Variables** → `admin_token` (should be filled)

---

## 🏢 STEP 3: Get Departments

### Why: 
You need a `dept_id` to create courses

### Open request:
`2. Courses` → `Get All Departments`

### Click **Send**

### Expected response:
```json
[
  {
    "id": "d123...",
    "name": "Computer Science",
    "description": "..."
  },
  {
    "id": "d456...",
    "name": "Engineering",
    "description": "..."
  }
]
```

### ✅ Verify:
- Response code: `200 OK`
- Has at least 1 department
- Check in Postman: **Collections** → **Variables** → `dept_id` (should auto-fill)

---

## 📚 STEP 4: Create Regular Course (First Notification!)

### Open request:
`2. Courses` → `Create Regular Course (→ Notifies ALL Students)`

### What you see:
```json
POST {{base_url}}/courses
Authorization: Bearer {{admin_token}}
Headers: Content-Type: application/json
Body: {
  "name": "JavaScript Fundamentals {{$timestamp}}",
  "department_id": "{{dept_id}}",
  "type": "regular"
}
```

### Click **Send**

### Expected response:
```json
{
  "message": "Course added",
  "courseId": "c789...",
  "type": "regular"
}
```

### 🔔 WHAT HAPPENS BEHIND THE SCENES:
```
1. ✅ Course created in database
2. ✅ Locked row created for EVERY student
3. ✅ Notifications table: INSERT new row for each student
   - recipient_id: each student
   - title: "New Course Available"
   - message: "A new Course JavaScript Fundamentals has been added..."
   - notification_type: "course_added"
4. ✅ Firebase Realtime DB updated: notifications/{studentId}/unread_count++
5. ✅ Push notification sent via FCM to all students
```

### ✅ Verify:
- Response code: `201 Created`
- Response has valid courseId
- Check Postman → **Collections** → **Variables** → `course_id` (auto-filled)

---

## 🔴 STEP 5: Watch Real-Time Badge Update! (The Cool Part!)

### Setup Two Windows:
**LEFT: Postman** (you just created course)  
**RIGHT: Browser**

### In Browser:
1. Open new tab: `http://localhost:5173/student`
2. Login as student (email: `student@email.com`, password: `password123`)
3. Look at **top-right corner** for notification bell 🔔

### What you see:
- Bell icon appears in top-right
- **Badge shows "1"** (one unread notification)
- **Without any page refresh!**

### ✅ This proves:
- ✅ Firebase real-time listener is working
- ✅ Notification was created in database
- ✅ Frontend received real-time update
- ✅ Badge auto-updated instantly

### 💡 Try this:
- Go back to Postman
- Create another course (repeat STEP 4)
- **Watch badge in browser change from "1" to "2" instantly** ✨

---

## 🏠 STEP 6: View Notifications in Dashboard

### In Browser:
1. Click the notification bell 🔔
2. Or navigate to: `http://localhost:5173/student/notifications`

### What you see:
```
🔔 Notifications
⚡ You have 2 unread notifications

[✓ Mark all read button]

Notification 1:
├ 🔵 Unread indicator
├ 📚 New Course Available
├ Message: "A new Course JavaScript Fundamentals has been added..."
├ Badge: "course_added"
└ Link: "View Course"

Notification 2:
├ 📝 New Mock Exam Available
├ ...
```

### ✅ Verify:
- Shows all notifications
- Shows unread count
- Has filter buttons at top

---

## 🎯 STEP 7: Test Mock Exam Notification

### Open request:
`2. Courses` → `Create Mock Exam (→ Notifies ALL Students)`

### Click **Send**

### In Browser:
- Badge updates: "2" → "3" instantly
- Go to notifications page
- See new "📝 Mock Exam Added" notification

### ✅ Verify:
- Type shows "mock_exam_added"
- Icon shows 📝
- Badge updated in real-time

---

## 🚪 STEP 8: Test Exit Exam Notification

### Open request:
`2. Courses` → `Create Exit Exam (→ Notifies ALL Students)`

### Click **Send**

### In Browser:
- Badge updates again
- New "🎯 Exit Exam Added" appears

---

## 👤 STEP 9: Register New Student (Admin Notification!)

### Open request:
`1. Authentication` → `Register New Student`

### What you see:
```json
POST {{base_url}}/auth/register
Body: {
  "email": "newstudent{{$timestamp}}@email.com",
  "password": "password123",
  "fullName": "New Test Student"
}
```

### Click **Send**

### Expected response:
```json
{
  "message": "User registered"
}
```

### 🔔 WHAT HAPPENS:
```
1. ✅ Student account created
2. ✅ All courses locked for this student
3. ✅ Notifications for ALL ADMINS created:
   - "New student registered"
   - Message: "[Name] has registered with email [email]"
   - Type: "student_registered"
4. ✅ Push notifications sent to all admins
```

### To verify in admin dashboard:
1. Login as admin
2. Check notifications
3. Should see "👤 New Student Registered"

---

## 🔐 STEP 10: Student Requests Course Unlock

### First, Log in as the New Student:
`1. Authentication` → `Student Login`

### Edit the request body:
```json
{
  "email": "[the email you used in STEP 9]",
  "password": "password123"
}
```

### Click **Send**

### Check Variables:
- `student_token` should be filled
- `student_id` should be filled

### Now, Request Unlock:
`4. Unlock Requests` → `Student Requests Course Unlock (→ Notifies Admins)`

### What you see:
```json
POST {{base_url}}/unlock-requests
Authorization: Bearer {{student_token}}
Body: {
  "courseId": "{{course_id}}",
  "reason": "I need access to this course for my assignments"
}
```

### Click **Send**

### Expected response:
```json
{
  "message": "Unlock request submitted",
  "requestId": "req123..."
}
```

### ✅ Verify in Postman:
- Response code: `201 Created`
- `requestId` auto-saved to `{{request_id}}`

### 🔔 WHAT HAPPENS:
```
1. ✅ Unlock request created with status="pending"
2. ✅ Notifications for ALL ADMINS:
   - Title: "Course Unlock Request"
   - Message: "[Student Name] has requested to unlock [Course Name]..."
   - Type: "unlock_request"
3. ✅ Notification for STUDENT:
   - Title: "Unlock Request Submitted"
   - Message: "Your request is being reviewed"
   - Type: "unlock_request_submitted"
4. ✅ Push notifications sent
```

---

## 👨‍💼 STEP 11: Admin Views Unlock Requests

### Switch to Admin Token:
`4. Unlock Requests` → `Admin Views All Unlock Requests`

### Click **Send**

### Expected response:
```json
[
  {
    "id": "req123...",
    "user_id": "student-uuid",
    "course_id": "course-uuid",
    "reason": "I need access to this course for my assignments",
    "status": "pending",
    "created_at": "2024-06-04T...",
    "profiles": {
      "full_name": "New Test Student",
      "email": "newstudent...@email.com"
    },
    "courses": {
      "name": "JavaScript Fundamentals"
    }
  }
]
```

### ✅ Verify:
- Response code: `200 OK`
- Shows the request you just created
- Status is "pending"
- Student name and course name shown

---

## ✅ STEP 12: Admin Approves Request

### Open request:
`4. Unlock Requests` → `Admin Approves Unlock Request (→ Notifies Student)`

### The request automatically uses:
- `{{request_id}}` (from STEP 10)
- `{{admin_token}}` (from STEP 2)

### Body:
```json
{
  "status": "approved"
}
```

### Click **Send**

### Expected response:
```json
{
  "message": "Unlock request approved"
}
```

### 🔔 WHAT HAPPENS:
```
1. ✅ Unlock request status → "approved"
2. ✅ Course UNLOCKED for student (is_locked = false)
3. ✅ Notification created for STUDENT:
   - Title: "Course Access Granted!"
   - Message: "Your request to unlock JavaScript Fundamentals has been approved..."
   - Type: "course_unlocked"
4. ✅ Push notification sent to student
```

### ✅ Verify:
- Response code: `200 OK`

### In Browser (Student):
1. Go to student dashboard: `http://localhost:5173/student`
2. Go to Notifications
3. See new "🔓 Course Access Granted!" notification
4. Go to Departments (`/student/departments`)
5. Course should now be **unlocked** (click to access)

---

## ❌ STEP 13: Test Reject (Optional)

### Create Another Unlock Request:
- Repeat STEP 10
- Get new `{{request_id}}`

### Admin Rejects:
`4. Unlock Requests` → `Admin Rejects Unlock Request (→ Notifies Student)`

### Body:
```json
{
  "status": "rejected"
}
```

### Click **Send**

### Expected:
```
1. Request status → "rejected"
2. Course remains LOCKED
3. Student gets notification: "❌ Unlock Request Declined"
```

---

## 📋 Final Verification Checklist

After all tests above, verify:

- [ ] Admin can login ✅
- [ ] Can create courses ✅
- [ ] Badge updates **without page refresh** ✅ (Most important!)
- [ ] Notifications page shows all notifications ✅
- [ ] Can filter by type (regular course, mock exam, exit exam) ✅
- [ ] Student can request unlock ✅
- [ ] Admin can see requests ✅
- [ ] Admin can approve (student gets notified) ✅
- [ ] Admin can reject (student gets notified) ✅
- [ ] Course lock/unlock status correct ✅
- [ ] All notification types display correctly ✅

---

## 🎉 SUCCESS!

If all checks pass, your notification system is **fully working**!

### Ready to:
1. ✅ Run more tests
2. ✅ Deploy to Render
3. ✅ Share with mobile team
4. ✅ Push to main branch

---

## 🐛 Common Issues During Testing

### Issue: "Token auto-not saved"
**Solution**: 
- Manually copy token from response
- Go to Collections → Variables → admin_token
- Paste token

### Issue: "course_id is empty"
**Solution**:
- Run "Get All Courses" first
- Then try unlock request
- Or paste course ID manually

### Issue: "Badge doesn't update"
**Solution**:
- Hard refresh browser (Ctrl+Shift+R)
- Check browser console for errors
- Verify Firebase config in .env

### Issue: "Notifications don't appear"
**Solution**:
- Go to /student/notifications page (forces reload)
- Or refresh manually
- Check network tab for API response

---

## 📸 What to Screenshot for Documentation

Good screenshots to take:
1. Postman collection import
2. Badge updates in real-time (0→1→2→3)
3. Notifications page with filters
4. Different notification types displayed
5. Admin unlock requests table
6. Student unlock request submitted
7. Student receives approval notification

