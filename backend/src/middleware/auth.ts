import { error } from 'console';
import { Request, Response, NextFunction } from 'express';
import * as jwt from 'jsonwebtoken';

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

export const authenticate = (req: AuthRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  console.log('🔐 Auth header present:', !!authHeader);

  const token = authHeader?.split(' ')[1];
  if (!token) {
    console.log('❌ No token found in header');
    return res.status(401).json({ error: 'No token provided' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
    req.userId = decoded.sub;
    req.role = decoded.role;
    console.log('🔐 Token decoded - userId:', req.userId, 'role:', req.role);
    next();
  } catch (error: any) {
    console.log('❌ Token verification failed:', error.message);
    return res.status(401).json({ error: 'Invalid token' });
  }
};

export const adminOnly = (req: AuthRequest, res: Response, next: NextFunction) => {
  if (req.role !== 'admin') return res.status(403).json({ error: 'Admin access required' });
  next();
};