import { Router, Response } from 'express';
import { supabaseAdmin } from '../supabase';
import { authenticate, adminOnly, AuthRequest } from '../middleware/auth';

const router = Router();

// Track a page view (no auth required)
router.post('/track', async (req: AuthRequest, res: Response) => {
  try {
    const { page, referrer, userAgent } = req.body;
    const ipAddress = req.ip || req.socket.remoteAddress;
    const userId = req.userId || null;

    const { error } = await supabaseAdmin
      .from('page_views')
      .insert({
        user_id: userId,
        page: page || '/',
        referrer: referrer || null,
        user_agent: userAgent || req.headers['user-agent'] || null,
        ip_address: ipAddress,
      });

    if (error) throw error;
    res.json({ message: 'Tracked' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Get analytics data (admin only)
router.get('/stats', authenticate, adminOnly, async (req: AuthRequest, res: Response) => {
  try {
    // Total views today
    const { count: todayViews } = await supabaseAdmin
      .from('page_views')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', new Date().toISOString().split('T')[0]);

    // Unique visitors today
    const { data: todayVisitors } = await supabaseAdmin
      .from('page_views')
      .select('user_id, ip_address')
      .gte('created_at', new Date().toISOString().split('T')[0]);

    const uniqueVisitors = new Set(
      todayVisitors?.map((v: any) => v.user_id || v.ip_address)
    ).size;

    // Last 7 days
    const { data: last7Days } = await supabaseAdmin
      .from('page_views')
      .select('created_at')
      .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString());

    // Group by date (fix: typed as Record<string, number>)
    const dailyMap: Record<string, number> = {};
    last7Days?.forEach((d: any) => {
      const date = new Date(d.created_at).toISOString().split('T')[0];
      if (!dailyMap[date]) {
        dailyMap[date] = 0;
      }
      dailyMap[date]++;
    });

    const dailyStats = Object.entries(dailyMap).map(([date, count]) => ({ date, count }));

    // Top pages
    const { data: topPages } = await supabaseAdmin
      .from('page_views')
      .select('page')
      .order('created_at', { ascending: false })
      .limit(1000);

    // Fix: typed as Record<string, number>
    const pageCounts: Record<string, number> = {};
    topPages?.forEach((p: any) => {
      const page = p.page || '/';
      if (!pageCounts[page]) {
        pageCounts[page] = 0;
      }
      pageCounts[page]++;
    });

    const sortedPages = Object.entries(pageCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .map(([page, count]) => ({ page, count }));

    // Total all-time views
    const { count: totalViews } = await supabaseAdmin
      .from('page_views')
      .select('*', { count: 'exact', head: true });

    res.json({
      todayViews: todayViews || 0,
      uniqueVisitors,
      totalViews: totalViews || 0,
      dailyStats,
      topPages: sortedPages,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Get recent visitors (admin only)
router.get('/recent-visitors', authenticate, adminOnly, async (req: AuthRequest, res: Response) => {
  try {
    const { data, error } = await supabaseAdmin
      .from('page_views')
      .select('*, profiles(full_name, email)')
      .order('created_at', { ascending: false })
      .limit(20);

    if (error) throw error;

    const visitors = (data || []).map((v: any) => ({
      id: v.id,
      page: v.page,
      user: v.profiles?.full_name || v.profiles?.email || 'Guest',
      ip: v.ip_address || 'Unknown',
      device: v.user_agent?.includes('Mobile') ? '📱 Mobile' : '💻 Desktop',
      time: v.created_at,
    }));

    res.json(visitors);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;