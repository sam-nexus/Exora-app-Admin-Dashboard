import { error } from 'console';
import { Request, Response, NextFunction } from 'express';
import * as jwt from 'jsonwebtoken';
import { supabaseAdmin } from '../supabase';

export interface AuthRequest extends Request {
  userId?: string;
  role?: string;
  file?: Express.Multer.File;  // 👈 added for multer
}

// export const authenticate = (req: AuthRequest, res: Response, next: NextFunction) => {
//   const token = req.headers.authorization?.split(' ')[1];
//   if (!token) return res.status(401).json({ error: 'No token provided' });

//   try {
//     const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
//     req.userId = decoded.sub;
//     req.role = decoded.role;
//     next();
//   } catch (err) {
//     return res.status(401).json({ error: 'Invalid token' });
//   }
// };

export const authenticate = async (req: AuthRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;

  const token = authHeader?.split(' ')[1];
  if (!token) {
    return res.status(401).json({ error: 'No token provided' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
    req.userId = decoded.sub;
    req.role = decoded.role;

    // Update last active timestamp (only on API calls, skip static files)
    if (!req.path.includes('.')) {
      await supabaseAdmin
        .from('profiles')
        .update({ session_last_active: new Date().toISOString() })
        .eq('id', decoded.sub)
        .eq('active_session_token', token); // Only update if session is still valid
    }

    next();
  } catch (error: any) {

    return res.status(401).json({ error: 'Invalid token' });
  }
};

export const adminOnly = (req: AuthRequest, res: Response, next: NextFunction) => {
  if (req.role !== 'admin') return res.status(403).json({ error: 'Admin access required' });
  next();
};