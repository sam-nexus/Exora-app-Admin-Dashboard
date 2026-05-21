import { Router, Response } from 'express';
import { supabase } from '../supabase';
import { authenticate, adminOnly, AuthRequest } from '../middleware/auth';

const router = Router();

// Get all users (admin)
router.get('/', authenticate, adminOnly, async (req: AuthRequest, res: Response) => {
  const { data, error } = await supabase.from('profiles').select('*');
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

// Get single user by ID (admin)
router.get('/:id', authenticate, adminOnly, async (req: AuthRequest, res: Response) => {
  const userId = req.params.id as string;

  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();

  if (error) return res.status(404).json({ error: 'User not found' });
  res.json(data);
});

// Update user profile (admin)
router.put('/:id', authenticate, adminOnly, async (req: AuthRequest, res: Response) => {
  const userId = req.params.id as string;
  const { full_name, email } = req.body;

  // Build update object – only include provided fields
  const updates: any = {};
  if (full_name !== undefined) updates.full_name = full_name;
  if (email !== undefined) updates.email = email;

  if (Object.keys(updates).length === 0) {
    return res.status(400).json({ error: 'No valid fields to update' });
  }

  const { error } = await supabase
    .from('profiles')
    .update(updates)
    .eq('id', userId);

  if (error) return res.status(500).json({ error: error.message });
  res.json({ message: 'User updated' });
});

// Delete user (admin)
router.delete('/:id', authenticate, adminOnly, async (req: AuthRequest, res: Response) => {
  const userId = req.params.id as string;
  const { error } = await supabase.auth.admin.deleteUser(userId);
  if (error) return res.status(500).json({ error: error.message });
  res.json({ message: 'User deleted' });
});

export default router;