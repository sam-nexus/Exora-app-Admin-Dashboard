# Testing Department + Courses + Mock + Exit in Postman

## Setup: Add `type` Column to Supabase

Run this SQL in Supabase SQL Editor:

```sql
ALTER TABLE courses ADD COLUMN type TEXT NOT NULL DEFAULT 'regular';
ALTER TABLE courses ADD CONSTRAINT valid_course_type CHECK (type IN ('regular', 'mock', 'exit'));
```

---

## Postman Testing Workflow

### 1. Login & Get Token

**POST** → `http://localhost:3000/api/auth/login`

```json
{
  "email": "admin@example.com",
  "password": "your_password"
}
```

Save the `token` to Postman environment variable: `{{token}}`

---

### 2. Create Department

**POST** → `http://localhost:3000/api/departments`

**Headers:**
```
Authorization: Bearer {{token}}
Content-Type: application/json
```

**Body:**
```json
{
  "name": "Computer Science",
  "icon": "💻"
}
```

**Response:**
```json
{
  "id": "dept-id-123",
  "name": "Computer Science",
  "icon": "💻"
}
```

Save `dept-id-123` to environment: `{{dept_id}}`

---

### 3. Add Regular Courses (15 courses)

**POST** → `http://localhost:3000/api/courses`

**Headers:**
```
Authorization: Bearer {{token}}
Content-Type: application/json
```

**Body (repeat 15 times with different names):**
```json
{
  "department_id": "{{dept_id}}",
  "name": "Programming Fundamentals",
  "type": "regular"
}
```

**Course names to add:**
1. Programming Fundamentals
2. Data Structures & Algorithms
3. Web Development
4. Database Management
5. Software Engineering
6. Artificial Intelligence
7. Mobile Development
8. Cloud Computing
9. Cybersecurity
10. DevOps & Infrastructure
11. Advanced Topics
12. Capstone Project
13. Practical Lab Work
14. Professional Development
15. Industry Practices

---

### 4. Add Mock Exam Courses (2 courses)

**POST** → `http://localhost:3000/api/courses`

**Headers:**
```
Authorization: Bearer {{token}}
Content-Type: application/json
```

**Body (repeat 2 times):**
```json
{
  "department_id": "{{dept_id}}",
  "name": "Mock Exam 1",
  "type": "mock"
}
```

```json
{
  "department_id": "{{dept_id}}",
  "name": "Mock Exam 2",
  "type": "mock"
}
```

---

### 5. Add Exit Exam Course (1 course)

**POST** → `http://localhost:3000/api/courses`

**Headers:**
```
Authorization: Bearer {{token}}
Content-Type: application/json
```

**Body:**
```json
{
  "department_id": "{{dept_id}}",
  "name": "Final Exit Exam",
  "type": "exit"
}
```

---

### 6. Verify All Courses Created

**GET** → `http://localhost:3000/api/courses?department_id={{dept_id}}`

**Headers:**
```
Authorization: Bearer {{token}}
```

**Response:** Shows all 18 courses (15 regular + 2 mock + 1 exit)

---

### 7. Filter by Type

**Get Regular Courses:**
```
GET http://localhost:3000/api/courses?department_id={{dept_id}}&type=regular
```

**Get Mock Exams:**
```
GET http://localhost:3000/api/courses?department_id={{dept_id}}&type=mock
```

**Get Exit Exams:**
```
GET http://localhost:3000/api/courses?department_id={{dept_id}}&type=exit
```

---

## ✅ Benefits of This Approach

- ✅ Single department instead of 3
- ✅ Cleaner admin UI
- ✅ Easier to filter by course type
- ✅ More intuitive for frontend
- ✅ Less database clutter

---

## Postman Environment Variables

Create these for easy reuse:

```
token: (paste from login response)
dept_id: (paste from create department response)
base_url: http://localhost:3000
```

Then use:
- `{{token}}`
- `{{dept_id}}`
- `{{base_url}}`

---

## Next: Update Admin Pages

The admin Questions page will now:
- Show courses from same department
- Filter by type (regular, mock, exit) using tabs
- No separate departments needed!
