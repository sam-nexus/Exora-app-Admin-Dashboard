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
  const { department_id, name, type, is_free } = req.body;
  const courseType = type || 'regular';
  const isFree = is_free || false;

  try {
    // 1. Create the course
    const { data: course, error: insertError } = await supabaseAdmin
      .from('courses')
      .insert({ department_id, name, type: courseType, is_free: isFree })
      .select('id')
      .single();

    if (insertError || !course) throw insertError || new Error('Failed to create course');

    // 2. Get ALL users
    const { data: users, error: usersError } = await supabaseAdmin
      .from('profiles')
      .select('id');
    if (usersError) throw usersError;

    // 3. Insert user_courses rows – free courses are unlocked, paid are locked
    if (users && users.length > 0) {
      const locks = users.map(u => ({
        user_id: u.id,
        course_id: course.id,
        is_locked: !isFree, // free courses are unlocked (false), paid are locked (true)
      }));
      const { error: lockError } = await supabaseAdmin
        .from('user_courses')
        .insert(locks);
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
  const { name, department_id, type, is_free } = req.body;
  const updates: any = {};
  if (name !== undefined) updates.name = name;
  if (department_id !== undefined) updates.department_id = department_id;
  if (type !== undefined) updates.type = type;
  if (is_free !== undefined) updates.is_free = is_free;

  const { error } = await supabaseAdmin.from('courses').update(updates).eq('id', id);
  if (error) return res.status(500).json({ error: error.message });

  // If course is now free, unlock it for ALL users
  if (is_free === true) {
    await supabaseAdmin
      .from('user_courses')
      .update({ is_locked: false })
      .eq('course_id', id);
  }

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
    .select('course_id, is_locked, courses(id, name, department_id, type, is_free, departments(name))')  // ← added is_free
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
    // Get all paid course IDs
    const { data: paidCourses, error: coursesError } = await supabaseAdmin
      .from('courses')
      .select('id')
      .eq('is_free', false);
    if (coursesError) throw coursesError;

    const paidCourseIds = (paidCourses || []).map(c => c.id);

    if (paidCourseIds.length === 0) {
      return res.json({ message: 'No paid courses to lock.' });
    }

    const { error } = await supabaseAdmin
      .from('user_courses')
      .update({ is_locked: true })
      .eq('user_id', userId)
      .in('course_id', paidCourseIds);

    if (error) throw error;
    res.json({ message: `All paid courses locked for user ${userId}. Free courses remain unlocked.` });
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

    // Get all paid course IDs
    const { data: paidCourses, error: coursesError } = await supabaseAdmin
      .from('courses')
      .select('id')
      .eq('is_free', false);
    if (coursesError) throw coursesError;

    const paidCourseIds = (paidCourses || []).map(c => c.id);

    if (paidCourseIds.length === 0) {
      return res.json({ message: 'No paid courses to lock.' });
    }

    const { error } = await supabaseAdmin
      .from('user_courses')
      .update({ is_locked: true })
      .in('user_id', userIds)
      .in('course_id', paidCourseIds);

    if (error) throw error;
    res.json({ message: `Locked paid courses for ${userIds.length} users. Free courses remain unlocked.` });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/toggle-all/:userId', authenticate, adminOnly, async (req: AuthRequest, res: Response) => {
  const { userId } = req.params;
  try {
    // Get ALL courses (including free ones)
    const { data: allCourses, error: coursesError } = await supabaseAdmin
      .from('courses')
      .select('id, is_free');
    if (coursesError) throw coursesError;

    if (!allCourses || allCourses.length === 0) {
      return res.json({ message: 'No courses exist in the system yet.' });
    }

    // Separate free and paid courses
    const paidCourseIds = allCourses.filter(c => !c.is_free).map(c => c.id);
    const freeCourseIds = allCourses.filter(c => c.is_free).map(c => c.id);

    // Get existing user_courses for this user
    const { data: existingUserCourses, error: fetchError } = await supabaseAdmin
      .from('user_courses')
      .select('course_id')
      .eq('user_id', userId);
    if (fetchError) throw fetchError;

    const existingCourseIds = (existingUserCourses || []).map(uc => uc.course_id);

    // Insert missing rows for ALL courses (free courses should always be unlocked)
    const missingPaidIds = paidCourseIds.filter(id => !existingCourseIds.includes(id));
    const missingFreeIds = freeCourseIds.filter(id => !existingCourseIds.includes(id));

    if (missingPaidIds.length > 0 || missingFreeIds.length > 0) {
      const newRows: any[] = [];

      // Paid courses — insert as locked (will be toggled below)
      missingPaidIds.forEach(courseId => {
        newRows.push({ user_id: userId, course_id: courseId, is_locked: true });
      });

      // Free courses — always insert as unlocked
      missingFreeIds.forEach(courseId => {
        newRows.push({ user_id: userId, course_id: courseId, is_locked: false });
      });

      if (newRows.length > 0) {
        const { error: insertError } = await supabaseAdmin
          .from('user_courses')
          .insert(newRows);
        if (insertError) throw insertError;
      }
    }

    // Now check lock status of PAID courses only (free courses are always unlocked)
    const { data: paidUserCourses, error: refreshError } = await supabaseAdmin
      .from('user_courses')
      .select('is_locked')
      .eq('user_id', userId)
      .in('course_id', paidCourseIds);
    if (refreshError) throw refreshError;

    // If any PAID course is unlocked → lock all PAID courses
    // If all PAID courses are locked → unlock all PAID courses
    const anyPaidUnlocked = paidUserCourses?.some(uc => uc.is_locked === false);
    const newLockState = anyPaidUnlocked ? true : false; // true = lock, false = unlock

    // Only update PAID courses — free courses remain untouched
    if (paidCourseIds.length > 0) {
      const { error: updateError } = await supabaseAdmin
        .from('user_courses')
        .update({ is_locked: newLockState })
        .eq('user_id', userId)
        .in('course_id', paidCourseIds);
      if (updateError) throw updateError;
    }

    res.json({ message: `All paid courses ${newLockState ? 'locked' : 'unlocked'} for user ${userId}. Free courses remain unlocked.` });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;