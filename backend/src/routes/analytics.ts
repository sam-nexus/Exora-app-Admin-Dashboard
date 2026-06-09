import { Router, Response } from 'express';
import fetch from 'node-fetch';
import { authenticate, adminOnly, AuthRequest } from '../middleware/auth';

const router = Router();

const MEASUREMENT_ID = process.env.GA_MEASUREMENT_ID || '';
const API_SECRET = process.env.GA_API_SECRET || '';

// Track a page view
const trackEvent = async (eventName: string, userId?: string) => {
    try {
        await fetch(
            `https://www.google-analytics.com/mp/collect?measurement_id=${MEASUREMENT_ID}&api_secret=${API_SECRET}`,
            {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    client_id: userId || 'admin-dashboard',
                    events: [{ name: eventName }],
                }),
            }
        );
    } catch (err) {
        // silent
    }
};

// GET – Dashboard analytics (returns basic counts from our own database)
router.get('/dashboard', authenticate, adminOnly, async (req: AuthRequest, res: Response) => {
    try {
        // Track this page view
        await trackEvent('admin_analytics_view', req.userId);

        // Return simple stats (you can expand this with your own database)
        res.json({
            message: 'Analytics tracking is active. Use Google Analytics dashboard for full reports.',
            gaLink: `https://analytics.google.com/analytics/web/#/p${process.env.GA_PROPERTY_ID}/reports`,
        });
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
});

export default router;