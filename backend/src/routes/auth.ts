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

    // ── Welcome notification to the new student ───────────────────────────
    await supabaseAdmin.from("notifications").insert({
      recipient_id: authUser.id,
      title: ` Welcome ${fullName.trim()} to Exora Exit Exam Preparation!`,
      message: `Your account has been successfully created. Once you make payment and your payment is approved, you will get full access to all exit exam preparation resources. Stay tuned!\n\n– Exora Team`,
      link: "/student/payments",
      notification_type: "welcome",
      is_read: false,
    });
    // ────────────────────────────────────────────────────────────────────────

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

//logout
router.post('/logout', authenticate, async (req: AuthRequest, res: Response) => {
  console.log('=== LOGOUT ROUTE HIT ===');
  console.log('User ID:', req.userId);

  try {
    const token = req.headers.authorization?.split(' ')[1];
    const { fcm_token, device_id } = req.body || {};

    console.log('Logout data:', { token: !!token, fcm_token: !!fcm_token, device_id: !!device_id });

    // Try to deactivate by device_id first (for web)
    if (device_id) {
      const { error, data } = await supabaseAdmin
        .from('user_sessions')
        .update({ is_active: false, last_active: new Date().toISOString() })
        .eq('user_id', req.userId)
        .eq('device_id', device_id)
        .select();

      if (data && data.length > 0) {
        console.log('Session deactivated by device_id');

        // Check if any active sessions remain
        const { data: remaining } = await supabaseAdmin
          .from('user_sessions')
          .select('id')
          .eq('user_id', req.userId)
          .eq('is_active', true);

        if (!remaining || remaining.length === 0) {
          await supabaseAdmin
            .from('profiles')
            .update({
              active_session_token: null,
              session_device: null,
              session_last_active: new Date().toISOString()
            })
            .eq('id', req.userId);
        }

        return res.json({ message: 'Logged out successfully' });
      }
    }

    // Try to deactivate by fcm_token (for mobile)
    if (fcm_token) {
      const { error, data } = await supabaseAdmin
        .from('user_sessions')
        .update({ is_active: false, last_active: new Date().toISOString() })
        .eq('user_id', req.userId)
        .eq('fcm_token', fcm_token)
        .select();

      if (data && data.length > 0) {
        console.log('Session deactivated by fcm_token');
        return res.json({ message: 'Logged out successfully' });
      }
    }

    // Try to deactivate by session_token
    if (token) {
      const { error, data } = await supabaseAdmin
        .from('user_sessions')
        .update({ is_active: false, last_active: new Date().toISOString() })
        .eq('user_id', req.userId)
        .eq('session_token', token)
        .select();

      if (data && data.length > 0) {
        console.log('Session deactivated by session_token');
        return res.json({ message: 'Logged out successfully' });
      }
    }

    // Fallback: deactivate all sessions
    console.log('Falling back to deactivate all sessions');
    const { error, data } = await supabaseAdmin
      .from('user_sessions')
      .update({ is_active: false, last_active: new Date().toISOString() })
      .eq('user_id', req.userId)
      .select();

    console.log(`Deactivated ${data?.length || 0} sessions`);

    await supabaseAdmin
      .from('profiles')
      .update({
        active_session_token: null,
        session_device: null,
        session_last_active: new Date().toISOString()
      })
      .eq('id', req.userId);

    res.json({ message: 'Logged out successfully' });
  } catch (err: any) {
    console.error('Logout error:', err.message);
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
router.post('/login', async (req, res) => {
  const { email, password, fcm_token, platform, device_id, device_info } = req.body;

  try {
    const { data, error } = await supabaseAnon.auth.signInWithPassword({ email, password });
    if (error) throw error;

    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('role, full_name')
      .eq('id', data.user.id)
      .single();

    const role = profile?.role || 'student';
    const fullName = profile?.full_name || '';

    // Generate JWT token
    const token = jwt.sign(
      { sub: data.user.id, role },
      process.env.JWT_SECRET!,
      { expiresIn: '7d' }
    );

    // ─── Device Restriction ──────────────────────────────────────────────
    const MAX_DEVICES = 2;
    const SESSION_TIMEOUT_MINUTES = 30;

    // 1. Expire sessions older than 30 minutes
    const thirtyMinsAgo = new Date(Date.now() - SESSION_TIMEOUT_MINUTES * 60 * 1000).toISOString();
    await supabaseAdmin
      .from('user_sessions')
      .update({ is_active: false })
      .eq('user_id', data.user.id)
      .eq('is_active', true)
      .lt('last_active', thirtyMinsAgo);

    // 2. Get current active sessions for this user
    const { data: activeSessions } = await supabaseAdmin
      .from('user_sessions')
      .select('id, platform, fcm_token, device_id, ip_address, last_active')
      .eq('user_id', data.user.id)
      .eq('is_active', true);

    console.log('Active sessions count:', activeSessions?.length || 0);
    console.log('Active sessions:', activeSessions);

    const activeCount = activeSessions?.length || 0;

    // 3. Create unique device identifier
    let deviceIdentifier = device_id;
    if (!deviceIdentifier && fcm_token) {
      deviceIdentifier = fcm_token;
    }
    if (!deviceIdentifier) {
      deviceIdentifier = `${req.ip}_${req.headers['user-agent'] || 'unknown'}`;
    }

    console.log('Device identifier:', deviceIdentifier);

    // 4. Check if this device already has an active session
    const existingSession = activeSessions?.find(s => {
      // Check by device_id
      if (s.device_id && s.device_id === deviceIdentifier) {
        console.log('Found existing session by device_id');
        return true;
      }
      // Check by fcm_token
      if (s.fcm_token && s.fcm_token === fcm_token) {
        console.log('Found existing session by fcm_token');
        return true;
      }
      return false;
    });

    console.log('Existing session found:', existingSession ? 'YES' : 'NO');

    // 5. Handle the login
    if (existingSession) {
      // Same device - just update last_active
      console.log('Same device - updating last_active');
      await supabaseAdmin
        .from('user_sessions')
        .update({ 
          last_active: new Date().toISOString(),
          // Update token if needed
          session_token: token 
        })
        .eq('id', existingSession.id);
      
      console.log('Session updated successfully');
    } 
    else if (activeCount >= MAX_DEVICES) {
      // Too many DIFFERENT devices - block
      console.log(`Blocking: ${activeCount} devices already active, max is ${MAX_DEVICES}`);
      const existingDevices = activeSessions?.map(s => s.platform || 'unknown').join(', ');
      return res.status(403).json({
        error: `You are already logged in on ${activeCount} devices (${existingDevices}). Maximum allowed is ${MAX_DEVICES} devices. Please log out from one device first.`,
        activeSessions: activeSessions?.map(s => ({
          platform: s.platform || 'unknown',
          lastActive: s.last_active,
        })),
      });
    }
    else {
      // New device and under limit - create new session
      console.log('New device - creating session');
      
      const sessionData: any = {
        user_id: data.user.id,
        session_token: token,
        platform: platform || 'web',
        ip_address: req.ip || req.headers['x-forwarded-for'] || null,
        login_time: new Date().toISOString(),
        last_active: new Date().toISOString(),
        is_active: true,
        device_id: deviceIdentifier, // Always store device_id
      };

      if (fcm_token) {
        sessionData.fcm_token = fcm_token;
      }

      if (device_info) {
        sessionData.device_info = device_info;
      }

      console.log('Creating session with data:', {
        ...sessionData,
        session_token: sessionData.session_token?.substring(0, 20) + '...'
      });

      const { error: insertError } = await supabaseAdmin
        .from('user_sessions')
        .insert(sessionData);

      if (insertError) {
        console.error('Insert error:', insertError);
        throw insertError;
      }

      console.log('Session created successfully');
    }

    // 6. Clean up: Keep only the latest MAX_DEVICES sessions
    const { data: allSessions } = await supabaseAdmin
      .from('user_sessions')
      .select('id, last_active')
      .eq('user_id', data.user.id)
      .eq('is_active', true)
      .order('last_active', { ascending: false });

    if (allSessions && allSessions.length > MAX_DEVICES) {
      const sessionsToDeactivate = allSessions.slice(MAX_DEVICES);
      const idsToDeactivate = sessionsToDeactivate.map(s => s.id);
      
      await supabaseAdmin
        .from('user_sessions')
        .update({ is_active: false })
        .in('id', idsToDeactivate);
      
      console.log(`Deactivated ${idsToDeactivate.length} old sessions`);
    }

    // 7. Get final active count
    const { data: finalSessions } = await supabaseAdmin
      .from('user_sessions')
      .select('id')
      .eq('user_id', data.user.id)
      .eq('is_active', true);

    const finalCount = finalSessions?.length || 0;
    console.log(`Final active sessions: ${finalCount}/${MAX_DEVICES}`);

    // Update profile
    await supabaseAdmin
      .from('profiles')
      .update({ 
        active_session_token: token,
        session_device: platform || 'web',
        session_last_active: new Date().toISOString()
      })
      .eq('id', data.user.id);

    res.json({
      token,
      user: { id: data.user.id, email, role, full_name: fullName },
      sessionCount: finalCount,
      maxDevices: MAX_DEVICES,
    });
  } catch (err: any) {
    console.error('Login error:', err.message);
    res.status(401).json({ error: err.message });
  }
});

// --------------------------------------------------
// Smart login - auto detects role
// --------------------------------------------------
// router.post("/admin/login", async (req, res) => { ... }); // kept as comment
router.post('/admin/login', async (req, res) => {
  const { email, password, fcm_token, platform, device_id, device_info } = req.body;

  try {
    const { data, error } = await supabaseAnon.auth.signInWithPassword({ email, password });
    if (error) throw error;

    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('role, full_name')
      .eq('id', data.user.id)
      .single();

    const role = profile?.role || 'student';
    const fullName = profile?.full_name || '';

    // Generate JWT token
    const token = jwt.sign(
      { sub: data.user.id, role },
      process.env.JWT_SECRET!,
      { expiresIn: '7d' }
    );

    // ─── Device Restriction ──────────────────────────────────────────────
    const MAX_DEVICES = 2;
    const SESSION_TIMEOUT_MINUTES = 30;

    // 1. Expire sessions older than 30 minutes
    const thirtyMinsAgo = new Date(Date.now() - SESSION_TIMEOUT_MINUTES * 60 * 1000).toISOString();
    await supabaseAdmin
      .from('user_sessions')
      .update({ is_active: false })
      .eq('user_id', data.user.id)
      .eq('is_active', true)
      .lt('last_active', thirtyMinsAgo);

    // 2. Get current active sessions for this user
    const { data: activeSessions } = await supabaseAdmin
      .from('user_sessions')
      .select('id, platform, fcm_token, device_id, ip_address, last_active')
      .eq('user_id', data.user.id)
      .eq('is_active', true);

    console.log('Active sessions count:', activeSessions?.length || 0);
    console.log('Active sessions:', activeSessions);

    const activeCount = activeSessions?.length || 0;

    // 3. Create unique device identifier
    let deviceIdentifier = device_id;
    if (!deviceIdentifier && fcm_token) {
      deviceIdentifier = fcm_token;
    }
    if (!deviceIdentifier) {
      deviceIdentifier = `${req.ip}_${req.headers['user-agent'] || 'unknown'}`;
    }

    console.log('Device identifier:', deviceIdentifier);

    // 4. Check if this device already has an active session
    const existingSession = activeSessions?.find(s => {
      // Check by device_id
      if (s.device_id && s.device_id === deviceIdentifier) {
        console.log('Found existing session by device_id');
        return true;
      }
      // Check by fcm_token
      if (s.fcm_token && s.fcm_token === fcm_token) {
        console.log('Found existing session by fcm_token');
        return true;
      }
      return false;
    });

    console.log('Existing session found:', existingSession ? 'YES' : 'NO');

    // 5. Handle the login
    if (existingSession) {
      // Same device - just update last_active
      console.log('Same device - updating last_active');
      await supabaseAdmin
        .from('user_sessions')
        .update({ 
          last_active: new Date().toISOString(),
          // Update token if needed
          session_token: token 
        })
        .eq('id', existingSession.id);
      
      console.log('Session updated successfully');
    } 
    else if (activeCount >= MAX_DEVICES) {
      // Too many DIFFERENT devices - block
      console.log(`Blocking: ${activeCount} devices already active, max is ${MAX_DEVICES}`);
      const existingDevices = activeSessions?.map(s => s.platform || 'unknown').join(', ');
      return res.status(403).json({
        error: `You are already logged in on ${activeCount} devices (${existingDevices}). Maximum allowed is ${MAX_DEVICES} devices. Please log out from one device first.`,
        activeSessions: activeSessions?.map(s => ({
          platform: s.platform || 'unknown',
          lastActive: s.last_active,
        })),
      });
    }
    else {
      // New device and under limit - create new session
      console.log('New device - creating session');
      
      const sessionData: any = {
        user_id: data.user.id,
        session_token: token,
        platform: platform || 'web',
        ip_address: req.ip || req.headers['x-forwarded-for'] || null,
        login_time: new Date().toISOString(),
        last_active: new Date().toISOString(),
        is_active: true,
        device_id: deviceIdentifier, // Always store device_id
      };

      if (fcm_token) {
        sessionData.fcm_token = fcm_token;
      }

      if (device_info) {
        sessionData.device_info = device_info;
      }

      console.log('Creating session with data:', {
        ...sessionData,
        session_token: sessionData.session_token?.substring(0, 20) + '...'
      });

      const { error: insertError } = await supabaseAdmin
        .from('user_sessions')
        .insert(sessionData);

      if (insertError) {
        console.error('Insert error:', insertError);
        throw insertError;
      }

      console.log('Session created successfully');
    }

    // 6. Clean up: Keep only the latest MAX_DEVICES sessions
    const { data: allSessions } = await supabaseAdmin
      .from('user_sessions')
      .select('id, last_active')
      .eq('user_id', data.user.id)
      .eq('is_active', true)
      .order('last_active', { ascending: false });

    if (allSessions && allSessions.length > MAX_DEVICES) {
      const sessionsToDeactivate = allSessions.slice(MAX_DEVICES);
      const idsToDeactivate = sessionsToDeactivate.map(s => s.id);
      
      await supabaseAdmin
        .from('user_sessions')
        .update({ is_active: false })
        .in('id', idsToDeactivate);
      
      console.log(`Deactivated ${idsToDeactivate.length} old sessions`);
    }

    // 7. Get final active count
    const { data: finalSessions } = await supabaseAdmin
      .from('user_sessions')
      .select('id')
      .eq('user_id', data.user.id)
      .eq('is_active', true);

    const finalCount = finalSessions?.length || 0;
    console.log(`Final active sessions: ${finalCount}/${MAX_DEVICES}`);

    // Update profile
    await supabaseAdmin
      .from('profiles')
      .update({ 
        active_session_token: token,
        session_device: platform || 'web',
        session_last_active: new Date().toISOString()
      })
      .eq('id', data.user.id);

    res.json({
      token,
      user: { id: data.user.id, email, role, full_name: fullName },
      sessionCount: finalCount,
      maxDevices: MAX_DEVICES,
    });
  } catch (err: any) {
    console.error('Login error:', err.message);
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