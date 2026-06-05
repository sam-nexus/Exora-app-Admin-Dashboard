import { Router, Response } from 'express';
import { supabaseAdmin } from '../supabase';
import { authenticate, AuthRequest } from '../middleware/auth';

const router = Router();

// Submit a support ticket
router.post('/', authenticate, async (req: AuthRequest, res: Response) => {
  const { subject, message } = req.body;
  const userId = req.userId!;

  if (!subject || !message) {
    return res.status(400).json({ error: 'Subject and message are required.' });
  }

  try {
    const { error } = await supabaseAdmin
      .from('support_tickets')
      .insert({
        user_id: userId,
        subject,
        message,
        status: 'open',
      });

    if (error) throw error;
    res.status(201).json({ message: 'Support ticket submitted successfully.' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Get user's tickets
router.get('/my', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { data, error } = await supabaseAdmin
      .from('support_tickets')
      .select('*')
      .eq('user_id', req.userId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    res.json(data);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;