# Database Seeding Instructions

## Complete System Setup

The seeding script creates a complete exam management system for all 20 departments:

### What Gets Created:

For **each department** (e.g., "Computer Science"):
- ✅ **Main Department** with 15 regular courses
  - Fundamentals of Programming
  - Data Structures & Algorithms
  - Web Development
  - Database Management
  - ... and 10 more courses
  
- 📝 **Model Exams Department** "{Department} - Model Exams"
  - Mock Exam 1
  - Mock Exam 2
  
- 🏆 **Exit Exam Department** "{Department} - Exit Exams"
  - Final Exit Exam

---

## How to Run

### Option 1: Run the Seeding Script (Recommended)

1. **Make sure your backend `.env` has correct credentials**:
   ```
   SUPABASE_URL=your_supabase_url
   SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

2. **Run the seeding script**:
   ```bash
   cd backend
   npx ts-node src/seedDepartments.ts
   ```

3. **Wait for completion** - you'll see a summary like:
   ```
   ✅ Seeding Complete!

   📊 Summary:
     • Main Departments: 20
     • Model Exam Departments: 20
     • Exit Exam Departments: 20
     • Total Departments: 60
     • Regular Courses: 300
     • Model Exam Courses: 40
     • Exit Exam Courses: 20
     • Total Courses: 360
   ```

---

## After Seeding

### Verify in Admin Dashboard:

1. Open **Departments** page → See all 60 departments (20 main + 20 model + 20 exit)
2. Open **Courses** page → Click a department → See 15 courses
3. Open **Questions** page:
   - Click a department (e.g., "Computer Science")
   - You'll see **3 tabs**:
     - 📚 **Courses** - Shows 15 regular courses
     - 📝 **Mock / Model** - Shows 2 mock exams
     - 🏆 **Exit Exams** - Shows 1 final exam

---

## What Departments Are Created?

20 departments with their model/exit variations:
- 💻 Computer Science
- 🖥️ Information Technology
- ⚙️ Engineering
- 📊 Business Administration
- 📈 Accounting
- 💰 Finance
- 📢 Marketing
- 👥 Human Resources
- ⚖️ Law
- 🏥 Medicine
- 💉 Nursing
- 🧠 Psychology
- 📚 English Literature
- 📖 History
- 🤔 Philosophy
- 🔢 Mathematics
- ⚛️ Physics
- 🧪 Chemistry
- 🧬 Biology
- 🌍 Environmental Science

---

## Running Multiple Times

- Safe to run multiple times
- Won't create duplicates
- If you run it twice, you'll get an error for existing departments, but that's normal

---

## Troubleshooting

### Error: "Supabase credentials not found"
Make sure your `.env` file in the backend folder has:
```
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_ANON_KEY=xxxxx
```

### Script hangs or takes long time
- Check your internet connection
- Verify Supabase is accessible
- Check that your API credentials are valid

### Departments created but no courses?
- The script may have partially completed
- Check Supabase dashboard to see what was created
- You can add courses manually via the admin dashboard

---

## Next Steps

1. ✅ Run seeding script
2. ✅ Verify in admin dashboard
3. 📝 Add questions to courses
4. 🎯 Test the three-tab system
5. 📱 Verify mobile app still works (no backend changes)
