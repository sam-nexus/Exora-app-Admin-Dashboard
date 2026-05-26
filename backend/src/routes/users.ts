import { Router, Response } from 'express';
import { supabaseAdmin } from '../supabase';
import { authenticate, adminOnly, AuthRequest } from '../middleware/auth';

const router = Router();

// Get all users
router.get('/', authenticate, adminOnly, async (req: AuthRequest, res: Response) => {
  const { data, error } = await supabaseAdmin.from('profiles').select('*');
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

// Get single user
router.get('/:id', authenticate, adminOnly, async (req: AuthRequest, res: Response) => {
  const userId = req.params.id as string;
  const { data, error } = await supabaseAdmin.from('profiles').select('*').eq('id', userId).single();
  if (error) return res.status(404).json({ error: 'User not found' });
  res.json(data);
});

// Update user (self or admin)
router.put('/:id', authenticate, async (req: AuthRequest, res: Response) => {
  const userId = req.params.id as string;
  const { full_name, email, role } = req.body;

  // ---------- Determine if the requester is the user themselves ----------
  const isSelf = req.userId === userId;
  const isAdmin = req.role === 'admin';

  if (!isSelf && !isAdmin) {
    return res.status(403).json({ error: 'Forbidden' });
  }

  // ---------- Build updates ----------
  const updates: any = {};

  if (isAdmin) {
    // Admin can change any field
    if (full_name !== undefined) updates.full_name = full_name;
    if (email !== undefined) updates.email = email;
    if (role !== undefined) updates.role = role;
  } else {
    // Regular user can only change their own full_name
    if (full_name !== undefined) updates.full_name = full_name;
    // Explicitly forbid changing email / role
    if (email !== undefined || role !== undefined) {
      return res.status(403).json({ error: 'You can only change your name.' });
    }
  }

  if (Object.keys(updates).length === 0) {
    return res.status(400).json({ error: 'No valid fields' });
  }

  const { error } = await supabaseAdmin.from('profiles').update(updates).eq('id', userId);
  if (error) return res.status(500).json({ error: error.message });
  res.json({ message: 'User updated' });
});

// Delete user
router.delete('/:id', authenticate, adminOnly, async (req: AuthRequest, res: Response) => {
  const userId = req.params.id as string;
  const { error } = await supabaseAdmin.auth.admin.deleteUser(userId);
  if (error) return res.status(500).json({ error: error.message });
  res.json({ message: 'User deleted' });
});

// Admin create user (register)
router.post('/', authenticate, adminOnly, async (req: AuthRequest, res: Response) => {
  const { email, password, fullName } = req.body;
  let authUser: any = null;   // 👈 explicitly typed as any

  try {
    const { data, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });
    if (authError) throw authError;
    authUser = data.user;

    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .insert({ id: authUser.id, full_name: fullName, email });
    if (profileError) throw profileError;

    // Lock all courses for new user
    const { data: courses } = await supabaseAdmin.from('courses').select('id');
    if (courses && courses.length > 0) {
      const locks = courses.map(c => ({
        user_id: authUser.id,
        course_id: c.id,
        is_locked: true,
      }));
      await supabaseAdmin.from('user_courses').insert(locks);
    }
    res.status(201).json({ message: 'User created' });
  } catch (err: any) {
    if (authUser) {
      await supabaseAdmin.auth.admin.deleteUser(authUser.id);
    }
    res.status(400).json({ error: err.message });
  }
});

export default router;