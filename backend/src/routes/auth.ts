import { Router } from 'express';
import { supabase } from '../supabase';
import jwt from 'jsonwebtoken';

const router = Router();

// Register
router.post('/register', async (req, res) => {
  const { email, password, fullName } = req.body;
  try {
    // Create user in Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true
    });
    if (authError) throw authError;

    // Insert into profiles
    const { error: profileError } = await supabase
      .from('profiles')
      .insert({ id: authData.user.id, full_name: fullName, email });
    if (profileError) throw profileError;

    // Lock all courses for new user
    const { data: courses } = await supabase.from('courses').select('id');
    if (courses) {
      const locks = courses.map(c => ({ user_id: authData.user.id, course_id: c.id, is_locked: true }));
      await supabase.from('user_courses').insert(locks);
    }

    res.status(201).json({ message: 'User registered' });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// Login (returns custom JWT with role)
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  try {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;

    // Check if admin (hardcoded for now – you could have a roles table)
    const isAdmin = email === 'admin@exora.com';  // change as needed
    const token = jwt.sign(
      { sub: data.user.id, role: isAdmin ? 'admin' : 'user' },
      process.env.JWT_SECRET!,
      { expiresIn: '7d' }
    );

    res.json({ token, user: { id: data.user.id, email, role: isAdmin ? 'admin' : 'user' } });
  } catch (err: any) {
    res.status(401).json({ error: err.message });
  }
});

export default router;