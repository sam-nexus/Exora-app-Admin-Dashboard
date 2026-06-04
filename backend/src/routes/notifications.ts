import { Router, Response } from 'express';
import admin from '../firebase';
import { supabaseAdmin } from '../supabase';
import { authenticate, adminOnly, AuthRequest } from '../middleware/auth';

const router = Router();

router.get('/', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId!;

    const { unread } = req.query;

    let query = supabaseAdmin
      .from('notifications')
      .select('id, recipient_id, title, message, link, is_read, created_at')
      .eq('recipient_id', userId)
      .order('created_at', { ascending: false });

    if (unread === 'true') {
      query = query.eq('is_read', false);
    }

    const { data, error } = await query;

    if (error) throw error;

    // Sync unread count to Firebase
    if (unread === 'true' && admin.apps.length > 0) {
      try {
        const unreadCount = Array.isArray(data) ? data.length : 0;
        const database = admin.database();
        
        await database
          .ref(`notifications/${userId}/unread_count`)
          .set(unreadCount);
      } catch (firebaseError) {
        console.error('Firebase sync error:', firebaseError);
      }
    }

    res.json(data || []);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/', authenticate, adminOnly, async (req: AuthRequest, res: Response) => {
  try {
    const { title, message, recipientId, recipientRole, broadcast, link } = req.body;

    if (!title || !message) {
      return res.status(400).json({ error: 'Notification title and message are required.' });
    }

    const notifications: Array<any> = [];

    if (broadcast) {
      if (!recipientRole || (recipientRole !== 'user' && recipientRole !== 'admin')) {
        return res.status(400).json({ error: 'A valid recipientRole is required for broadcast notifications.' });
      }

      const { data: recipients, error: fetchError } = await supabaseAdmin
        .from('profiles')
        .select('id')
        .eq('role', recipientRole);

      if (fetchError) throw fetchError;
      if (!recipients || recipients.length === 0) {
        return res.status(400).json({ error: 'No recipients found for this role.' });
      }

      recipients.forEach((recipient: any) => {
        notifications.push({
          recipient_id: recipient.id,
          title,
          message,
          link: link || null,
          is_read: false,
        });
      });
    } else {
      if (!recipientId) {
        return res.status(400).json({ error: 'recipientId is required for a single notification.' });
      }

      notifications.push({
        recipient_id: recipientId,
        title,
        message,
        link: link || null,
        is_read: false,
      });
    }

    const { error } = await supabaseAdmin.from('notifications').insert(notifications);
    if (error) throw error;

    const recipientIds = notifications.map((notification) => notification.recipient_id);
    
    // Update Firebase Realtime Database with unread count for each recipient
    if (admin.apps.length > 0) {
      const database = admin.database();
      
      for (const recipientId of recipientIds) {
        try {
          // Get current unread count from Firebase
          const snapshot = await database
            .ref(`notifications/${recipientId}/unread_count`)
            .get();
          
          const currentCount = snapshot.val() || 0;
          const newCount = currentCount + 1;
          
          // Update unread count in Firebase
          await database
            .ref(`notifications/${recipientId}/unread_count`)
            .set(newCount);
          
          // Also trigger a timestamp update to force listener updates
          await database
            .ref(`notifications/${recipientId}/last_updated`)
            .set(new Date().toISOString());
        } catch (firebaseError) {
          console.error('Firebase update error:', firebaseError);
        }
      }
    }

    const { data: recipientProfiles, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('device_tokens')
      .in('id', recipientIds);

    if (!profileError && recipientProfiles) {
      const tokens = recipientProfiles
        .flatMap((profile: any) => Array.isArray(profile.device_tokens) ? profile.device_tokens : [])
        .map((item: any) => item.token)
        .filter(Boolean);

      if (tokens.length && admin.apps.length > 0) {
        const payload = {
          notification: {
            title,
            body: message,
          },
          data: {
            link: link || '',
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

    res.status(201).json({ message: 'Notification created successfully.' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Mark ALL notifications as read for the authenticated user
router.post('/mark-all-read', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId!;

    const { error } = await supabaseAdmin
      .from('notifications')
      .update({ is_read: true })
      .eq('recipient_id', userId)
      .eq('is_read', false);

    if (error) throw error;

    // Reset Firebase unread count to 0
    if (admin.apps.length > 0) {
      try {
        const database = admin.database();
        await database.ref(`notifications/${userId}/unread_count`).set(0);
        await database
          .ref(`notifications/${userId}/last_updated`)
          .set(new Date().toISOString());
      } catch (firebaseError) {
        console.error('Firebase update error:', firebaseError);
      }
    }

    res.json({ message: 'All notifications marked as read.' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.patch('/:id/read', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const notificationId = req.params.id;
    const userId = req.userId!;

    const { data: notification, error: fetchError } = await supabaseAdmin
      .from('notifications')
      .select('recipient_id, is_read')
      .eq('id', notificationId)
      .single();

    if (fetchError || !notification) {
      return res.status(404).json({ error: 'Notification not found.' });
    }

    if (notification.recipient_id !== userId) {
      return res.status(403).json({ error: 'You are not authorized to update this notification.' });
    }

    if (notification.is_read) {
      return res.json({ message: 'Notification already marked as read.' });
    }

    const { error: updateError } = await supabaseAdmin
      .from('notifications')
      .update({ is_read: true })
      .eq('id', notificationId);

    if (updateError) throw updateError;

    // Update Firebase Realtime Database - decrement unread count
    if (admin.apps.length > 0) {
      try {
        const database = admin.database();
        
        // Get current unread count
        const snapshot = await database
          .ref(`notifications/${userId}/unread_count`)
          .get();
        
        const currentCount = snapshot.val() || 0;
        const newCount = Math.max(0, currentCount - 1);
        
        // Update unread count in Firebase
        await database
          .ref(`notifications/${userId}/unread_count`)
          .set(newCount);
        
        // Update timestamp to force listener updates
        await database
          .ref(`notifications/${userId}/last_updated`)
          .set(new Date().toISOString());
      } catch (firebaseError) {
        console.error('Firebase update error:', firebaseError);
      }
    }

    res.json({ message: 'Notification marked as read.' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
