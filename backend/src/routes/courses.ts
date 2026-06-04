import { Router, Response } from 'express';
import { supabaseAdmin } from '../supabase';
import { authenticate, adminOnly, AuthRequest } from '../middleware/auth';

import multer from 'multer';
const materialUpload = multer({ storage: multer.memoryStorage() });

const router = Router();

// Get courses (optionally filtered by department_id and type)
router.get('/', authenticate, async (req: AuthRequest, res: Response) => {
  let query = supabaseAdmin.from('courses').select('*, departments(name)');
  const { department_id, type } = req.query;
  if (department_id) query = query.eq('department_id', department_id);
  if (type) query = query.eq('type', type);
  const { data, error } = await query;
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

// Add a new course
router.post('/', authenticate, adminOnly, async (req: AuthRequest, res: Response) => {
  const { department_id, name, type } = req.body;
  const courseType = type || 'regular';

  try {
    // 1. Create the course
    const { data: course, error: insertError } = await supabaseAdmin
      .from('courses')
      .insert({ department_id, name, type: courseType })
      .select('id')
      .single();

    if (insertError || !course) throw insertError || new Error('Failed to create course');

    // 2. Get ALL users
    const { data: users, error: usersError } = await supabaseAdmin
      .from('profiles')
      .select('id');
    if (usersError) throw usersError;

    if (users && users.length > 0) {
      // 3. For each user, determine if their existing courses are unlocked
      const userRows = [];

      for (const user of users) {
        // Check if this user has any existing courses and their lock status
        const { data: existingCourses } = await supabaseAdmin
          .from('user_courses')
          .select('is_locked')
          .eq('user_id', user.id);

        // Determine lock status for the new course:
        // - If user has NO existing courses → lock the new course (default)
        // - If user has any EXISTING course that is UNLOCKED → unlock the new course
        // - If ALL existing courses are LOCKED → lock the new course
        let isLocked = true; // default: locked

        if (existingCourses && existingCourses.length > 0) {
          const anyUnlocked = existingCourses.some(uc => uc.is_locked === false);
          if (anyUnlocked) {
            isLocked = false; // user already has unlocked courses, so unlock the new one
          }
        }

        userRows.push({
          user_id: user.id,
          course_id: course.id,
          is_locked: isLocked,
        });
      }

      // 4. Insert all user_courses rows
      const { error: lockError } = await supabaseAdmin
        .from('user_courses')
        .insert(userRows);
      if (lockError) throw lockError;
    }

    res.status(201).json({ message: 'Course added', courseId: course.id });
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
  if (type !== undefined) updates.type = type;

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

// Get course materials
router.get('/:courseId/materials', authenticate, async (req: AuthRequest, res: Response) => {
  const { courseId } = req.params;
  const { data, error } = await supabaseAdmin
    .from('course_materials')
    .select('*')
    .eq('course_id', courseId)
    .order('created_at', { ascending: false });
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

// Add course material (admin only)
router.post('/:courseId/materials', authenticate, adminOnly, async (req: AuthRequest, res: Response) => {
  const { courseId } = req.params;
  const { title, file_url } = req.body;
  const { error } = await supabaseAdmin
    .from('course_materials')
    .insert({ course_id: courseId, title, file_url });
  if (error) return res.status(500).json({ error: error.message });
  res.status(201).json({ message: 'Material added' });
});

// Delete course material (admin only)
router.delete('/materials/:id', authenticate, adminOnly, async (req: AuthRequest, res: Response) => {
  const { error } = await supabaseAdmin
    .from('course_materials')
    .delete()
    .eq('id', req.params.id);
  if (error) return res.status(500).json({ error: error.message });
  res.json({ message: 'Material deleted' });
});


// Upload course material with file (admin only)
router.post('/:courseId/materials/upload', authenticate, adminOnly, materialUpload.single('file'), async (req: AuthRequest, res: Response) => {
  try {
    const { courseId } = req.params;
    const title = req.body.title || 'Untitled Material';

    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    // Upload to Supabase Storage
    const filePath = `materials/${courseId}/${Date.now()}-${req.file.originalname}`;
    const { error: uploadError } = await supabaseAdmin.storage
      .from('course-materials') // or create a new bucket 'course-materials'
      .upload(filePath, req.file.buffer, {
        contentType: req.file.mimetype,
      });

    if (uploadError) throw uploadError;

    // Get signed URL (valid for 1 year)
    const { data: signedData, error: signedError } = await supabaseAdmin.storage
      .from('course-materials')
      .createSignedUrl(filePath, 31536000);

    if (signedError) throw signedError;

    // Insert record into course_materials table
    const { error: insertError } = await supabaseAdmin
      .from('course_materials')
      .insert({
        course_id: courseId,
        title: title,
        file_url: signedData.signedUrl,
      });

    if (insertError) throw insertError;

    res.status(201).json({ message: 'Material uploaded successfully' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
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