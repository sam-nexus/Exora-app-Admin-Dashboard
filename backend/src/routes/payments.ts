import { Router, Response } from 'express';
import { supabase } from '../supabase';
import { authenticate, adminOnly, AuthRequest } from '../middleware/auth';

const router = Router();

// Get unverified receipts
router.get('/pending', authenticate, adminOnly, async (req: AuthRequest, res: Response) => {
  const { data, error } = await supabase
    .from('payment_receipts')
    .select('*, profiles(full_name, email)')
    .eq('verified', false);
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

// Verify a receipt and unlock all courses for that user
router.patch('/:id/verify', authenticate, adminOnly, async (req: AuthRequest, res: Response) => {
  const receiptId = req.params.id;
  const { data: receipt } = await supabase
    .from('payment_receipts')
    .select('user_id')
    .eq('id', receiptId)
    .single();

  if (!receipt) return res.status(404).json({ error: 'Receipt not found' });

  // Mark as verified
  const { error } = await supabase
    .from('payment_receipts')
    .update({ verified: true })
    .eq('id', receiptId);
  if (error) return res.status(500).json({ error: error.message });

  // Unlock all courses for that user
  const { error: unlockError } = await supabase
    .from('user_courses')
    .update({ is_locked: false })
    .eq('user_id', receipt.user_id);
  if (unlockError) return res.status(500).json({ error: unlockError.message });

  res.json({ message: 'Payment verified, courses unlocked' });
});

export default router;