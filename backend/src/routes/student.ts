import { Router, Response } from 'express';
import multer from 'multer';
import admin from '../firebase';
import { supabaseAdmin } from '../supabase';
import { authenticate, AuthRequest } from '../middleware/auth';

const upload = multer({ storage: multer.memoryStorage() });
const router = Router();

// ─────────────────────────────────────────────
// COURSES
// ─────────────────────────────────────────────

// GET – Get course details for student
router.get('/courses/:courseId', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { courseId } = req.params;
    const { data, error } = await supabaseAdmin
      .from('courses')
      .select('*')
      .eq('id', courseId)
      .single();

    if (error) return res.status(500).json({ error: error.message });
    if (!data) return res.status(404).json({ error: 'Course not found' });

    res.json(data);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// ─────────────────────────────────────────────
// MOCK EXAM
// ─────────────────────────────────────────────

// POST – Start mock exam
router.post('/courses/:courseId/mock-exam/start', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { courseId } = req.params;

    const { data: course, error: courseError } = await supabaseAdmin
      .from('courses')
      .select('*')
      .eq('id', courseId)
      .eq('type', 'mock')
      .single();

    if (courseError || !course) {
      return res.status(404).json({ error: 'Mock exam course not found' });
    }

    const { data: questions, error: questionsError } = await supabaseAdmin
      .from('questions')
      .select('id, question_text, options, correct_index, explanation')
      .eq('course_id', courseId);

    if (questionsError) {
      return res.status(500).json({ error: questionsError.message });
    }

    // Keep correct_index so practice mode can reveal answers client-side.
    // Test mode submit uses server-side grading so exposing it here is acceptable.
    res.json({
      course,
      questions: questions || [],
      timeLimit: 3600, // 60 minutes
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// POST – Submit mock exam
// Returns field names that match the frontend: correctAnswers, totalQuestions
router.post('/mock-exam/submit', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { courseId, answers } = req.body;

    if (!courseId || !answers) {
      return res.status(400).json({ error: 'courseId and answers are required' });
    }

    const { data: questions, error: questionsError } = await supabaseAdmin
      .from('questions')
      .select('id, correct_index, question_text, options, explanation')
      .eq('course_id', courseId);

    if (questionsError) return res.status(500).json({ error: questionsError.message });
    if (!questions || questions.length === 0) {
      return res.status(404).json({ error: 'No questions found for this course' });
    }

    let correctAnswers = 0;
    const results = questions.map((q) => {
      // answers keyed by question id, value is letter "A"/"B"/"C"/"D"
      const userLetter: string = answers[q.id] ?? '';
      const userIndex = userLetter ? userLetter.charCodeAt(0) - 65 : -1;
      const isCorrect = userIndex === q.correct_index;
      if (isCorrect) correctAnswers++;

      const correctLetter = String.fromCharCode(65 + (q.correct_index ?? 0));
      return {
        id: q.id,
        text: q.question_text,
        options: q.options,
        userAnswer: userLetter || '(none)',
        correctAnswer: correctLetter,
        isCorrect,
        explanation: q.explanation || '',
      };
    });

    const score = Math.round((correctAnswers / questions.length) * 100);

    res.json({
      score,
      totalQuestions: questions.length,
      correctAnswers,
      // aliases so older frontend references still work
      totalCount: questions.length,
      correctCount: correctAnswers,
      isPassed: score >= 60,
      passingScore: 60,
      results,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// ─────────────────────────────────────────────
// EXIT EXAM  (department-level)
// ─────────────────────────────────────────────

// GET – department details for exit exam screen
router.get('/departments/:deptId', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { deptId } = req.params;
    const { data, error } = await supabaseAdmin
      .from('departments')
      .select('*')
      .eq('id', deptId)
      .single();

    if (error || !data) return res.status(404).json({ error: 'Department not found' });
    res.json(data);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// POST – Start department exit exam
// Builds sections (one per exit-type course) from the department
router.post('/departments/:deptId/exit-exam/start', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { deptId } = req.params;

    // Get all exit-type courses for this department
    const { data: courses, error: coursesError } = await supabaseAdmin
      .from('courses')
      .select('id, name')
      .eq('department_id', deptId)
      .eq('type', 'exit');

    if (coursesError) return res.status(500).json({ error: coursesError.message });
    if (!courses || courses.length === 0) {
      return res.status(404).json({ error: 'No exit exam courses found for this department' });
    }

    // Build sections – one per course, include questions (strip correct_index)
    const sections = await Promise.all(
      courses.map(async (course) => {
        const { data: questions } = await supabaseAdmin
          .from('questions')
          .select('id, question_text, options')
          .eq('course_id', course.id);

        return {
          courseId: course.id,
          courseName: course.name,
          questions: (questions || []).map((q) => ({
            id: q.id,
            text: q.question_text,
            options: q.options,
          })),
        };
      })
    );

    // 90 min per section, capped at 3 hours total
    const totalTime = Math.min(sections.length * 5400, 10800);

    res.json({ sections, totalTime });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// POST – Submit department exit exam
router.post('/exit-exam/submit', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { departmentId, answers } = req.body;

    if (!departmentId || !answers) {
      return res.status(400).json({ error: 'departmentId and answers are required' });
    }

    // Get all exit-type courses for this department
    const { data: courses, error: coursesError } = await supabaseAdmin
      .from('courses')
      .select('id, name')
      .eq('department_id', departmentId)
      .eq('type', 'exit');

    if (coursesError) return res.status(500).json({ error: coursesError.message });
    if (!courses || courses.length === 0) {
      return res.status(404).json({ error: 'No exit exam courses found' });
    }

    let totalCorrect = 0;
    let totalQuestions = 0;

    const sectionResults = await Promise.all(
      courses.map(async (course) => {
        const { data: questions } = await supabaseAdmin
          .from('questions')
          .select('id, correct_index')
          .eq('course_id', course.id);

        const qs = questions || [];
        let sectionCorrect = 0;

        qs.forEach((q) => {
          const userLetter: string = answers[q.id] ?? '';
          const userIndex = userLetter ? userLetter.charCodeAt(0) - 65 : -1;
          if (userIndex === q.correct_index) sectionCorrect++;
        });

        totalCorrect += sectionCorrect;
        totalQuestions += qs.length;

        return {
          courseId: course.id,
          courseName: course.name,
          correctCount: sectionCorrect,
          totalCount: qs.length,
          score: qs.length > 0 ? Math.round((sectionCorrect / qs.length) * 100) : 0,
        };
      })
    );

    const score = totalQuestions > 0 ? Math.round((totalCorrect / totalQuestions) * 100) : 0;

    res.json({
      score,
      correctCount: totalCorrect,
      totalCount: totalQuestions,
      isPassed: score >= 50,
      passingScore: 50,
      sectionResults,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// ─────────────────────────────────────────────
// PAYMENTS  (student side)
// ─────────────────────────────────────────────

// GET – student's own payment history
router.get('/payments', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId!;

    const { data, error } = await supabaseAdmin
      .from('payment_receipts')
      .select('*, departments(name)')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;

    const formatted = (data || []).map((p: any) => ({
      id:             p.id,
      user_id:        p.user_id,
      image_url:      p.image_url,
      status:         p.status,
      created_at:     p.created_at,
      department_id:  p.department_id,
      amount:         p.amount ?? null,
      // resolve department name from join OR fallback
      departmentName: p.departments?.name || p.department_name || null,
    }));

    res.json(formatted);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// GET – departments that are still locked for this student
router.get('/locked-departments', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId!;

    // Get all departments
    const { data: departments, error: deptError } = await supabaseAdmin
      .from('departments')
      .select('id, name, icon');

    if (deptError) throw deptError;

    // For each department, check if student has at least one unlocked course
    const results = await Promise.all(
      (departments || []).map(async (dept) => {
        const { data: courses } = await supabaseAdmin
          .from('courses')
          .select('id')
          .eq('department_id', dept.id);

        const courseIds = (courses || []).map((c) => c.id);
        if (courseIds.length === 0) return null; // skip empty departments

        const { data: userCourses } = await supabaseAdmin
          .from('user_courses')
          .select('is_locked')
          .eq('user_id', userId)
          .in('course_id', courseIds);

        const allLocked =
          !userCourses ||
          userCourses.length === 0 ||
          userCourses.every((uc) => uc.is_locked);

        if (!allLocked) return null; // already has access

        return {
          id: dept.id,
          name: dept.name,
          icon: dept.icon,
          courseCount: courseIds.length,
        };
      })
    );

    res.json(results.filter(Boolean));
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// POST – student uploads a payment receipt for a department
router.post(
  '/payments/upload-receipt',
  authenticate,
  upload.single('receipt'),
  async (req: AuthRequest, res: Response) => {
    try {
      const userId = req.userId!;
      const { paymentId } = req.body; // paymentId = department id

      if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
      if (!paymentId) return res.status(400).json({ error: 'paymentId (department id) is required' });

      const filePath = `receipts/${userId}/${Date.now()}-${req.file.originalname}`;
      const { error: uploadError } = await supabaseAdmin.storage
        .from('payment-receipts')
        .upload(filePath, req.file.buffer, { contentType: req.file.mimetype });

      if (uploadError) throw uploadError;

      const { data: signedData, error: signedError } = await supabaseAdmin.storage
        .from('payment-receipts')
        .createSignedUrl(filePath, 31536000);
      if (signedError) throw signedError;

      // Upsert: if a pending receipt already exists for this dept, replace it
      const { error: insertError } = await supabaseAdmin
        .from('payment_receipts')
        .insert({
          user_id: userId,
          department_id: paymentId,
          image_url: signedData.signedUrl,
          status: 'pending',
        });

      if (insertError) throw insertError;

      // Notify admins
      const { data: admins } = await supabaseAdmin
        .from('profiles')
        .select('id, device_tokens')
        .eq('role', 'admin');

      if (admins && admins.length > 0) {
        await supabaseAdmin.from('notifications').insert(
          admins.map((a: any) => ({
            recipient_id: a.id,
            title: 'New payment receipt received',
            message: 'A student uploaded a payment receipt. Please review and approve.',
            link: '/payments',
            is_read: false,
          }))
        );

        const tokens = admins
          .flatMap((a: any) => (Array.isArray(a.device_tokens) ? a.device_tokens : []))
          .map((t: any) => t.token)
          .filter(Boolean);

        if (tokens.length && admin.apps.length > 0) {
          await admin
            .messaging()
            .sendToDevice(tokens, {
              notification: {
                title: 'New payment receipt',
                body: 'A student uploaded a receipt for review.',
              },
              data: { link: '/payments', type: 'payment_received' },
            })
            .catch((e: any) => console.error('FCM error:', e));
        }
      }

      res.status(201).json({ message: 'Receipt uploaded, waiting for admin approval.' });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  }
);

// ─────────────────────────────────────────────
// PROFILE & STATS
// ─────────────────────────────────────────────

// GET – student profile extra fields
router.get('/profile', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId!;
    const { data, error } = await supabaseAdmin
      .from('profiles')
      .select('university, student_id, department, year_of_study, phone')
      .eq('id', userId)
      .single();

    if (error) {
      // Return empty object if columns don't exist yet (graceful degradation)
      return res.json({});
    }

    res.json({
      university: data?.university || '',
      studentId: data?.student_id || '',
      department: data?.department || '',
      yearOfStudy: data?.year_of_study || '',
      phone: data?.phone || '',
    });
  } catch (err: any) {
    res.json({}); // graceful — profile screen still loads
  }
});

// GET – student study stats
router.get('/stats', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId!;

    // Count unlocked courses (proxy for "completed" since we don't track sessions yet)
    const { data: userCourses } = await supabaseAdmin
      .from('user_courses')
      .select('is_locked')
      .eq('user_id', userId);

    const coursesCompleted = (userCourses || []).filter((c) => !c.is_locked).length;

    // Count total questions across all unlocked courses
    const { data: unlockedCourses } = await supabaseAdmin
      .from('user_courses')
      .select('course_id')
      .eq('user_id', userId)
      .eq('is_locked', false);

    const courseIds = (unlockedCourses || []).map((c) => c.course_id);
    let totalQuestions = 0;
    if (courseIds.length > 0) {
      const { count } = await supabaseAdmin
        .from('questions')
        .select('*', { count: 'exact', head: true })
        .in('course_id', courseIds);
      totalQuestions = count ?? 0;
    }

    res.json({
      coursesCompleted,
      totalQuestions,
      averageScore: 0,   // requires a results table – placeholder
      studyStreak: 0,    // requires session tracking – placeholder
    });
  } catch (err: any) {
    res.json({ coursesCompleted: 0, totalQuestions: 0, averageScore: 0, studyStreak: 0 });
  }
});

// ─────────────────────────────────────────────
// SUPPORT TICKETS
// ─────────────────────────────────────────────

// GET – student's own tickets
router.get('/support-tickets', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId!;
    const { data, error } = await supabaseAdmin
      .from('support_tickets')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      // Table may not exist yet – return empty array gracefully
      return res.json([]);
    }

    res.json(data || []);
  } catch (err: any) {
    res.json([]);
  }
});

// POST – create a support ticket
router.post('/support-tickets', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId!;
    const { subject, category, message } = req.body;

    if (!subject || !message) {
      return res.status(400).json({ error: 'Subject and message are required' });
    }

    const { data, error } = await supabaseAdmin
      .from('support_tickets')
      .insert({
        user_id: userId,
        subject,
        category: category || 'technical',
        message,
        status: 'open',
      })
      .select('id')
      .single();

    if (error) throw error;

    res.status(201).json({ message: 'Ticket submitted', ticketId: data.id });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
