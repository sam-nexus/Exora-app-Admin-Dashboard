import { Router, Response } from 'express';
import { supabaseAdmin } from '../supabase';
import { authenticate, adminOnly, AuthRequest } from '../middleware/auth';

const router = Router();

router.get('/', authenticate, adminOnly, async (req: AuthRequest, res: Response) => {
  const { data, error } = await supabaseAdmin.from('departments').select('*');
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

router.post('/', authenticate, adminOnly, async (req: AuthRequest, res: Response) => {
  const { name, icon } = req.body;
  const { error } = await supabaseAdmin.from('departments').insert({ name, icon });
  if (error) return res.status(500).json({ error: error.message });
  res.status(201).json({ message: 'Department created' });
});

router.put('/:id', authenticate, adminOnly, async (req: AuthRequest, res: Response) => {
  const { name, icon } = req.body;
  const updates: any = {};
  if (name !== undefined) updates.name = name;
  if (icon !== undefined) updates.icon = icon;
  const { error } = await supabaseAdmin.from('departments').update(updates).eq('id', req.params.id);
  if (error) return res.status(500).json({ error: error.message });
  res.json({ message: 'Department updated' });
});

router.delete('/:id', authenticate, adminOnly, async (req: AuthRequest, res: Response) => {
  const { error } = await supabaseAdmin.from('departments').delete().eq('id', req.params.id);
  if (error) return res.status(500).json({ error: error.message });
  res.json({ message: 'Department deleted' });
});

export default router;