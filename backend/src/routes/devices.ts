import { Router, Response } from 'express';
import { supabaseAdmin } from '../supabase';
import { authenticate, AuthRequest } from '../middleware/auth';

const router = Router();

router.post('/register', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId!;
    const { token, platform } = req.body;

    if (!token) {
      return res.status(400).json({ error: 'Device token is required.' });
    }

    const { data: profile, error } = await supabaseAdmin
      .from('profiles')
      .select('device_tokens')
      .eq('id', userId)
      .single();

    if (error) throw error;

    const existingTokens = Array.isArray(profile?.device_tokens) ? profile.device_tokens : [];
    const normalizedTokens = existingTokens.filter((item: any) => item.token !== token);

    normalizedTokens.push({
      token,
      platform: platform || 'unknown',
      added_at: new Date().toISOString(),
    });

    const { error: updateError } = await supabaseAdmin
      .from('profiles')
      .update({ device_tokens: normalizedTokens })
      .eq('id', userId);

    if (updateError) throw updateError;

    res.status(200).json({ message: 'Device token registered successfully.' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
