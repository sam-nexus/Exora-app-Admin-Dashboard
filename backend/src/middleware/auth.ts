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
  
  console.log('=== AUTHENTICATE MIDDLEWARE ===');
  console.log('Path:', req.path);
  console.log('Auth header:', authHeader ? 'PRESENT' : 'MISSING');

  const token = authHeader?.split(' ')[1];
  if (!token) {
    console.log('No token provided - returning 401');
    return res.status(401).json({ error: 'No token provided' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
    req.userId = decoded.sub;
    req.role = decoded.role;
    
    console.log('Token verified successfully');
    console.log('User ID:', req.userId);
    console.log('Role:', req.role);
    
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