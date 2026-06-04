import { Router, Response } from 'express';
import * as jwt from 'jsonwebtoken';
import nodemailer from 'nodemailer';
import admin from '../firebase';
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

    const { data: admins, error: adminFetchError } = await supabaseAdmin
      .from('profiles')
      .select('id, device_tokens')
      .eq('role', 'admin');

    if (!adminFetchError && admins && admins.length > 0) {
      const adminNotifications = admins.map((adminUser: any) => ({
        recipient_id: adminUser.id,
        title: 'New student registered',
        message: `${fullName} has registered with email ${email}.`,
        link: '/admin/users',
        notification_type: 'student_registered',
        data: { studentId: authUser.id, email: email },
        is_read: false,
      }));

      await supabaseAdmin.from('notifications').insert(adminNotifications);

      const tokens = admins
        .flatMap((adminUser: any) => Array.isArray(adminUser.device_tokens) ? adminUser.device_tokens : [])
        .map((item: any) => item.token)
        .filter(Boolean);

      if (tokens.length && admin.apps.length > 0) {
        const payload = {
          notification: {
            title: 'New student registered',
            body: `${fullName} has joined the platform.`,
          },
          data: {
            link: '/admin/users',
            type: 'student_registered',
          },
        };

        const chunkSize = 500;
        for (let i = 0; i < tokens.length; i += chunkSize) {
          const batch = tokens.slice(i, i + chunkSize);
          await admin.messaging().sendToDevice(batch, payload).catch((sendError) => {
            console.error('FCM send error for admin notification:', sendError);
          });
        }
      }
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
// Smart login - auto detects role
// --------------------------------------------------
router.post("/admin/login", async (req, res) => {
  const { email, password } = req.body;

  try {
    const { data, error } = await supabaseAnon.auth.signInWithPassword({
      email,
      password,
    });
    if (error) throw error;

    const { data: profile } = await supabaseAdmin
      .from("profiles")
      .select("role, full_name")
      .eq("id", data.user.id)
      .single();

    const role = profile?.role || "student";
    const fullName = profile?.full_name || "";

    const token = jwt.sign(
      { sub: data.user.id, role },
      process.env.JWT_SECRET!,
      { expiresIn: "7d" },
    );

    res.json({
      success: true,
      token,
      user: {
        id: data.user.id,
        email,
        role,
        full_name: fullName,
      },
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

  if (!email || typeof email !== 'string' || !email.includes('@')) {
    return res.status(400).json({ error: 'A valid email is required.' });
  }

  try {
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 20 * 60 * 1000); // 20 minutes

    const { error: insertError } = await supabaseAdmin
      .from('password_reset_codes')
      .insert({ email, code, expires_at: expiresAt.toISOString() });

    if (insertError) {
      console.error('📌 Forgot password - DB insert failed:', insertError);
      return res.status(500).json({ error: 'Unable to queue password reset code. Please try again.' });
    }

    try {
      await transporter.sendMail({
        from: process.env.EMAIL_USER,
        to: email,
        subject: 'Exora Password Reset Code',
        text: `Your password reset code is: ${code}\n\nThis code expires in 20 minutes.`,
        html: `<p>Your password reset code is: <strong>${code}</strong></p><p>This code expires in 20 minutes.</p>`,
      });
    } catch (mailError: any) {
      console.error('📧 Forgot password - email send failed:', mailError);
      return res.status(502).json({ error: 'Unable to send the reset email. Please try again later.' });
    }

    res.json({ message: 'A verification code has been sent to your email.' });
  } catch (err: any) {
    console.error('❌ Forgot password error:', err);
    res.status(500).json({ error: 'Failed to generate reset code. Please try again.' });
  }
});

router.post('/mobile/verify-reset-code', async (req, res) => {
  const { email, code } = req.body;

  if (!email || !code || typeof email !== 'string' || typeof code !== 'string') {
    return res.status(400).json({ error: 'Email and code are required.' });
  }

  try {
    const { data, error } = await supabaseAdmin
      .from('password_reset_codes')
      .select('*')
      .eq('email', email)
      .eq('code', code)
      .eq('used', false)
      .order('created_at', { ascending: false })
      .limit(1);

    if (error) {
      console.error('📌 Verify code - DB query failed:', error);
      return res.status(500).json({ error: 'Unable to verify code. Please try again.' });
    }

    if (!data || data.length === 0) {
      return res.status(400).json({ error: 'Invalid or expired code.' });
    }

    const record = data[0];
    if (new Date(record.expires_at) < new Date()) {
      return res.status(400).json({ error: 'Code has expired. Please request a new one.' });
    }

    const { error: updateError } = await supabaseAdmin
      .from('password_reset_codes')
      .update({ used: true })
      .eq('id', record.id);

    if (updateError) {
      console.error('📌 Verify code - update failed:', updateError);
      return res.status(500).json({ error: 'Unable to mark code as verified. Please try again.' });
    }

    res.json({ message: 'Code verified. You can now reset your password.' });
  } catch (err: any) {
    console.error('❌ Error in verify-reset-code:', err);
    res.status(500).json({ error: 'Failed to verify code. Please try again.' });
  }
});

// Step 3: Reset password using the verified code
router.post('/mobile/reset-password', async (req, res) => {
  const { email, code, newPassword } = req.body;

  if (!email || !code || !newPassword || typeof email !== 'string' || typeof code !== 'string' || typeof newPassword !== 'string') {
    return res.status(400).json({ error: 'Email, code, and new password are required.' });
  }

  if (newPassword.length < 8) {
    return res.status(400).json({ error: 'New password must be at least 8 characters.' });
  }

  try {
    const { data, error } = await supabaseAdmin
      .from('password_reset_codes')
      .select('*')
      .eq('email', email)
      .eq('code', code)
      .eq('used', true)
      .order('created_at', { ascending: false })
      .limit(1);

    if (error) {
      console.error('📌 Reset password - DB query failed:', error);
      return res.status(500).json({ error: 'Unable to validate reset code. Please try again.' });
    }

    if (!data || data.length === 0) {
      return res.status(400).json({ error: 'Invalid or expired code. Please restart the reset process.' });
    }

    const record = data[0];
    if (new Date(record.expires_at) < new Date()) {
      return res.status(400).json({ error: 'Code has expired.' });
    }

    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('id')
      .eq('email', email)
      .single();

    if (profileError || !profile) {
      console.error('📌 Reset password - profile lookup failed:', profileError);
      return res.status(404).json({ error: 'User not found.' });
    }

    const userId = profile.id;
    const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(userId, {
      password: newPassword,
    });

    if (updateError) {
      console.error('📌 Reset password - updateUserById failed:', updateError);
      return res.status(500).json({ error: 'Unable to update password. Please try again.' });
    }

    const { error: cleanupError } = await supabaseAdmin
      .from('password_reset_codes')
      .delete()
      .eq('email', email);

    if (cleanupError) {
      console.error('📌 Reset password - cleanup failed:', cleanupError);
    }

    res.json({ message: 'Password has been reset successfully. You can now log in.' });
  } catch (err: any) {
    console.error('❌ Reset-password error:', err);
    res.status(500).json({ error: 'Failed to reset password. Please try again.' });
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