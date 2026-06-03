import { Router, Response } from 'express';
import { supabaseAdmin } from '../supabase';
import { authenticate, AuthRequest } from '../middleware/auth';

const router = Router();

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

// POST – Start mock exam
router.post('/courses/:courseId/mock-exam/start', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { courseId } = req.params;

    // Get course details
    const { data: course, error: courseError } = await supabaseAdmin
      .from('courses')
      .select('*')
      .eq('id', courseId)
      .eq('type', 'mock')
      .single();

    if (courseError || !course) {
      return res.status(404).json({ error: 'Mock exam course not found' });
    }

    // Get all questions for this course
    const { data: questions, error: questionsError } = await supabaseAdmin
      .from('questions')
      .select('id, question_text, options')
      .eq('course_id', courseId);

    if (questionsError) {
      return res.status(500).json({ error: questionsError.message });
    }

    // Return questions and time limit (60 minutes = 3600 seconds)
    res.json({
      course,
      questions: questions || [],
      timeLimit: 3600 // 60 minutes
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// POST – Submit mock exam
router.post('/mock-exam/submit', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { courseId, answers } = req.body;
    const userId = req.user?.id;

    if (!courseId || !answers) {
      return res.status(400).json({ error: 'courseId and answers are required' });
    }

    // Get all questions with correct answers
    const { data: questions, error: questionsError } = await supabaseAdmin
      .from('questions')
      .select('id, correct_index')
      .eq('course_id', courseId);

    if (questionsError) {
      return res.status(500).json({ error: questionsError.message });
    }

    if (!questions || questions.length === 0) {
      return res.status(404).json({ error: 'No questions found for this course' });
    }

    // Calculate score
    let correctAnswers = 0;
    questions.forEach((question) => {
      if (answers[question.id] !== undefined && answers[question.id] === question.correct_index) {
        correctAnswers++;
      }
    });

    const score = Math.round((correctAnswers / questions.length) * 100);
    const passingScore = 60;
    const isPassed = score >= passingScore;

    // Store exam result (optional - for future analytics)
    // You can add a results table later to store this data

    res.json({
      score,
      totalQuestions: questions.length,
      correctAnswers,
      isPassed,
      passingScore,
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// POST – Start exit exam
router.post('/courses/:courseId/exit-exam/start', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { courseId } = req.params;

    // Get course details
    const { data: course, error: courseError } = await supabaseAdmin
      .from('courses')
      .select('*')
      .eq('id', courseId)
      .eq('type', 'exit')
      .single();

    if (courseError || !course) {
      return res.status(404).json({ error: 'Exit exam course not found' });
    }

    // Get all questions for this course
    const { data: questions, error: questionsError } = await supabaseAdmin
      .from('questions')
      .select('id, question_text, options')
      .eq('course_id', courseId);

    if (questionsError) {
      return res.status(500).json({ error: questionsError.message });
    }

    // Return questions and time limit (90 minutes = 5400 seconds)
    res.json({
      course,
      questions: questions || [],
      timeLimit: 5400 // 90 minutes
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// POST – Submit exit exam
router.post('/exit-exam/submit', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { courseId, answers } = req.body;
    const userId = req.user?.id;

    if (!courseId || !answers) {
      return res.status(400).json({ error: 'courseId and answers are required' });
    }

    // Get all questions with correct answers
    const { data: questions, error: questionsError } = await supabaseAdmin
      .from('questions')
      .select('id, correct_index')
      .eq('course_id', courseId);

    if (questionsError) {
      return res.status(500).json({ error: questionsError.message });
    }

    if (!questions || questions.length === 0) {
      return res.status(404).json({ error: 'No questions found for this course' });
    }

    // Calculate score
    let correctAnswers = 0;
    questions.forEach((question) => {
      if (answers[question.id] !== undefined && answers[question.id] === question.correct_index) {
        correctAnswers++;
      }
    });

    const score = Math.round((correctAnswers / questions.length) * 100);
    const passingScore = 60;
    const isPassed = score >= passingScore;

    res.json({
      score,
      totalQuestions: questions.length,
      correctAnswers,
      isPassed,
      passingScore,
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
