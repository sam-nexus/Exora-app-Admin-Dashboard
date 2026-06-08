import { Router, Response } from 'express';
import multer from 'multer';
import admin from '../firebase';
import { supabaseAdmin } from '../supabase';
import { authenticate, AuthRequest } from '../middleware/auth';

const router = Router();

// ─────────────────────────────────────────────
// FILE UPLOAD CONFIG
// ─────────────────────────────────────────────
const ALLOWED_MIME_TYPES = [
  'image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 'image/bmp',
];

const fileFilter = (req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  if (ALLOWED_MIME_TYPES.includes(file.mimetype)) {
    cb(null, true);
    return;
  }
  cb(new Error('Invalid file type. Allowed: JPG, PNG, GIF, WEBP, BMP'));
};

const upload = multer({
  storage: multer.memoryStorage(),
  fileFilter: fileFilter,
  limits: { fileSize: 10 * 1024 * 1024 },
});

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

    res.json({
      course,
      questions: questions || [],
      timeLimit: 3600,
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// POST – Submit mock exam
router.post('/mock-exam/submit', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { courseId, answers, mode, timeTaken } = req.body;
    const userId = req.userId!;

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
    const isPassed = score >= 60;

    const { error: saveError } = await supabaseAdmin.from('exam_results').insert({
      user_id: userId,
      course_id: courseId,
      exam_type: 'mock',
      mode: mode || 'test',
      score,
      correct_count: correctAnswers,
      total_count: questions.length,
      is_passed: isPassed,
      answers,
      results,
      time_taken: timeTaken ?? null,
    });

    if (saveError) {
      console.error('Failed to save mock exam result:', saveError.message);
    }

    res.json({
      score,
      totalQuestions: questions.length,
      correctAnswers,
      totalCount: questions.length,
      correctCount: correctAnswers,
      isPassed,
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
router.post('/departments/:deptId/exit-exam/start', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { deptId } = req.params;

    const { data: courses, error: coursesError } = await supabaseAdmin
      .from('courses')
      .select('id, name')
      .eq('department_id', deptId)
      .eq('type', 'exit');

    if (coursesError) return res.status(500).json({ error: coursesError.message });
    if (!courses || courses.length === 0) {
      return res.status(404).json({ error: 'No exit exam courses found for this department' });
    }

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

    const totalTime = Math.min(sections.length * 5400, 10800);

    res.json({ sections, totalTime });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// POST – Submit department exit exam
router.post('/exit-exam/submit', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { departmentId, courseId, answers, mode, timeTaken } = req.body;
    const userId = req.userId!;

    if (!answers) {
      return res.status(400).json({ error: 'answers are required' });
    }

    let courses: any[] = [];

    if (courseId) {
      const { data, error } = await supabaseAdmin
        .from('courses')
        .select('id, name')
        .eq('id', courseId);
      if (error) return res.status(500).json({ error: error.message });
      courses = data || [];
    } else if (departmentId) {
      const { data, error } = await supabaseAdmin
        .from('courses')
        .select('id, name')
        .eq('department_id', departmentId)
        .eq('type', 'exit');
      if (error) return res.status(500).json({ error: error.message });
      courses = data || [];

      if (courses.length === 0) {
        const { data: allCourses } = await supabaseAdmin
          .from('courses')
          .select('id, name')
          .eq('department_id', departmentId);
        courses = allCourses || [];
      }
    } else {
      return res.status(400).json({ error: 'departmentId or courseId is required' });
    }

    if (courses.length === 0) {
      return res.status(404).json({ error: 'No exit exam courses found' });
    }

    let totalCorrect = 0;
    let totalQuestions = 0;
    const allResults: any[] = [];

    await Promise.all(
      courses.map(async (course) => {
        const { data: questions } = await supabaseAdmin
          .from('questions')
          .select('id, correct_index, question_text, options, explanation')
          .eq('course_id', course.id);

        const qs = questions || [];
        let sectionCorrect = 0;

        const qResults = qs.map((q) => {
          const userLetter: string = answers[q.id] ?? '';
          const userIndex = userLetter ? userLetter.charCodeAt(0) - 65 : -1;
          const isCorrect = userIndex === q.correct_index;
          if (isCorrect) sectionCorrect++;
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

        allResults.push(...qResults);
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
    const isPassed = score >= 50;

    const { error: saveError } = await supabaseAdmin.from('exam_results').insert({
      user_id: userId,
      course_id: courseId || null,
      department_id: departmentId || null,
      exam_type: 'exit',
      mode: mode || 'test',
      score,
      correct_count: totalCorrect,
      total_count: totalQuestions,
      is_passed: isPassed,
      answers,
      results: allResults,
      time_taken: timeTaken ?? null,
    });

    if (saveError) {
      console.error('Failed to save exit exam result:', saveError.message);
    }

    res.json({
      score,
      correctCount: totalCorrect,
      totalCount: totalQuestions,
      isPassed,
      passingScore: 50,
      results: allResults,
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
      .select('id, user_id, image_url, status, amount, created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;

    res.json(data || []);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// GET – departments that are still locked for this student
router.get('/locked-departments', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId!;

    const { data: departments, error: deptError } = await supabaseAdmin
      .from('departments')
      .select('id, name, icon');

    if (deptError) throw deptError;

    const results = await Promise.all(
      (departments || []).map(async (dept) => {
        const { data: courses } = await supabaseAdmin
          .from('courses')
          .select('id')
          .eq('department_id', dept.id);

        const courseIds = (courses || []).map((c) => c.id);
        if (courseIds.length === 0) return null;

        const { data: userCourses } = await supabaseAdmin
          .from('user_courses')
          .select('is_locked')
          .eq('user_id', userId)
          .in('course_id', courseIds);

        const allLocked =
          !userCourses ||
          userCourses.length === 0 ||
          userCourses.every((uc) => uc.is_locked);

        if (!allLocked) return null;

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

// GET – Payment info (bank details with discount)
router.get('/payment-info', authenticate, async (req: AuthRequest, res: Response) => {
  res.json({
    amount: process.env.PAYMENT_AMOUNT || '50 ETB',
    originalAmount: process.env.PAYMENT_ORIGINAL_AMOUNT || '100 ETB',
    discount: process.env.PAYMENT_DISCOUNT || '50%',
    bank: process.env.PAYMENT_BANK || 'Commercial Bank of Ethiopia (CBE)',
    accountNumber: process.env.PAYMENT_ACCOUNT_NUMBER || '100023456789',
    accountName: process.env.PAYMENT_ACCOUNT_NAME || 'John Dalton',
  });
});

// POST – student uploads a payment receipt (NO department_id)
router.post(
  '/payments/upload-receipt',
  authenticate,
  upload.single('receipt'),
  async (req: AuthRequest, res: Response) => {
    try {
      const userId = req.userId!;

      if (!req.file) return res.status(400).json({ error: 'No file uploaded' });

      const ext = req.file.originalname.substring(req.file.originalname.lastIndexOf('.'));
      const filePath = `receipts/${userId}/${Date.now()}${ext}`;

      // Upload to Supabase Storage
      const { error: uploadError } = await supabaseAdmin.storage
        .from('payment-receipts')
        .upload(filePath, req.file.buffer, { contentType: req.file.mimetype });

      if (uploadError) throw uploadError;

      // Generate signed URL (valid for 1 year)
      const { data: signedData, error: signedError } = await supabaseAdmin.storage
        .from('payment-receipts')
        .createSignedUrl(filePath, 31536000);
      if (signedError) throw signedError;

      // Insert record — NO department_id
      const { error: insertError } = await supabaseAdmin
        .from('payment_receipts')
        .insert({
          user_id: userId,
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
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({ error: 'File too large. Maximum size is 10MB.' });
      }
      if (err.message && err.message.includes('Invalid file type')) {
        return res.status(400).json({ error: err.message });
      }
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
    res.json({});
  }
});

// GET – student study stats
router.get('/stats', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId!;

    const { data: userCourses } = await supabaseAdmin
      .from('user_courses')
      .select('is_locked')
      .eq('user_id', userId);

    const coursesCompleted = (userCourses || []).filter((c) => !c.is_locked).length;

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
      averageScore: 0,
      studyStreak: 0,
      totalHours: 0,
    });
  } catch (err: any) {
    res.json({ coursesCompleted: 0, totalQuestions: 0, averageScore: 0, studyStreak: 0, totalHours: 0 });
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

    try {
      const { data: profile } = await supabaseAdmin
        .from('profiles')
        .select('full_name, email')
        .eq('id', userId)
        .single();

      const studentName = profile?.full_name || profile?.email || 'A student';

      const { data: admins } = await supabaseAdmin
        .from('profiles')
        .select('id, device_tokens')
        .eq('role', 'admin');

      if (admins && admins.length > 0) {
        await supabaseAdmin.from('notifications').insert(
          admins.map((a: any) => ({
            recipient_id: a.id,
            title: `New support ticket: ${subject}`,
            message: `${studentName} opened a support ticket (${category || 'technical'}): "${message.substring(0, 100)}${message.length > 100 ? '…' : ''}"`,
            link: '/admin/support',
            notification_type: 'support_ticket',
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
                title: '📩 New Support Ticket',
                body: `${studentName}: ${subject}`,
              },
              data: {
                link: '/admin/support',
                type: 'support_ticket',
                ticketId: String(data.id),
              },
            })
            .catch((e: any) => console.error('FCM push error:', e));
        }
      }
    } catch (notifyErr: any) {
      console.error('Admin notification failed:', notifyErr.message);
    }

    res.status(201).json({ message: 'Ticket submitted', ticketId: data.id });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;