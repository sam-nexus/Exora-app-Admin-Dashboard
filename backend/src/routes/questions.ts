import { Router, Response } from 'express';
import multer from 'multer';
import csv from 'csv-parser';
import fs from 'fs';
import { supabase } from '../supabase';
import { authenticate, adminOnly, AuthRequest } from '../middleware/auth';

const upload = multer({ dest: 'uploads/' });

const router = Router();

// Single question add
router.post('/', authenticate, adminOnly, async (req: AuthRequest, res: Response) => {
  const { course_id, question_text, options, correct_index, explanation } = req.body;
  const { error } = await supabase.from('questions').insert({
    course_id,
    question_text,
    options,
    correct_index,
    explanation
  });
  if (error) return res.status(500).json({ error: error.message });
  res.status(201).json({ message: 'Question added' });
});

// Get question count
router.get('/count', authenticate, adminOnly, async (req, res) => {
  const { count, error } = await supabase.from('questions').select('*', { count: 'exact', head: true });
  if (error) return res.status(500).json({ error: error.message });
  res.json({ count });
});

// Bulk upload via CSV
router.post('/bulk', authenticate, adminOnly, upload.single('file'), async (req: AuthRequest, res: Response) => {
  if (!req.file) return res.status(400).json({ error: 'No file uploaded' });

  const results: any[] = [];
  fs.createReadStream(req.file.path)
    .pipe(csv())
    .on('data', (data) => results.push(data))
    .on('end', async () => {
      const questions = results.map(row => ({
        course_id: row.course_id,
        question_text: row.question_text,
        options: JSON.parse(row.options),  // expects JSON string in CSV
        correct_index: parseInt(row.correct_index),
        explanation: row.explanation
      }));

      const { error } = await supabase.from('questions').insert(questions);
      fs.unlinkSync(req.file!.path); // clean up
      if (error) return res.status(500).json({ error: error.message });
      res.json({ message: `${questions.length} questions uploaded` });
    });
});

export default router;