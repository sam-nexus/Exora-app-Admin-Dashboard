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
// Regular user registration
// Regular user registration
router.post('/register', async (req, res) => {
  const { email, password, fullName } = req.body;
  let authUser: any = null;

  // ─── Validation ──────────────────────────────────────────────────────────
  if (!email || !password || !fullName) {
    return res.status(400).json({ error: 'All fields are required.' });
  }

  if (typeof fullName !== 'string' || fullName.trim().length < 2) {
    return res.status(400).json({ error: 'Full name must be at least 2 characters.' });
  }

  if (typeof password !== 'string' || password.length < 6) {
    return res.status(400).json({ error: 'Password must be at least 6 characters.' });
  }

  // Basic email format validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({ error: 'Please enter a valid email address.' });
  }

  // Extract domain and validate allowed providers
  const domain = email.split('@')[1]?.toLowerCase();
  const allowedDomains = [
    'gmail.com',
    'yahoo.com',
    'outlook.com',
    'hotmail.com',
    'icloud.com',
    'protonmail.com',
    'live.com',
    'aol.com',
    'zoho.com',
    'yandex.com',
    'mail.com',
    'gmx.com',
    'fastmail.com',
    'tutanota.com',
    'inbox.com',
  ];

  if (!domain || !allowedDomains.includes(domain)) {
    return res.status(400).json({
      error: `Email must be from a valid provider (e.g., ${allowedDomains.slice(0, 5).join(', ')}...).`,
    });
  }

  // Optional: Block disposable/temporary email providers
  const disposableDomains = [
    'tempmail.com', 'temp-mail.org', 'guerrillamail.com', 'mailinator.com',
    '10minutemail.com', 'yopmail.com', 'throwaway.email', 'sharklasers.com',
    'trashmail.com', 'fakeinbox.com',
  ];
  if (disposableDomains.includes(domain)) {
    return res.status(400).json({ error: 'Disposable email addresses are not allowed.' });
  }

  try {
    // ─── Check if email already exists ────────────────────────────────────
    const { data: existingProfile, error: checkError } = await supabaseAdmin
      .from('profiles')
      .select('id')
      .eq('email', email)
      .maybeSingle();

    if (checkError) throw checkError;

    if (existingProfile) {
      return res.status(409).json({ error: 'An account with this email already exists. Please log in instead.' });
    }

    // Also check auth.users (in case profile insert failed previously)
    const { data: existingAuthUsers, error: authCheckError } = await supabaseAdmin.auth.admin.listUsers();
    if (!authCheckError) {
      const existingAuthUser = (existingAuthUsers?.users || []).find(
        (u: any) => u.email?.toLowerCase() === email.toLowerCase()
      );
      if (existingAuthUser) {
        // Clean up orphan auth user (no profile)
        await supabaseAdmin.auth.admin.deleteUser(existingAuthUser.id);
      }
    }

    // ─── Create user ──────────────────────────────────────────────────────
    const { data, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });
    if (authError) {
      // Handle Supabase's own duplicate error
      if (authError.message?.toLowerCase().includes('already been registered')) {
        return res.status(409).json({ error: 'An account with this email already exists. Please log in instead.' });
      }
      throw authError;
    }
    authUser = data.user;

    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .insert({ id: authUser.id, full_name: fullName.trim(), email, role: 'user' });
    if (profileError) throw profileError;

    // Lock every course for the new user (except free courses)
    const { data: courses } = await supabaseAdmin.from('courses').select('id, is_free');
    if (courses && courses.length > 0) {
      const paidCourses = courses.filter(c => !c.is_free);
      const freeCourses = courses.filter(c => c.is_free);

      if (paidCourses.length > 0) {
        const locks = paidCourses.map(c => ({
          user_id: authUser.id,
          course_id: c.id,
          is_locked: true,
        }));
        await supabaseAdmin.from('user_courses').insert(locks);
      }

      if (freeCourses.length > 0) {
        const freeLocks = freeCourses.map(c => ({
          user_id: authUser.id,
          course_id: c.id,
          is_locked: false,
        }));
        await supabaseAdmin.from('user_courses').insert(freeLocks);
      }
    }

    const { data: admins, error: adminFetchError } = await supabaseAdmin
      .from('profiles')
      .select('id, device_tokens')
      .eq('role', 'admin');

    if (!adminFetchError && admins && admins.length > 0) {
      const adminNotifications = admins.map((adminUser: any) => ({
        recipient_id: adminUser.id,
        title: 'New student registered',
        message: `${fullName.trim()} has registered with email ${email}.`,
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
            body: `${fullName.trim()} has joined the platform.`,
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
    // Handle Supabase duplicate error at the catch level too
    if (err.message?.toLowerCase().includes('already been registered') || err.message?.toLowerCase().includes('already exists')) {
      return res.status(409).json({ error: 'An account with this email already exists. Please log in instead.' });
    }
    if (authUser) await supabaseAdmin.auth.admin.deleteUser(authUser.id);
    res.status(400).json({ error: err.message });
  }
});

// Logout
router.post('/logout', authenticate, async (req: AuthRequest, res: Response) => {
  const { fcm_token } = req.body;

  try {
    if (fcm_token) {
      // Deactivate specific session
      await supabaseAdmin
        .from('user_sessions')
        .update({ is_active: false })
        .eq('user_id', req.userId)
        .eq('fcm_token', fcm_token);
    } else {
      // Deactivate all sessions
      await supabaseAdmin
        .from('user_sessions')
        .update({ is_active: false })
        .eq('user_id', req.userId);
    }

    res.json({ message: 'Logged out' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Force logout all other sessions (keep current)
router.post('/logout-others', authenticate, async (req: AuthRequest, res: Response) => {
  const { current_fcm_token } = req.body;

  try {
    await supabaseAdmin
      .from('user_sessions')
      .update({ is_active: false })
      .eq('user_id', req.userId)
      .neq('fcm_token', current_fcm_token);

    res.json({ message: 'All other devices logged out' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }

});



// Clean up old sessions (call this periodically or on login)
router.post('/cleanup-sessions', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const twoDaysAgo = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString();
    await supabaseAdmin
      .from('user_sessions')
      .update({ is_active: false })
      .lt('last_active', twoDaysAgo)
      .eq('is_active', true);

    res.json({ message: 'Sessions cleaned up' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});
// --------------------------------------------------
// Mobile app login (any role)
// --------------------------------------------------
// router.post('/login', async (req, res) => {
//   const { email, password } = req.body;

//   try {
//     const { data, error } = await supabaseAnon.auth.signInWithPassword({ email, password });
//     if (error) throw error;

//     const { data: profile } = await supabaseAdmin
//       .from('profiles')
//       .select('role, full_name, active_session_token, session_device, session_last_active')
//       .eq('id', data.user.id)
//       .single();


//     // Check if user already has an active session on another device
//     if (profile?.active_session_token) {
//       const lastActive = profile.session_last_active
//         ? new Date(profile.session_last_active)
//         : null;
//       const now = new Date();

//       // If session is still active (last activity within 5 minutes)
//       if (lastActive && (now.getTime() - lastActive.getTime()) < 5 * 60 * 1000) {
//         return res.status(403).json({
//           error: 'You are already logged in on another device. Please log out from that device first.',
//           activeDevice: profile.session_device || 'another device'
//         });
//       }
//     }



//     const role = profile?.role || 'user';
//     const fullName = profile?.full_name || '';

//     const token = jwt.sign(
//       { sub: data.user.id, role },
//       process.env.JWT_SECRET!,
//       { expiresIn: '7d' }
//     );

//     res.json({
//       token,
//       user: { id: data.user.id, email, role, full_name: fullName },
//     });
//   } catch (err: any) {
//     res.status(401).json({ error: err.message });
//   }
// });


// Login
// Login
router.post('/login', async (req, res) => {
  const { email, password, fcm_token, platform, device_info } = req.body;

  try {
    const { data, error } = await supabaseAnon.auth.signInWithPassword({ email, password });
    if (error) throw error;

    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('role, full_name')
      .eq('id', data.user.id)
      .single();

    // ─── Device Restriction ──────────────────────────────────────────────────
    const MAX_DEVICES = 1; // Allow only 1 active session

    // Check if there's ANY active session for this user
    const { data: activeSessions, error: sessionError } = await supabaseAdmin
      .from('user_sessions')
      .select('id, platform, fcm_token, login_time')
      .eq('user_id', data.user.id)
      .eq('is_active', true);

    if (sessionError) throw sessionError;

    // If there's already an active session on a DIFFERENT device, block login
    if (activeSessions && activeSessions.length > 0) {
      // Check if this is the same device (same FCM token)
      const isSameDevice = activeSessions.some(s => s.fcm_token === fcm_token);

      if (!isSameDevice) {
        const existingPlatforms = activeSessions.map(s => s.platform).join(', ');
        return res.status(403).json({
          error: `You are already logged in on ${existingPlatforms}. Please log out from that device first.`,
        });
      }
      // Same device — allow, update last_active below
    }

    // No active session, or same device — create/update session
    if (fcm_token) {
      // Check if there's an existing session with this token (inactive or active)
      const { data: existingTokenSession } = await supabaseAdmin
        .from('user_sessions')
        .select('id')
        .eq('user_id', data.user.id)
        .eq('fcm_token', fcm_token)
        .single();

      if (existingTokenSession) {
        // Reactivate existing session
        await supabaseAdmin
          .from('user_sessions')
          .update({
            is_active: true,
            last_active: new Date().toISOString(),
            platform: platform || 'unknown',
            device_info: device_info || null,
            ip_address: req.ip,
          })
          .eq('id', existingTokenSession.id);
      } else {
        // Create new session
        await supabaseAdmin.from('user_sessions').insert({
          user_id: data.user.id,
          fcm_token: fcm_token,
          platform: platform || 'unknown',
          device_info: device_info || null,
          ip_address: req.ip,
          is_active: true,
        });
      }
    }
    // ────────────────────────────────────────────────────────────────────────

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
// router.post("/admin/login", async (req, res) => {
//   const { email, password } = req.body;

//   try {
//     const { data, error } = await supabaseAnon.auth.signInWithPassword({
//       email,
//       password,
//     });
//     if (error) throw error;

//     const { data: profile } = await supabaseAdmin
//       .from("profiles")
//       .select("role, full_name, active_session_token, session_device, session_last_active")
//       .eq("id", data.user.id)
//       .single();

//     // Check if user already has an active session on another device
//     if (profile?.active_session_token) {
//       const lastActive = profile.session_last_active
//         ? new Date(profile.session_last_active)
//         : null;
//       const now = new Date();

//       // If session is still active (last activity within 5 minutes)
//       if (lastActive && (now.getTime() - lastActive.getTime()) < 1 * 60 * 1000) {
//         return res.status(403).json({
//           error: 'You are already logged in on another device. Please log out from that device first.',
//           activeDevice: profile.session_device || 'another device'
//         });
//       }
//     }

//     const role = profile?.role || "student";
//     const fullName = profile?.full_name || "";

//     const token = jwt.sign(
//       { sub: data.user.id, role },
//       process.env.JWT_SECRET!,
//       { expiresIn: "7d" },
//     );

//     res.json({
//       success: true,
//       token,
//       user: {
//         id: data.user.id,
//         email,
//         role,
//         full_name: fullName,
//       },
//     });
//   } catch (err: any) {
//     res.status(401).json({ error: err.message });
//   }
// });
// Login
// Login
router.post('/admin/login', async (req, res) => {
  const { email, password, fcm_token, platform, device_info } = req.body;

  try {
    const { data, error } = await supabaseAnon.auth.signInWithPassword({ email, password });
    if (error) throw error;

    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('role, full_name')
      .eq('id', data.user.id)
      .single();

    // ─── Device Restriction ──────────────────────────────────────────────────
    const MAX_DEVICES = 1; // Allow only 1 active session

    // Check if there's ANY active session for this user
    const { data: activeSessions, error: sessionError } = await supabaseAdmin
      .from('user_sessions')
      .select('id, platform, fcm_token, login_time')
      .eq('user_id', data.user.id)
      .eq('is_active', true);

    if (sessionError) throw sessionError;

    // If there's already an active session on a DIFFERENT device, block login
    if (activeSessions && activeSessions.length > 0) {
      // Check if this is the same device (same FCM token)
      const isSameDevice = activeSessions.some(s => s.fcm_token === fcm_token);

      if (!isSameDevice) {
        const existingPlatforms = activeSessions.map(s => s.platform).join(', ');
        return res.status(403).json({
          error: `You are already logged in on ${existingPlatforms}. Please log out from that device first.`,
        });
      }
      // Same device — allow, update last_active below
    }

    // No active session, or same device — create/update session
    if (fcm_token) {
      // Check if there's an existing session with this token (inactive or active)
      const { data: existingTokenSession } = await supabaseAdmin
        .from('user_sessions')
        .select('id')
        .eq('user_id', data.user.id)
        .eq('fcm_token', fcm_token)
        .single();

      if (existingTokenSession) {
        // Reactivate existing session
        await supabaseAdmin
          .from('user_sessions')
          .update({
            is_active: true,
            last_active: new Date().toISOString(),
            platform: platform || 'unknown',
            device_info: device_info || null,
            ip_address: req.ip,
          })
          .eq('id', existingTokenSession.id);
      } else {
        // Create new session
        await supabaseAdmin.from('user_sessions').insert({
          user_id: data.user.id,
          fcm_token: fcm_token,
          platform: platform || 'unknown',
          device_info: device_info || null,
          ip_address: req.ip,
          is_active: true,
        });
      }
    }
    // ────────────────────────────────────────────────────────────────────────

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


// Forgot password for all users (no admin check)
router.post('/forgot-password', async (req, res) => {
  const { email } = req.body;

  try {
    // Check if email exists in profiles (any role)
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('id, role')
      .eq('email', email)
      .single();

    if (profileError || !profile) {
      return res.status(404).json({ error: 'No account found with that email.' });
    }

    // Determine redirect URL based on role
    const redirectTo = profile.role === 'admin'
      ? 'https://exoraapp.netlify.app/reset-password'
      : 'https://exoraapp.netlify.app/reset-password'; // Change to your student app URL

    const { error } = await supabaseAnon.auth.resetPasswordForEmail(email, {
      redirectTo,
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