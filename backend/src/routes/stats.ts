import { Router, Response } from 'express';
import { supabaseAdmin } from '../supabase';
import { authenticate, adminOnly, AuthRequest } from '../middleware/auth';

const router = Router();

// Main stats
router.get('/', authenticate, adminOnly, async (req: AuthRequest, res: Response) => {
  try {
    const [{ count: usersCount }, { count: coursesCount }, { count: questionsCount }, { count: pendingPayments }] =
      await Promise.all([
        supabaseAdmin.from('profiles').select('*', { count: 'exact', head: true }),
        supabaseAdmin.from('courses').select('*', { count: 'exact', head: true }),
        supabaseAdmin.from('questions').select('*', { count: 'exact', head: true }),
        supabaseAdmin.from('payment_receipts').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
      ]);
    res.json({
      users: usersCount ?? 0,
      courses: coursesCount ?? 0,
      questions: questionsCount ?? 0,
      pendingPayments: pendingPayments ?? 0,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Users registered over time (last 30 days, grouped by day)
router.get('/users-over-time', authenticate, adminOnly, async (req: AuthRequest, res: Response) => {
  const { data, error } = await supabaseAdmin
    .from('profiles')
    .select('created_at');
  if (error) return res.status(500).json({ error: error.message });

  // Group by date (YYYY-MM-DD)
  const dateMap: Record<string, number> = {};
  data?.forEach((u: any) => {
    const date = new Date(u.created_at).toISOString().split('T')[0];
    dateMap[date] = (dateMap[date] || 0) + 1;
  });

  // Fill in missing days with 0
  const result: { date: string; count: number }[] = [];
  const today = new Date();
  for (let i = 29; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const key = d.toISOString().split('T')[0];
    result.push({ date: key, count: dateMap[key] || 0 });
  }
  res.json(result);
});

// Recent activity (last 5 registrations)
router.get('/recent-activity', authenticate, adminOnly, async (req: AuthRequest, res: Response) => {
  const { data, error } = await supabaseAdmin
    .from('profiles')
    .select('id, full_name, email, created_at')
    .order('created_at', { ascending: false })
    .limit(5);
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

export default router;