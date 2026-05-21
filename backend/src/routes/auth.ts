import { Router, Response } from 'express';
import jwt from 'jsonwebtoken';
import { supabaseAdmin, supabaseAnon } from '../supabase';

const router = Router();

// --------------------------------------------------
// Register
// --------------------------------------------------
router.post('/register', async (req, res) => {
  const { email, password, fullName } = req.body;
  let authUser: any = null; // 👈 explicitly typed

  try {
    // 1. Create the user in Supabase Auth (admin rights)
    const { data, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });
    if (authError) throw authError;
    authUser = data.user;

    // 2. Insert into the profiles table
    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .insert({ id: authUser.id, full_name: fullName, email });
    if (profileError) throw profileError;

    // 3. Lock every course for the new user
    const { data: courses } = await supabaseAdmin.from('courses').select('id');
    if (courses && courses.length > 0) {
      const locks = courses.map((c) => ({
        user_id: authUser.id,
        course_id: c.id,
        is_locked: true,
      }));
      const { error: lockError } = await supabaseAdmin.from('user_courses').insert(locks);
      if (lockError) throw lockError;
    }

    res.status(201).json({ message: 'User registered' });
  } catch (err: any) {
    // Clean up auth user if any later step failed
    if (authUser) {
      await supabaseAdmin.auth.admin.deleteUser(authUser.id);
    }
    res.status(400).json({ error: err.message });
  }
});

// --------------------------------------------------
// Login
// --------------------------------------------------
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  try {
    // Use the anon client – signInWithPassword requires the public key
    const { data, error } = await supabaseAnon.auth.signInWithPassword({
      email,
      password,
    });
    if (error) throw error;

    // Determine role (hardcoded for now, extend as needed)
    const isAdmin = email === 'admin@exora.com';

    // Generate our own JWT (valid for 7 days)
    const token = jwt.sign(
      { sub: data.user.id, role: isAdmin ? 'admin' : 'user' },
      process.env.JWT_SECRET!,
      { expiresIn: '7d' }
    );

    res.json({
      token,
      user: {
        id: data.user.id,
        email,
        role: isAdmin ? 'admin' : 'user',
      },
    });
  } catch (err: any) {
    res.status(401).json({ error: err.message });
  }
});

export default router;