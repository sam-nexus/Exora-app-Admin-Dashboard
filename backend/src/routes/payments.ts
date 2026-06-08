import { Router, Response } from 'express';
import multer from 'multer';
import admin from '../firebase';
import { supabaseAdmin } from '../supabase';
import { authenticate, adminOnly, AuthRequest } from '../middleware/auth';

// Allowed image MIME types
const ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/gif',
  'image/webp',
  'image/bmp',
];

// Allowed file extensions
const ALLOWED_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.bmp'];

// File filter function
const fileFilter = (req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  // Check MIME type
  if (ALLOWED_MIME_TYPES.includes(file.mimetype)) {
    cb(null, true);
    return;
  }

  // Check extension as fallback
  const ext = file.originalname.toLowerCase().substring(file.originalname.lastIndexOf('.'));
  if (ALLOWED_EXTENSIONS.includes(ext)) {
    cb(null, true);
    return;
  }

  cb(new Error(`Invalid file type. Allowed types: ${ALLOWED_EXTENSIONS.join(', ')}`));
};

const upload = multer({
  storage: multer.memoryStorage(),
  fileFilter: fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB max
  },
});

const router = Router();

// Upload payment receipt
router.post('/', authenticate, upload.single('receipt'), async (req: AuthRequest, res: Response) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });

    const userId = req.userId!;

    // Get the file extension from original name
    const ext = req.file.originalname.substring(req.file.originalname.lastIndexOf('.'));
    const timestamp = Date.now();
    const filePath = `receipts/${userId}/${timestamp}${ext}`;

    // Upload to Supabase Storage
    const { error: uploadError } = await supabaseAdmin.storage
      .from('payment-receipts')
      .upload(filePath, req.file.buffer, {
        contentType: req.file.mimetype,
        upsert: false,
      });

    if (uploadError) throw uploadError;

    // Generate signed URL (valid for 1 year)
    const { data: signedData, error: signedError } = await supabaseAdmin.storage
      .from('payment-receipts')
      .createSignedUrl(filePath, 31536000);

    if (signedError) throw signedError;
    const imageUrl = signedData.signedUrl;

    // Insert record into database
    const { error: insertError } = await supabaseAdmin
      .from('payment_receipts')
      .insert({
        user_id: userId,
        image_url: imageUrl,
        status: 'pending',
      });

    if (insertError) throw insertError;

    // Notify admins
    const { data: admins, error: adminFetchError } = await supabaseAdmin
      .from('profiles')
      .select('id, device_tokens')
      .eq('role', 'admin');

    if (!adminFetchError && admins && admins.length > 0) {
      const adminNotifications = admins.map((admin: any) => ({
        recipient_id: admin.id,
        title: 'New payment receipt received',
        message: `A new payment receipt has been uploaded by a student. Please review and approve.`,
        link: '/admin/payments',
        notification_type: 'payment_received',
        data: { receiptId: null, userId: userId },
        is_read: false,
      }));
      await supabaseAdmin.from('notifications').insert(adminNotifications);

      // Send push notifications to admins
      const tokens = admins
        .flatMap((admin: any) => Array.isArray(admin.device_tokens) ? admin.device_tokens : [])
        .map((item: any) => item.token)
        .filter(Boolean);

      if (tokens.length && admin.apps && admin.apps.length > 0) {
        const payload = {
          notification: {
            title: 'New payment receipt received',
            body: 'A student has uploaded a payment receipt for approval.',
          },
          data: {
            link: '/admin/payments',
            type: 'payment_received',
          },
        };

        const chunkSize = 500;
        for (let i = 0; i < tokens.length; i += chunkSize) {
          const batch = tokens.slice(i, i + chunkSize);
          await admin.messaging().sendToDevice(batch, payload).catch((sendError: any) => {
            console.error('FCM send error:', sendError);
          });
        }
      }
    }

    res.status(201).json({ message: 'Receipt uploaded, waiting for verification' });
  } catch (err: any) {
    // Handle multer errors (file too large, invalid type)
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ error: 'File too large. Maximum size is 10MB.' });
    }
    if (err.message && err.message.includes('Invalid file type')) {
      return res.status(400).json({ error: err.message });
    }
    res.status(500).json({ error: err.message });
  }
});

