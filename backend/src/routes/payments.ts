import { Router, Response } from 'express';
import multer from 'multer';
import admin from '../firebase';
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

      if (tokens.length && admin.apps.length > 0) {
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
          await admin.messaging().sendToDevice(batch, payload).catch((sendError) => {
            console.error('FCM send error:', sendError);
          });
        }
      }
    }

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
      .select('*, profiles(full_name, email), departments(name)')
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
// Body: { scope: 'department' | 'all' }
// - 'department': unlocks only courses in the receipt's department_id
// - 'all'       : unlocks every course for the user (legacy / general access)
router.patch('/:id/approve', authenticate, adminOnly, async (req: AuthRequest, res: Response) => {
  try {
    const receiptId = req.params.id;
    const scope: 'department' | 'all' = req.body.scope === 'department' ? 'department' : 'all';

    // Get receipt including department_id
    const { data: receipt, error: fetchError } = await supabaseAdmin
      .from('payment_receipts')
      .select('user_id, status, department_id')
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

    let unlockedScope = 'all courses';

    if (scope === 'department' && receipt.department_id) {
      // Get all course IDs in this department
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

      // Get department name for notification
      const { data: dept } = await supabaseAdmin
        .from('departments')
        .select('name')
        .eq('id', receipt.department_id)
        .single();

      unlockedScope = `courses in ${dept?.name || 'the selected department'}`;
    } else {
      // Unlock ALL courses for the user
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

    res.json({
      message: `Payment approved — ${unlockedScope} unlocked`,
      scope,
    });
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

export default router;