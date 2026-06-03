import { Router, Response } from 'express';
import { supabaseAdmin } from '../supabase';
import { authenticate, adminOnly, AuthRequest } from '../middleware/auth';

const router = Router();

// GET – list all departments (any authenticated user)
router.get('/', authenticate, async (req: AuthRequest, res: Response) => {
  const { data, error } = await supabaseAdmin.from('departments').select('*');
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

// POST – create a new department
router.post('/', authenticate, adminOnly, async (req: AuthRequest, res: Response) => {
  const { name, icon } = req.body;
  const { data, error } = await supabaseAdmin.from('departments').insert({ name, icon }).select();
  if (error) return res.status(500).json({ error: error.message });
  res.status(201).json({ message: 'Department created', data: data?.[0] });
});

// PUT – update a department
router.put('/:id', authenticate, adminOnly, async (req: AuthRequest, res: Response) => {
  const { name, icon } = req.body;
  const updates: any = {};
  if (name !== undefined) updates.name = name;
  if (icon !== undefined) updates.icon = icon;
  const { error } = await supabaseAdmin.from('departments').update(updates).eq('id', req.params.id);
  if (error) return res.status(500).json({ error: error.message });
  res.json({ message: 'Department updated' });
});

// DELETE – remove a department
router.delete('/:id', authenticate, adminOnly, async (req: AuthRequest, res: Response) => {
  const { error } = await supabaseAdmin.from('departments').delete().eq('id', req.params.id);
  if (error) return res.status(500).json({ error: error.message });
  res.json({ message: 'Department deleted' });
});

export default router;