// Get payments – filterable by status (default 'all')
router.get('/', authenticate, adminOnly, async (req: AuthRequest, res: Response) => {
  try {
    let query = supabaseAdmin
      .from('payment_receipts')
      .select('*, profiles(full_name, email)')  // No departments join
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
    const scope: 'department' | 'all' = req.body.scope === 'department' ? 'department' : 'all';

    const { data: receipt, error: fetchError } = await supabaseAdmin
      .from('payment_receipts')
      .select('user_id, status, department_id')
      .eq('id', receiptId)
      .single();

    if (fetchError || !receipt) return res.status(404).json({ error: 'Receipt not found' });
    if (receipt.status !== 'pending') return res.status(400).json({ error: 'Receipt is not pending' });

    const { error: updateError } = await supabaseAdmin
      .from('payment_receipts')
      .update({ status: 'approved' })
      .eq('id', receiptId);
    if (updateError) throw updateError;

    let unlockedScope = 'all courses';

    if (scope === 'department' && receipt.department_id) {
      const { data: deptCourses, error: deptError } = await supabaseAdmin
        .from('courses')
        .select('id')
        .eq('department_id', receipt.department_id);

      if (deptError) throw deptError;

      const courseIds = (deptCourses || []).map((c) => c.id);

      if (courseIds.length > 0) {
        const { error: unlockError } = await supabaseAdmin
          .from('user_courses')
          .update({ is_locked: false })
          .eq('user_id', receipt.user_id)
          .in('course_id', courseIds);
        if (unlockError) throw unlockError;
      }

      const { data: dept } = await supabaseAdmin
        .from('departments')
        .select('name')
        .eq('id', receipt.department_id)
        .single();

      unlockedScope = `courses in ${dept?.name || 'the selected department'}`;
    } else {
      const { error: unlockError } = await supabaseAdmin
        .from('user_courses')
        .update({ is_locked: false })
        .eq('user_id', receipt.user_id);
      if (unlockError) throw unlockError;
    }

    await supabaseAdmin.from('notifications').insert({
      recipient_id: receipt.user_id,
      title: 'Payment approved',
      message: `Your payment was approved and your ${unlockedScope} are now unlocked.`,
      link: '/student/payments',
      is_read: false,
    });

    res.json({ message: `Payment approved — ${unlockedScope} unlocked`, scope });
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
      .select('user_id, status')
      .eq('id', receiptId)
      .single();

    if (fetchError || !receipt) return res.status(404).json({ error: 'Receipt not found' });
    if (receipt.status !== 'pending') return res.status(400).json({ error: 'Receipt is not pending' });

    const { error: updateError } = await supabaseAdmin
      .from('payment_receipts')
      .update({ status: 'declined' })
      .eq('id', receiptId);
    if (updateError) throw updateError;

    await supabaseAdmin.from('notifications').insert({
      recipient_id: receipt.user_id,
      title: 'Payment declined',
      message: 'Your payment receipt was declined. Please upload a new receipt or contact support.',
      link: '/student/payments',
      is_read: false,
    });

    res.json({ message: 'Payment declined' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Get payment info (bank details with optional discount)
router.get('/info', authenticate, async (req: AuthRequest, res: Response) => {
  res.json({
    amount: '50 ETB',
    originalAmount: '100 ETB',
    discount: '50%',       // set to null to hide discount badge
    bank: 'Commercial Bank of Ethiopia (CBE)',
    accountNumber: '1000544142201',
    accountName: 'Samuel Birhanu',
  });
});

export default router;