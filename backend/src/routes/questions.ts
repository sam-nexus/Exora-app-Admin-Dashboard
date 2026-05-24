import { Router, Response } from 'express';
import multer from 'multer';
import csv from 'csv-parser';
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
router.post('/bulk', authenticate, adminOnly, upload.single('file'), async (req: AuthRequest, res: Response) => {
  if (!req.file) return res.status(400).json({ error: 'No file uploaded' });

  const courseId = req.body.course_id; // sent by frontend
  if (!courseId) return res.status(400).json({ error: 'Course ID is required' });

  const results: any[] = [];
  fs.createReadStream(req.file.path)
    .pipe(csv())
    .on('data', (data) => results.push(data))
    .on('end', async () => {
      try {
        const questions = results.map(row => {
          // Build options array from the four choice columns
          const options = [
            row['Choice A'] || row['choice a'] || '',
            row['Choice B'] || row['choice b'] || '',
            row['Choice C'] || row['choice c'] || '',
            row['Choice D'] || row['choice d'] || '',
          ];

          // Convert answer letter (A-D) to 0-based index
          const answerLetter = (row['Answer'] || row['answer'] || '').trim().toUpperCase();
          const correctIndex = answerLetter && answerLetter >= 'A' && answerLetter <= 'D'
            ? answerLetter.charCodeAt(0) - 'A'.charCodeAt(0)
            : 0;

          return {
            course_id: courseId,
            question_text: row['Question'] || row['question'] || '',
            options: options,          // array, not JSON string – Supabase JSONB will accept it
            correct_index: correctIndex,
            explanation: row['Explanation'] || row['explanation'] || '',
          };
        });

        const { error } = await supabaseAdmin.from('questions').insert(questions);
        fs.unlinkSync(req.file!.path); // clean up

        if (error) throw error;
        res.json({ message: `${questions.length} questions uploaded` });
      } catch (err: any) {
        console.error('Bulk upload error:', err);
        res.status(500).json({ error: err.message });
      }
    });
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