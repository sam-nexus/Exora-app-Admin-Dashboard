import { Router, Response } from 'express';
import admin from '../firebase';
import { supabaseAdmin } from '../supabase';
import { authenticate, adminOnly, AuthRequest } from '../middleware/auth';

const router = Router();

// Student requests to unlock a course
router.post('/', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId!;
    const { courseId, reason } = req.body;

    if (!courseId) {
      return res.status(400).json({ error: 'Course ID is required' });
    }

    // Check if course exists
    const { data: course, error: courseError } = await supabaseAdmin
      .from('courses')
      .select('id, name')
      .eq('id', courseId)
      .single();

    if (courseError || !course) {
      return res.status(404).json({ error: 'Course not found' });
    }

    // Get student details
    const { data: student, error: studentError } = await supabaseAdmin
      .from('profiles')
      .select('full_name, email')
      .eq('id', userId)
      .single();

    if (studentError || !student) {
      return res.status(404).json({ error: 'Student not found' });
    }

    // Create unlock request
    const { data: request, error: insertError } = await supabaseAdmin
      .from('unlock_requests')
      .insert({
        user_id: userId,
        course_id: courseId,
        reason: reason || 'No reason provided',
        status: 'pending',
      })
      .select('id')
      .single();

    if (insertError) {
      throw insertError;
    }

    // Notify all admins about the unlock request
    const { data: admins, error: adminFetchError } = await supabaseAdmin
      .from('profiles')
      .select('id, device_tokens')
      .eq('role', 'admin');

    if (!adminFetchError && admins && admins.length > 0) {
      const adminNotifications = admins.map((adminUser: any) => ({
        recipient_id: adminUser.id,
        title: 'Course Unlock Request',
        message: `${student.full_name} has requested to unlock "${course.name}". Reason: ${reason || 'Not provided'}`,
        link: '/admin/unlock-requests',
        notification_type: 'unlock_request',
        data: {
          requestId: request.id,
          studentId: userId,
          courseId: courseId,
          studentName: student.full_name,
          courseName: course.name,
        },
        is_read: false,
      }));

      const { error: notificationError } = await supabaseAdmin
        .from('notifications')
        .insert(adminNotifications);

      if (notificationError) {
        console.error('Notification insert error:', notificationError);
      }

      // Send push notifications to admins
      const tokens = admins
        .flatMap((adminUser: any) => Array.isArray(adminUser.device_tokens) ? adminUser.device_tokens : [])
        .map((item: any) => item.token)
        .filter(Boolean);

      if (tokens.length > 0 && admin.apps.length > 0) {
        const payload = {
          notification: {
            title: 'Course Unlock Request',
            body: `${student.full_name} requests access to "${course.name}"`,
          },
          data: {
            link: '/admin/unlock-requests',
            type: 'unlock_request',
            requestId: request.id,
          },
        };

        const chunkSize = 500;
        for (let i = 0; i < tokens.length; i += chunkSize) {
          const batch = tokens.slice(i, i + chunkSize);
          await admin.messaging().sendToDevice(batch, payload).catch((sendError) => {
            console.error('FCM send error:', sendError);
          });
        }
      }
    }

    // Notify the student that request was submitted
    const { data: studentProfile, error: studentProfileError } = await supabaseAdmin
      .from('profiles')
      .select('device_tokens')
      .eq('id', userId)
      .single();

    if (!studentProfileError && studentProfile) {
      const studentNotification = {
        recipient_id: userId,
        title: 'Unlock Request Submitted',
        message: `Your request to unlock "${course.name}" has been submitted for admin review.`,
        link: '/student/departments',
        notification_type: 'unlock_request_submitted',
        data: { courseId: courseId, courseName: course.name, requestId: request.id },
        is_read: false,
      };

      await supabaseAdmin.from('notifications').insert([studentNotification]);

      // Send push notification to student
      const studentTokens = Array.isArray(studentProfile.device_tokens)
        ? studentProfile.device_tokens
        : [];
      const tokens = studentTokens
        .map((item: any) => item.token)
        .filter(Boolean);

      if (tokens.length > 0 && admin.apps.length > 0) {
        const payload = {
          notification: {
            title: 'Unlock Request Submitted',
            body: `Your request for "${course.name}" is being reviewed.`,
          },
          data: {
            link: '/student/departments',
            type: 'unlock_request_submitted',
          },
        };

        await admin.messaging().sendToDevice(tokens, payload).catch((sendError) => {
          console.error('FCM send error:', sendError);
        });
      }
    }

    res.status(201).json({ message: 'Unlock request submitted', requestId: request.id });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Admin approves/rejects unlock request
router.patch('/:requestId', authenticate, adminOnly, async (req: AuthRequest, res: Response) => {
  try {
    const { requestId } = req.params;
    const { status } = req.body;

    if (!['approved', 'rejected'].includes(status)) {
      return res.status(400).json({ error: 'Status must be "approved" or "rejected"' });
    }

    // Get the unlock request
    const { data: request, error: fetchError } = await supabaseAdmin
      .from('unlock_requests')
      .select('user_id, course_id, status')
      .eq('id', requestId)
      .single();

    if (fetchError || !request) {
      return res.status(404).json({ error: 'Request not found' });
    }

    if (request.status !== 'pending') {
      return res.status(400).json({ error: 'This request has already been processed' });
    }

    // Update request status
    const { error: updateError } = await supabaseAdmin
      .from('unlock_requests')
      .update({ status })
      .eq('id', requestId);

    if (updateError) throw updateError;

    // If approved, unlock the course for the student
    if (status === 'approved') {
      const { error: unlockError } = await supabaseAdmin
        .from('user_courses')
        .update({ is_locked: false })
        .eq('user_id', request.user_id)
        .eq('course_id', request.course_id);

      if (unlockError) throw unlockError;
    }

    // Get course and student details
    const { data: course } = await supabaseAdmin
      .from('courses')
      .select('name')
      .eq('id', request.course_id)
      .single();

    const { data: student, error: studentError } = await supabaseAdmin
      .from('profiles')
      .select('device_tokens')
      .eq('id', request.user_id)
      .single();

    // Notify the student about the decision
    const notificationTitle = status === 'approved' 
      ? 'Course Access Granted!' 
      : 'Unlock Request Declined';
    
    const notificationMessage = status === 'approved'
      ? `Your request to unlock "${course?.name}" has been approved. You can now access this course.`
      : `Your request to unlock "${course?.name}" has been declined.`;

    const studentNotification = {
      recipient_id: request.user_id,
      title: notificationTitle,
      message: notificationMessage,
      link: '/student/departments',
      notification_type: status === 'approved' ? 'course_unlocked' : 'unlock_request_rejected',
      data: { courseId: request.course_id, courseName: course?.name },
      is_read: false,
    };

    await supabaseAdmin.from('notifications').insert([studentNotification]);

    // Send push notification to student
    if (!studentError && student) {
      const tokens = Array.isArray(student.device_tokens)
        ? student.device_tokens.map((item: any) => item.token).filter(Boolean)
        : [];

      if (tokens.length > 0 && admin.apps.length > 0) {
        const payload = {
          notification: {
            title: notificationTitle,
            body: notificationMessage,
          },
          data: {
            link: '/student/departments',
            type: status === 'approved' ? 'course_unlocked' : 'unlock_request_rejected',
          },
        };

        await admin.messaging().sendToDevice(tokens, payload).catch((sendError) => {
          console.error('FCM send error:', sendError);
        });
      }
    }

    res.json({ message: `Unlock request ${status}` });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Get all unlock requests (admin only)
router.get('/', authenticate, adminOnly, async (req: AuthRequest, res: Response) => {
  try {
    const { status } = req.query;

    let query = supabaseAdmin
      .from('unlock_requests')
      .select('*, profiles(full_name, email), courses(name)')
      .order('created_at', { ascending: false });

    if (status && status !== 'all') {
      query = query.eq('status', status);
    }

    const { data, error } = await query;

    if (error) throw error;

    res.json(data || []);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Get unlock requests for a specific student (student can see their own)
router.get('/student/:userId', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { userId } = req.params;

    // Only allow students to see their own requests
    if (req.userId !== userId && req.role !== 'admin') {
      return res.status(403).json({ error: 'Forbidden' });
    }

    const { data, error } = await supabaseAdmin
      .from('unlock_requests')
      .select('*, courses(name)')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;

    res.json(data || []);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
