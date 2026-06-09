import { Router, Response } from 'express';
import fetch from 'node-fetch';
import { authenticate, adminOnly, AuthRequest } from '../middleware/auth';

const router = Router();

const PROPERTY_ID = process.env.GA_PROPERTY_ID || '';
const API_KEY = process.env.GA_API_KEY || '';

// Helper to call Google Analytics Data API
const runReport = async (dimensions: any[], metrics: any[], dateRanges: any[]) => {
  const url = `https://analyticsdata.googleapis.com/v1beta/properties/${PROPERTY_ID}:runReport?key=${API_KEY}`;
  
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      dimensions,
      metrics,
      dateRanges,
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error?.message || 'Analytics API error');
  }

  return response.json();
};

// GET – Dashboard analytics for admin
router.get('/dashboard', authenticate, adminOnly, async (req: AuthRequest, res: Response) => {
  try {
    // Active users today
    const activeUsersData = await runReport(
      [],
      [{ name: 'activeUsers' }],
      [{ startDate: 'today', endDate: 'today' }]
    );

    // Page views last 7 days
    const pageViewsData = await runReport(
      [{ name: 'date' }],
      [{ name: 'screenPageViews' }],
      [{ startDate: '7daysAgo', endDate: 'today' }]
    );

    // Device breakdown
    const deviceData = await runReport(
      [{ name: 'deviceCategory' }],
      [{ name: 'activeUsers' }],
      [{ startDate: '7daysAgo', endDate: 'today' }]
    );

    // Country breakdown (top 5)
    const countryData = await runReport(
      [{ name: 'country' }],
      [{ name: 'activeUsers' }],
      [{ startDate: '7daysAgo', endDate: 'today' }]
    );

    // Top pages
    const topPagesData = await runReport(
      [{ name: 'pagePath' }],
      [{ name: 'screenPageViews' }],
      [{ startDate: '7daysAgo', endDate: 'today' }]
    );

    // Format active users
    const todayActive = activeUsersData?.rows?.[0]?.metricValues?.[0]?.value || '0';

    // Format daily views
    const dailyViews = (pageViewsData?.rows || []).map((row: any) => ({
      date: row.dimensionValues?.[0]?.value || '',
      views: parseInt(row.metricValues?.[0]?.value || '0'),
    }));

    // Format devices
    const deviceStats = (deviceData?.rows || []).map((row: any) => ({
      device: row.dimensionValues?.[0]?.value || 'Unknown',
      users: parseInt(row.metricValues?.[0]?.value || '0'),
    }));

    // Format countries (top 5)
    const countryStats = (countryData?.rows || [])
      .slice(0, 5)
      .map((row: any) => ({
        country: row.dimensionValues?.[0]?.value || 'Unknown',
        users: parseInt(row.metricValues?.[0]?.value || '0'),
      }));

    // Format top pages
    const topPages = (topPagesData?.rows || [])
      .slice(0, 5)
      .map((row: any) => ({
        page: row.dimensionValues?.[0]?.value || '/',
        views: parseInt(row.metricValues?.[0]?.value || '0'),
      }));

    res.json({
      todayActive,
      dailyViews,
      deviceStats,
      countryStats,
      topPages,
    });
  } catch (err: any) {
    console.error('Analytics error:', err.message);
    res.json({
      todayActive: 'N/A',
      dailyViews: [],
      deviceStats: [],
      countryStats: [],
      topPages: [],
      error: err.message,
    });
  }
});

export default router;