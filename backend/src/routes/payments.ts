import { Router, Response } from 'express';
import { supabaseAdmin } from '../supabase';
import { authenticate, adminOnly, AuthRequest } from '../middleware/auth';

const router = Router();

router.get('/pending', authenticate, adminOnly, async (req: AuthRequest, res: Response) => {
  const { data, error } = await supabaseAdmin.from('payment_receipts').select('*, profiles(full_name, email)').eq('verified', false);
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

router.patch('/:id/verify', authenticate, adminOnly, async (req: AuthRequest, res: Response) => {
  const receiptId = req.params.id;
  const { data: receipt } = await supabaseAdmin.from('payment_receipts').select('user_id').eq('id', receiptId).single();
  if (!receipt) return res.status(404).json({ error: 'Receipt not found' });

  const { error } = await supabaseAdmin.from('payment_receipts').update({ verified: true }).eq('id', receiptId);
  if (error) return res.status(500).json({ error: error.message });

  const { error: unlockError } = await supabaseAdmin.from('user_courses').update({ is_locked: false }).eq('user_id', receipt.user_id);
  if (unlockError) return res.status(500).json({ error: unlockError.message });

  res.json({ message: 'Payment verified, courses unlocked' });
});

export default router;