import { Router, Response } from 'express';
import jwt from 'jsonwebtoken';
import { supabaseAdmin, supabaseAnon } from '../supabase';

const router = Router();

// --------------------------------------------------
// Regular user registration (for mobile app users)
// --------------------------------------------------
router.post('/register', async (req, res) => {
  const { email, password, fullName } = req.body;
  let authUser: any = null;

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
      .insert({ id: authUser.id, full_name: fullName, email, role: 'user' });
    if (profileError) throw profileError;

    const { data: courses } = await supabaseAdmin.from('courses').select('id');
    if (courses && courses.length > 0) {
      const locks = courses.map(c => ({
        user_id: authUser.id,
        course_id: c.id,
        is_locked: true,
      }));
      await supabaseAdmin.from('user_courses').insert(locks);
    }

    res.status(201).json({ message: 'User registered' });
  } catch (err: any) {
    if (authUser) await supabaseAdmin.auth.admin.deleteUser(authUser.id);
    res.status(400).json({ error: err.message });
  }
});

// --------------------------------------------------
// Mobile app login (any role)
// --------------------------------------------------
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  try {
    const { data, error } = await supabaseAnon.auth.signInWithPassword({ email, password });
    if (error) throw error;

    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('role')
      .eq('id', data.user.id)
      .single();

    const role = profile?.role || 'user';

    const token = jwt.sign(
      { sub: data.user.id, role },
      process.env.JWT_SECRET!,
      { expiresIn: '7d' }
    );

    res.json({
      token,
      user: { id: data.user.id, email, role },
    });
  } catch (err: any) {
    res.status(401).json({ error: err.message });
  }
});

// --------------------------------------------------
// Admin dashboard login (role must be 'admin')
// --------------------------------------------------
router.post('/admin/login', async (req, res) => {
  const { email, password } = req.body;

  try {
    const { data, error } = await supabaseAnon.auth.signInWithPassword({ email, password });
    if (error) throw error;

    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('role')
      .eq('id', data.user.id)
      .single();

    if (profileError || !profile || profile.role !== 'admin') {
      return res.status(403).json({ error: 'Access denied. Admin only.' });
    }

    const token = jwt.sign(
      { sub: data.user.id, role: 'admin' },
      process.env.JWT_SECRET!,
      { expiresIn: '7d' }
    );

    res.json({
      token,
      user: { id: data.user.id, email, role: 'admin' },
    });
  } catch (err: any) {
    res.status(401).json({ error: err.message });
  }
});

export default router;