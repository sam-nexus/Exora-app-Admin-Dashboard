import { Router, Response } from 'express';
import { supabase } from '../supabase';
import { authenticate, adminOnly, AuthRequest } from '../middleware/auth';

const router = Router();

// Get courses for a user (with lock status)
router.get('/user/:userId', authenticate, async (req: AuthRequest, res: Response) => {
  const { userId } = req.params;
  // Ensure the requesting user is admin or the same user
  if (req.userId !== userId && req.role !== 'admin')
    return res.status(403).json({ error: 'Forbidden' });

  const { data, error } = await supabase
    .from('user_courses')
    .select('course_id, is_locked, courses(name, department_id, departments(name))')
    .eq('user_id', userId);

  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

// Get all courses (admin)
router.get('/all', authenticate, adminOnly, async (req, res) => {
  const { data } = await supabase.from('courses').select('*, departments(name)');
  res.json(data);
});

// Toggle lock/unlock (admin only)
router.patch('/:userCourseId/toggle', authenticate, adminOnly, async (req: AuthRequest, res: Response) => {
  const { userCourseId } = req.params;
  const { data: current } = await supabase
    .from('user_courses')
    .select('is_locked')
    .eq('id', userCourseId)
    .single();

  if (!current) return res.status(404).json({ error: 'Not found' });

  const { error } = await supabase
    .from('user_courses')
    .update({ is_locked: !current.is_locked })
    .eq('id', userCourseId);

  if (error) return res.status(500).json({ error: error.message });
  res.json({ message: 'Updated' });
});

export default router;