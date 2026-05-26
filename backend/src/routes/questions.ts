import { Router, Response } from 'express';
import multer from 'multer';
import fs from 'fs';
import { supabaseAdmin } from '../supabase';
import { authenticate, adminOnly, AuthRequest } from '../middleware/auth';

const upload = multer({ dest: 'uploads/' });
const router = Router();

// List questions with optional filters (unchanged)
router.get('/', authenticate, async (req: AuthRequest, res: Response) => {
  let query = supabaseAdmin.from('questions').select('*, courses!inner(department_id)');
  const { course_id, department_id } = req.query;
  if (course_id) query = query.eq('course_id', course_id);
  if (department_id) query = query.eq('courses.department_id', department_id);
  const { data, error } = await query;
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

// Single add (unchanged)
router.post('/', authenticate, adminOnly, async (req: AuthRequest, res: Response) => {
  const { course_id, question_text, options, correct_index, explanation } = req.body;
  const { error } = await supabaseAdmin.from('questions').insert({
    course_id, question_text, options, correct_index, explanation
  });
  if (error) return res.status(500).json({ error: error.message });
  res.status(201).json({ message: 'Question added' });
});

// Bulk upload – **THIS IS THE UPDATED PART**
// Bulk upload – JSON format
router.post('/bulk', authenticate, adminOnly, upload.single('file'), async (req: AuthRequest, res: Response) => {
  if (!req.file) return res.status(400).json({ error: 'No file uploaded' });

  const courseId = req.body.course_id; // sent by frontend
  if (!courseId) return res.status(400).json({ error: 'Course ID is required' });

  try {
    // Read the uploaded file
    const fileContent = fs.readFileSync(req.file.path, 'utf-8');
    let questionsArray: any[];

    // Parse the JSON content
    try {
      questionsArray = JSON.parse(fileContent);
    } catch (parseErr) {
      return res.status(400).json({ error: 'Invalid JSON file. Please check the format.' });
    }

    // Validate that it's an array
    if (!Array.isArray(questionsArray)) {
      return res.status(400).json({ error: 'JSON file must contain an array of questions.' });
    }

    // Transform each item to match the database schema
    const questionsToInsert = questionsArray.map((item: any) => {
      const questionText = item.question || item.question_text || '';
      const options = item.options || [item.choice_a, item.choice_b, item.choice_c, item.choice_d].filter(Boolean);
      const correctIndex = item.correct_index ?? item.correctIndex ?? 0;
      const explanation = item.explanation || '';

      return {
        course_id: courseId,
        question_text: questionText,
        options: options,
        correct_index: correctIndex,
        explanation: explanation,
      };
    });

    // Insert all questions into the database
    const { error } = await supabaseAdmin.from('questions').insert(questionsToInsert);
    fs.unlinkSync(req.file.path); // clean up

    if (error) throw error;
    res.json({ message: `${questionsToInsert.length} questions uploaded` });
  } catch (err: any) {
    console.error('Bulk upload error:', err);
    res.status(500).json({ error: err.message });
  }
});

// Update a question (unchanged)
router.put('/:id', authenticate, adminOnly, async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const { question_text, options, correct_index, explanation } = req.body;
  const updates: any = {};
  if (question_text !== undefined) updates.question_text = question_text;
  if (options !== undefined) updates.options = options;
  if (correct_index !== undefined) updates.correct_index = correct_index;
  if (explanation !== undefined) updates.explanation = explanation;
  const { error } = await supabaseAdmin.from('questions').update(updates).eq('id', id);
  if (error) return res.status(500).json({ error: error.message });
  res.json({ message: 'Question updated' });
});

// Delete single question (unchanged)
router.delete('/:id', authenticate, adminOnly, async (req: AuthRequest, res: Response) => {
  const { error } = await supabaseAdmin.from('questions').delete().eq('id', req.params.id);
  if (error) return res.status(500).json({ error: error.message });
  res.json({ message: 'Question deleted' });
});

// Delete all questions for a course (unchanged)
router.delete('/course/:courseId', authenticate, adminOnly, async (req: AuthRequest, res: Response) => {
  const { error } = await supabaseAdmin.from('questions').delete().eq('course_id', req.params.courseId);
  if (error) return res.status(500).json({ error: error.message });
  res.json({ message: 'All questions for course deleted' });
});

export default router;