import { Request, Response, NextFunction } from 'express';
import * as jwt from 'jsonwebtoken';
import { supabaseAdmin } from '../supabase';

export interface AuthRequest extends Request {
  userId?: string;
  role?: string;
  file?: Express.Multer.File;
}

export const authenticate = async (req: AuthRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  
  console.log('=== AUTHENTICATE ===');
  console.log('Path:', req.path);
  console.log('Auth header present:', !!authHeader);

  const token = authHeader?.split(' ')[1];
  if (!token) {
    console.log('No token provided');
    return res.status(401).json({ error: 'No token provided' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
    req.userId = decoded.sub;
    req.role = decoded.role;
    
    console.log('Token verified for user:', decoded.sub, 'Role:', decoded.role);

    // Update last active timestamp - wrap in try/catch to prevent failures
    try {
      // Only update if not a logout request to avoid unnecessary DB calls
      if (req.path !== '/logout') {
        await supabaseAdmin
          .from('profiles')
          .update({ session_last_active: new Date().toISOString() })
          .eq('id', decoded.sub);
        // Remove the active_session_token condition - it's causing issues
      }
    } catch (dbError) {
      // Don't fail the request if DB update fails
      console.error('Failed to update last_active:', dbError);
    }

    next();
  } catch (error: any) {
    console.error('Token verification failed:', error.message);
    return res.status(401).json({ error: 'Invalid token' });
  }
};

export const adminOnly = (req: AuthRequest, res: Response, next: NextFunction) => {
  if (req.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }
  next();
};