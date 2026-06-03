import { Router, Response } from 'express';
import { supabaseAdmin } from '../supabase';
import { authenticate, adminOnly, AuthRequest } from '../middleware/auth';

const router = Router();

// GET – list courses (any authenticated user)
router.get('/', authenticate, async (req: AuthRequest, res: Response) => {
  let query = supabaseAdmin.from('courses').select('*, departments(name)');
  const { department_id, type } = req.query;
  if (department_id) query = query.eq('department_id', department_id);
  if (type) query = query.eq('type', type);
  const { data, error } = await query;
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

// Add a new course – also inserts locked rows for all existing users
router.post('/', authenticate, adminOnly, async (req: AuthRequest, res: Response) => {
  const { department_id, name, type = 'regular' } = req.body;

  // Validate type
  if (!['regular', 'mock', 'exit'].includes(type)) {
    return res.status(400).json({ error: 'Invalid course type. Must be: regular, mock, or exit' });
  }

  try {
    // 1. Create the course
    const { data: course, error: insertError } = await supabaseAdmin
      .from('courses')
      .insert({ department_id, name, type })
      .select('id')
      .single();

    if (insertError || !course) {
      throw insertError || new Error('Failed to create course');
    }

    // 2. Fetch all user IDs from profiles
    const { data: users, error: usersError } = await supabaseAdmin
      .from('profiles')
      .select('id');

    if (usersError) throw usersError;

    // 3. Insert a locked row for every user (skip if no users)
    if (users && users.length > 0) {
      const locks = users.map(u => ({
        user_id: u.id,
        course_id: course.id,
        is_locked: type === 'regular' ? true : false,
      }));
      const { error: lockError } = await supabaseAdmin
        .from('user_courses')
        .insert(locks);
      if (lockError) throw lockError;
    }

    res.status(201).json({ message: 'Course added', courseId: course.id, type });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Edit a course
router.put('/:id', authenticate, adminOnly, async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const { name, department_id, type } = req.body;
  const updates: any = {};
  if (name !== undefined) updates.name = name;
  if (department_id !== undefined) updates.department_id = department_id;
  if (type !== undefined) {
    if (!['regular', 'mock', 'exit'].includes(type)) {
      return res.status(400).json({ error: 'Invalid course type. Must be: regular, mock, or exit' });
    }
    updates.type = type;
  }

  const { error } = await supabaseAdmin.from('courses').update(updates).eq('id', id);
  if (error) return res.status(500).json({ error: error.message });
  res.json({ message: 'Course updated' });
});

// Delete a course
router.delete('/:id', authenticate, adminOnly, async (req: AuthRequest, res: Response) => {
  const { error } = await supabaseAdmin.from('courses').delete().eq('id', req.params.id);
  if (error) return res.status(500).json({ error: error.message });
  res.json({ message: 'Course deleted' });
});

// Get user‑specific courses (lock status)
router.get('/user/:userId', authenticate, async (req: AuthRequest, res: Response) => {
  const { userId } = req.params;
  if (req.userId !== userId && req.role !== 'admin')
    return res.status(403).json({ error: 'Forbidden' });

  const { data, error } = await supabaseAdmin
    .from('user_courses')
    .select('course_id, is_locked, courses(name, department_id, departments(name))')
    .eq('user_id', userId);

  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

// Toggle lock for a specific user/course
router.patch('/:userCourseId/toggle', authenticate, adminOnly, async (req: AuthRequest, res: Response) => {
  const { userCourseId } = req.params;
  const { data: current } = await supabaseAdmin
    .from('user_courses')
    .select('is_locked')
    .eq('id', userCourseId)
    .single();

  if (!current) return res.status(404).json({ error: 'Not found' });

  const { error } = await supabaseAdmin
    .from('user_courses')
    .update({ is_locked: !current.is_locked })
    .eq('id', userCourseId);

  if (error) return res.status(500).json({ error: error.message });
  res.json({ message: 'Updated' });
});

// Lock all courses for a specific user
router.post('/lock-all/:userId', authenticate, adminOnly, async (req: AuthRequest, res: Response) => {
  const { userId } = req.params;
  try {
    const { error } = await supabaseAdmin
      .from('user_courses')
      .update({ is_locked: true })
      .eq('user_id', userId);
    if (error) throw error;
    res.json({ message: `All courses locked for user ${userId}` });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Lock all courses for all users
router.post('/lock-all-users', authenticate, adminOnly, async (req: AuthRequest, res: Response) => {
  try {
    const { data: users, error: usersError } = await supabaseAdmin
      .from('profiles')
      .select('id');
    if (usersError) throw usersError;

    const userIds = users?.map(u => u.id) || [];
    if (userIds.length === 0) {
      return res.json({ message: 'No users found' });
    }

    const { error } = await supabaseAdmin
      .from('user_courses')
      .update({ is_locked: true })
      .in('user_id', userIds);
    if (error) throw error;
    res.json({ message: `Locked courses for ${userIds.length} users` });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/toggle-all/:userId', authenticate, adminOnly, async (req: AuthRequest, res: Response) => {
  const { userId } = req.params;
  try {
    const { data: userCourses, error: fetchError } = await supabaseAdmin
      .from('user_courses')
      .select('is_locked')
      .eq('user_id', userId);
    if (fetchError) throw fetchError;

    const anyUnlocked = userCourses?.some(uc => uc.is_locked === false);
    const newLockState = anyUnlocked; // toggle correctly

    const { error: updateError } = await supabaseAdmin
      .from('user_courses')
      .update({ is_locked: newLockState })
      .eq('user_id', userId);
    if (updateError) throw updateError;

    res.json({ message: `All courses ${newLockState ? 'locked' : 'unlocked'} for user ${userId}` });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;