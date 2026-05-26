import { Router, Response } from 'express';
import jwt from 'jsonwebtoken';
import nodemailer from 'nodemailer';
import { supabaseAdmin, supabaseAnon } from '../supabase';
import { authenticate, adminOnly, AuthRequest } from '../middleware/auth';

const router = Router();

// --------------- Email transporter ---------------
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST || 'smtp.gmail.com',
  port: Number(process.env.EMAIL_PORT) || 587,
  secure: false, // true for 465
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// --------------------------------------------------
// Regular user registration (unchanged)
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
      .select('role, full_name')
      .eq('id', data.user.id)
      .single();

    const role = profile?.role || 'user';
    const fullName = profile?.full_name || '';

    const token = jwt.sign(
      { sub: data.user.id, role },
      process.env.JWT_SECRET!,
      { expiresIn: '7d' }
    );

    res.json({
      token,
      user: { id: data.user.id, email, role, full_name: fullName },
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

// --------------------------------------------------
// Admin forgot password (link‑based) – unchanged
// --------------------------------------------------
router.post('/admin/forgot-password', async (req, res) => {
  const { email } = req.body;
  try {
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('role')
      .eq('email', email)
      .single();

    if (profileError || !profile || profile.role !== 'admin') {
      return res.status(404).json({ error: 'No admin account found with that email.' });
    }

    const { error } = await supabaseAnon.auth.resetPasswordForEmail(email, {
      redirectTo: 'https://exora-admin.netlify.app/reset-password', // your Netlify admin URL
    });
    if (error) throw error;

    res.json({ message: 'Reset link sent. Please check your email.' });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// --------------------------------------------------
// Mobile code‑based forgot password
// --------------------------------------------------

// Step 1: Generate code and send email
router.post('/mobile/forgot-password', async (req, res) => {
  const { email } = req.body;
  try {
    // Generate a 6‑digit code
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 20 * 60 * 1000); // 20 minutes

    // Store in DB
    const { error } = await supabaseAdmin
      .from('password_reset_codes')
      .insert({ email, code, expires_at: expiresAt.toISOString() });
    if (error) throw error;

    // Send email
    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: email,
      subject: 'Exora Password Reset Code',
      text: `Your password reset code is: ${code}\n\nThis code expires in 20 minutes.`,
      html: `<p>Your password reset code is: <strong>${code}</strong></p><p>This code expires in 20 minutes.</p>`,
    });

    res.json({ message: 'A verification code has been sent to your email.' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});
router.post('/mobile/verify-reset-code', async (req, res) => {
  const { email, code } = req.body;
  console.log(`🔎 Verify request: email=${email}, code=${code}`);

  try {
    const { data, error } = await supabaseAdmin
      .from('password_reset_codes')
      .select('*')
      .eq('email', email)
      .eq('code', code)
      .eq('used', false)
      .order('created_at', { ascending: false })
      .limit(1);

    console.log('📦 DB response:', { data, error });

    if (error || !data || data.length === 0) {
      // Fetch the latest code for this email to see what was stored (debug only)
      const { data: latestCode } = await supabaseAdmin
        .from('password_reset_codes')
        .select('code')
        .eq('email', email)
        .order('created_at', { ascending: false })
        .limit(1);
      console.log(`🔐 Latest stored code for ${email}:`, latestCode?.[0]?.code);

      return res.status(400).json({ error: 'Invalid or expired code.' });
    }

    const record = data[0];
    console.log(`⏰ Code expires at: ${record.expires_at}, now: ${new Date().toISOString()}`);

    if (new Date(record.expires_at) < new Date()) {
      return res.status(400).json({ error: 'Code has expired. Please request a new one.' });
    }

    await supabaseAdmin.from('password_reset_codes').update({ used: true }).eq('id', record.id);
    console.log('✅ Code verified successfully');
    res.json({ message: 'Code verified. You can now reset your password.' });
  } catch (err: any) {
    console.error('❌ Error in verify-reset-code:', err);
    res.status(500).json({ error: err.message });
  }
});

// Step 3: Reset password using the verified code
router.post('/mobile/reset-password', async (req, res) => {
  const { email, code, newPassword } = req.body;
  try {
    // Find the record that was just verified (used = true)
    const { data, error } = await supabaseAdmin
      .from('password_reset_codes')
      .select('*')
      .eq('email', email)
      .eq('code', code)
      .eq('used', true)
      .order('created_at', { ascending: false })
      .limit(1);

    if (error || !data || data.length === 0) {
      return res.status(400).json({ error: 'Invalid or expired code. Please restart the reset process.' });
    }

    const record = data[0];
    if (new Date(record.expires_at) < new Date()) {
      return res.status(400).json({ error: 'Code has expired.' });
    }

    // Update the user's password via admin API
    // First, we need the auth user id for this email
    const { data: authUser, error: userError } = await supabaseAdmin.auth.admin.listUsers();
    // Better: use get user by email? Supabase admin API doesn't have direct "get user by email". We can query profiles.
    const { data: profile } = await supabaseAdmin.from('profiles').select('id').eq('email', email).single();
    if (!profile) return res.status(404).json({ error: 'User not found.' });

    const userId = profile.id;
    const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(userId, {
      password: newPassword,
    });
    if (updateError) throw updateError;

    // Delete all codes for this email
    await supabaseAdmin.from('password_reset_codes').delete().eq('email', email);

    res.json({ message: 'Password has been reset successfully. You can now log in.' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// --------------------------------------------------
// Change password (authenticated)
// --------------------------------------------------
router.put('/change-password', authenticate, async (req: AuthRequest, res: Response) => {
  const { email, oldPassword, newPassword } = req.body;
  const userId = req.userId!;

  if (!email || !oldPassword || !newPassword) {
    return res.status(400).json({ error: 'All fields are required.' });
  }

  try {
    const { error: signInError } = await supabaseAnon.auth.signInWithPassword({
      email,
      password: oldPassword,
    });
    if (signInError) {
      return res.status(400).json({ error: 'Current password is incorrect.' });
    }

    const { error } = await supabaseAdmin.auth.admin.updateUserById(userId, {
      password: newPassword,
    });
    if (error) throw error;

    res.json({ message: 'Password updated' });
  } catch (err: any) {
    res.status(400).json({ error: err.message || 'Failed to update password.' });
  }
});

export default router;