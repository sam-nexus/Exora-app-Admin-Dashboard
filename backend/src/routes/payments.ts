import { Router, Response } from 'express';
import multer from 'multer';
import { supabaseAdmin } from '../supabase';
import { authenticate, adminOnly, AuthRequest } from '../middleware/auth';

const upload = multer({ storage: multer.memoryStorage() });
const router = Router();

// Upload payment receipt (private bucket -> signed URL)
router.post('/', authenticate, upload.single('receipt'), async (req: AuthRequest, res: Response) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
    const userId = req.userId!;

    // 1. Upload file to private bucket
    const filePath = `receipts/${userId}/${Date.now()}-${req.file.originalname}`;
    const { error: uploadError } = await supabaseAdmin.storage
      .from('payment-receipts')
      .upload(filePath, req.file.buffer, {
        contentType: req.file.mimetype,
      });

    if (uploadError) throw uploadError;

    // 2. Generate a signed URL valid for 1 year (31536000 seconds)
    const { data: signedData, error: signedError } = await supabaseAdmin.storage
      .from('payment-receipts')
      .createSignedUrl(filePath, 31536000);

    if (signedError) throw signedError;
    const imageUrl = signedData.signedUrl;

    // 3. Insert record into database
    const { error: insertError } = await supabaseAdmin
      .from('payment_receipts')
      .insert({
        user_id: userId,
        image_url: imageUrl,
        verified: false,
      });

    if (insertError) throw insertError;

    res.status(201).json({ message: 'Receipt uploaded, waiting for verification' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Get pending payments (admin only)
router.get('/pending', authenticate, adminOnly, async (req: AuthRequest, res: Response) => {
  const { data, error } = await supabaseAdmin
    .from('payment_receipts')
    .select('*, profiles(full_name, email)')
    .eq('verified', false);

  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

// Verify a receipt and unlock courses (admin only)
router.patch('/:id/verify', authenticate, adminOnly, async (req: AuthRequest, res: Response) => {
  const receiptId = req.params.id;
  const { data: receipt } = await supabaseAdmin
    .from('payment_receipts')
    .select('user_id')
    .eq('id', receiptId)
    .single();

  if (!receipt) return res.status(404).json({ error: 'Receipt not found' });

  // Mark as verified
  const { error } = await supabaseAdmin
    .from('payment_receipts')
    .update({ verified: true })
    .eq('id', receiptId);
  if (error) return res.status(500).json({ error: error.message });

  // Unlock all courses for that user
  const { error: unlockError } = await supabaseAdmin
    .from('user_courses')
    .update({ is_locked: false })
    .eq('user_id', receipt.user_id);
  if (unlockError) return res.status(500).json({ error: unlockError.message });

  res.json({ message: 'Payment verified, courses unlocked' });
});

export default router;