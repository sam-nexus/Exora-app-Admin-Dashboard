import { Router, Response } from 'express';
import multer from 'multer';
import { supabaseAdmin } from '../supabase';
import { authenticate, adminOnly, AuthRequest } from '../middleware/auth';

const upload = multer({ storage: multer.memoryStorage() });
const router = Router();

// Upload payment receipt (unchanged, but sets status = 'pending')
router.post('/', authenticate, upload.single('receipt'), async (req: AuthRequest, res: Response) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
    const userId = req.userId!;

    const filePath = `receipts/${userId}/${Date.now()}-${req.file.originalname}`;
    const { error: uploadError } = await supabaseAdmin.storage
      .from('payment-receipts')
      .upload(filePath, req.file.buffer, { contentType: req.file.mimetype });

    if (uploadError) throw uploadError;

    const { data: signedData, error: signedError } = await supabaseAdmin.storage
      .from('payment-receipts')
      .createSignedUrl(filePath, 31536000);
    if (signedError) throw signedError;
    const imageUrl = signedData.signedUrl;

    const { error: insertError } = await supabaseAdmin
      .from('payment_receipts')
      .insert({
        user_id: userId,
        image_url: imageUrl,
        status: 'pending',
      });

    if (insertError) throw insertError;

    res.status(201).json({ message: 'Receipt uploaded, waiting for verification' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Get payments – filterable by status (default 'all')
router.get('/', authenticate, adminOnly, async (req: AuthRequest, res: Response) => {
  try {
    let query = supabaseAdmin
      .from('payment_receipts')
      .select('*, profiles(full_name, email)')
      .order('created_at', { ascending: false });

    const statusFilter = req.query.status as string;
    if (statusFilter && statusFilter !== 'all') {
      query = query.eq('status', statusFilter);
    }

    const { data, error } = await query;
    if (error) throw error;
    res.json(data);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Approve a payment
router.patch('/:id/approve', authenticate, adminOnly, async (req: AuthRequest, res: Response) => {
  try {
    const receiptId = req.params.id;

    // Get receipt
    const { data: receipt, error: fetchError } = await supabaseAdmin
      .from('payment_receipts')
      .select('user_id, status')
      .eq('id', receiptId)
      .single();

    if (fetchError || !receipt) return res.status(404).json({ error: 'Receipt not found' });
    if (receipt.status !== 'pending') return res.status(400).json({ error: 'Receipt is not pending' });

    // Update status to approved
    const { error: updateError } = await supabaseAdmin
      .from('payment_receipts')
      .update({ status: 'approved' })
      .eq('id', receiptId);
    if (updateError) throw updateError;

    // Unlock all courses for the user
    const { error: unlockError } = await supabaseAdmin
      .from('user_courses')
      .update({ is_locked: false })
      .eq('user_id', receipt.user_id);
    if (unlockError) throw unlockError;

    res.json({ message: 'Payment approved, courses unlocked' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Decline a payment
router.patch('/:id/decline', authenticate, adminOnly, async (req: AuthRequest, res: Response) => {
  try {
    const receiptId = req.params.id;

    const { data: receipt, error: fetchError } = await supabaseAdmin
      .from('payment_receipts')
      .select('status')
      .eq('id', receiptId)
      .single();

    if (fetchError || !receipt) return res.status(404).json({ error: 'Receipt not found' });
    if (receipt.status !== 'pending') return res.status(400).json({ error: 'Receipt is not pending' });

    const { error: updateError } = await supabaseAdmin
      .from('payment_receipts')
      .update({ status: 'declined' })
      .eq('id', receiptId);
    if (updateError) throw updateError;

    res.json({ message: 'Payment declined' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;