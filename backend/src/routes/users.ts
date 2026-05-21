import { Router, Response } from 'express';
import { supabaseAdmin } from '../supabase';
import { authenticate, adminOnly, AuthRequest } from '../middleware/auth';

const router = Router();

router.get('/', authenticate, adminOnly, async (req: AuthRequest, res: Response) => {
  const { data, error } = await supabaseAdmin.from('profiles').select('*');
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

router.get('/:id', authenticate, adminOnly, async (req: AuthRequest, res: Response) => {
  const userId = req.params.id as string;
  const { data, error } = await supabaseAdmin.from('profiles').select('*').eq('id', userId).single();
  if (error) return res.status(404).json({ error: 'User not found' });
  res.json(data);
});

router.put('/:id', authenticate, adminOnly, async (req: AuthRequest, res: Response) => {
  const userId = req.params.id as string;
  const { full_name, email } = req.body;
  const updates: any = {};
  if (full_name !== undefined) updates.full_name = full_name;
  if (email !== undefined) updates.email = email;
  if (Object.keys(updates).length === 0) return res.status(400).json({ error: 'No valid fields' });
  const { error } = await supabaseAdmin.from('profiles').update(updates).eq('id', userId);
  if (error) return res.status(500).json({ error: error.message });
  res.json({ message: 'User updated' });
});

router.delete('/:id', authenticate, adminOnly, async (req: AuthRequest, res: Response) => {
  const userId = req.params.id as string;
  const { error } = await supabaseAdmin.auth.admin.deleteUser(userId);
  if (error) return res.status(500).json({ error: error.message });
  res.json({ message: 'User deleted' });
});

export default router;