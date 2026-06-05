import { Router, Response } from 'express';
import { supabaseAdmin } from '../supabase';
import { authenticate, adminOnly, AuthRequest } from '../middleware/auth';

const router = Router();

// Submit a support ticket (any authenticated user)
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

    // Notify admins
    const { data: admins } = await supabaseAdmin
      .from('profiles')
      .select('id')
      .eq('role', 'admin');

    if (admins && admins.length > 0) {
      const notifications = admins.map((admin: any) => ({
        recipient_id: admin.id,
        title: 'New Support Ticket',
        message: `A new support ticket has been submitted: "${subject}"`,
        notification_type: 'support_ticket',
        is_read: false,
      }));
      await supabaseAdmin.from('notifications').insert(notifications);
    }

    res.status(201).json({ message: 'Support ticket submitted successfully.' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Get user's own tickets
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

// Admin: Get all tickets (with user info)
router.get('/all', authenticate, adminOnly, async (req: AuthRequest, res: Response) => {
  try {
    let query = supabaseAdmin
      .from('support_tickets')
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

// Admin: Update ticket status
router.patch('/:id/status', authenticate, adminOnly, async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const { status } = req.body;

  try {
    const { error } = await supabaseAdmin
      .from('support_tickets')
      .update({ status })
      .eq('id', id);

    if (error) throw error;
    res.json({ message: 'Ticket status updated.' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Admin: Add admin reply to ticket
router.post('/:id/reply', authenticate, adminOnly, async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const { reply } = req.body;

  try {
    const { error } = await supabaseAdmin
      .from('support_tickets')
      .update({ admin_reply: reply, status: 'closed', replied_at: new Date().toISOString() })
      .eq('id', id);

    if (error) throw error;

    // Get ticket to notify user
    const { data: ticket } = await supabaseAdmin
      .from('support_tickets')
      .select('user_id, subject')
      .eq('id', id)
      .single();

    if (ticket) {
      await supabaseAdmin.from('notifications').insert({
        recipient_id: ticket.user_id,
        title: 'Support Ticket Updated',
        message: `Your ticket "${ticket.subject}" has been resolved.`,
        notification_type: 'support_resolved',
        is_read: false,
      });
    }

    res.json({ message: 'Reply sent and ticket closed.' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;