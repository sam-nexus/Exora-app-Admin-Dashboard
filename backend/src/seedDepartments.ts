import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL || 'YOUR_SUPABASE_URL';
const supabaseKey = process.env.SUPABASE_ANON_KEY || 'YOUR_SUPABASE_KEY';

const supabase = createClient(supabaseUrl, supabaseKey);

const mainDepartments = [
  { name: 'Computer Science', icon: '💻' },
  { name: 'Information Technology', icon: '🖥️' },
  { name: 'Engineering', icon: '⚙️' },
  { name: 'Business Administration', icon: '📊' },
  { name: 'Accounting', icon: '📈' },
  { name: 'Finance', icon: '💰' },
  { name: 'Marketing', icon: '📢' },
  { name: 'Human Resources', icon: '👥' },
  { name: 'Law', icon: '⚖️' },
  { name: 'Medicine', icon: '🏥' },
  { name: 'Nursing', icon: '💉' },
  { name: 'Psychology', icon: '🧠' },
  { name: 'English Literature', icon: '📚' },
  { name: 'History', icon: '📖' },
  { name: 'Philosophy', icon: '🤔' },
  { name: 'Mathematics', icon: '🔢' },
  { name: 'Physics', icon: '⚛️' },
  { name: 'Chemistry', icon: '🧪' },
  { name: 'Biology', icon: '🧬' },
  { name: 'Environmental Science', icon: '🌍' },
];

const sampleCourses = [
  'Fundamentals of Programming',
  'Data Structures & Algorithms',
  'Web Development',
  'Database Management',
  'Software Engineering',
  'Artificial Intelligence',
  'Mobile Development',
  'Cloud Computing',
  'Cybersecurity',
  'DevOps & Infrastructure',
  'Advanced Topics',
  'Capstone Project',
  'Practical Lab Work',
  'Professional Development',
  'Industry Practices',
];

async function seedCompleteSystem() {
  console.log('🌱 Starting comprehensive database seeding...\n');

  try {
    let totalDepts = 0;
    let totalCourses = 0;

    // For each main department, create 3 variations
    for (const mainDept of mainDepartments) {
      console.log(`📚 Setting up: ${mainDept.icon} ${mainDept.name}`);

      // 1. Create main department
      const { data: mainData, error: mainError } = await supabase
        .from('departments')
        .insert({ name: mainDept.name, icon: mainDept.icon })
        .select()
        .single();

      if (mainError) {
        console.error(`  ❌ Error creating main dept: ${mainError.message}`);
        continue;
      }

      const mainDeptId = mainData.id;
      totalDepts++;

      // 2. Create Model Exams department
      const { data: modelData, error: modelError } = await supabase
        .from('departments')
        .insert({
          name: `${mainDept.name} - Model Exams`,
          icon: '📝',
        })
        .select()
        .single();

      if (!modelError) {
        totalDepts++;
      }

      // 3. Create Exit Exams department
      const { data: exitData, error: exitError } = await supabase
        .from('departments')
        .insert({
          name: `${mainDept.name} - Exit Exams`,
          icon: '🏆',
        })
        .select()
        .single();

      if (!exitError) {
        totalDepts++;
      }

      // 4. Create sample courses in main department
      const coursesToInsert = sampleCourses.map((courseName) => ({
        department_id: mainDeptId,
        name: courseName,
      }));

      const { data: coursesData, error: coursesError } = await supabase
        .from('courses')
        .insert(coursesToInsert)
        .select();

      if (!coursesError && coursesData) {
        totalCourses += coursesData.length;
        console.log(`  ✅ Created ${coursesData.length} courses in ${mainDept.name}`);

        // 5. Add sample questions to first course
        if (coursesData.length > 0) {
          const firstCourse = coursesData[0];
          const sampleQuestions = [
            {
              course_id: firstCourse.id,
              question_text: 'What is the primary purpose of this course?',
              options: ['Learning', 'Testing', 'Practice', 'All of the above'],
              correct_index: 3,
              explanation: 'This course serves all purposes',
            },
            {
              course_id: firstCourse.id,
              question_text: 'How many modules are in this course?',
              options: ['5', '10', '15', '20'],
              correct_index: 1,
              explanation: 'The course contains 10 modules',
            },
          ];

          await supabase.from('questions').insert(sampleQuestions);
        }
      }
    }

    // Create model and exit courses
    let modelCourses = 0;
    let exitCourses = 0;

    for (const mainDept of mainDepartments) {
      // Get model exams department
      const { data: modelDept } = await supabase
        .from('departments')
        .select('id')
        .eq('name', `${mainDept.name} - Model Exams`)
        .single();

      // Get exit exams department
      const { data: exitDept } = await supabase
        .from('departments')
        .select('id')
        .eq('name', `${mainDept.name} - Exit Exams`)
        .single();

      if (modelDept) {
        const modelCoursesToInsert = [
          {
            department_id: modelDept.id,
            name: `${mainDept.name} - Mock Exam 1`,
          },
          {
            department_id: modelDept.id,
            name: `${mainDept.name} - Mock Exam 2`,
          },
        ];
        const { data } = await supabase
          .from('courses')
          .insert(modelCoursesToInsert)
          .select();
        if (data) modelCourses += data.length;
      }

      if (exitDept) {
        const exitCoursesToInsert = [
          {
            department_id: exitDept.id,
            name: `${mainDept.name} - Final Exit Exam`,
          },
        ];
        const { data } = await supabase
          .from('courses')
          .insert(exitCoursesToInsert)
          .select();
        if (data) exitCourses += data.length;
      }
    }

    console.log('\n✅ Seeding Complete!\n');
    console.log('📊 Summary:');
    console.log(`  • Main Departments: ${mainDepartments.length}`);
    console.log(`  • Model Exam Departments: ${mainDepartments.length}`);
    console.log(`  • Exit Exam Departments: ${mainDepartments.length}`);
    console.log(`  • Total Departments: ${totalDepts}`);
    console.log(`  • Regular Courses: ${totalCourses}`);
    console.log(`  • Model Exam Courses: ${modelCourses}`);
    console.log(`  • Exit Exam Courses: ${exitCourses}`);
    console.log(`  • Total Courses: ${totalCourses + modelCourses + exitCourses}`);
    console.log('\n🎯 Your admin dashboard is now ready to use!');
  } catch (err) {
    console.error('❌ Unexpected error:', err);
  }
}

seedCompleteSystem();
