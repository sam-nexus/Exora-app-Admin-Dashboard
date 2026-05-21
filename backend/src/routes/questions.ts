import { Router, Response } from 'express';
import multer from 'multer';
import csv from 'csv-parser';
import fs from 'fs';
import { supabaseAdmin } from '../supabase';
import { authenticate, adminOnly, AuthRequest } from '../middleware/auth';

const upload = multer({ dest: 'uploads/' });
const router = Router();

router.post('/', authenticate, adminOnly, async (req: AuthRequest, res: Response) => {
  const { course_id, question_text, options, correct_index, explanation } = req.body;
  const { error } = await supabaseAdmin.from('questions').insert({ course_id, question_text, options, correct_index, explanation });
  if (error) return res.status(500).json({ error: error.message });
  res.status(201).json({ message: 'Question added' });
});

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
        options: JSON.parse(row.options),
        correct_index: parseInt(row.correct_index),
        explanation: row.explanation
      }));
      const { error } = await supabaseAdmin.from('questions').insert(questions);
      fs.unlinkSync(req.file!.path);
      if (error) return res.status(500).json({ error: error.message });
      res.json({ message: `${questions.length} questions uploaded` });
    });
});

export default router;