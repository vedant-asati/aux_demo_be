// src/middleware/admin.middleware.ts
import { Request, Response, NextFunction } from 'express';

interface AuthRequest extends Request {
  user?: {
    id: number;
    role: string;
  };
}

export const adminMiddleware = (req: AuthRequest, res: Response, next: NextFunction) => {
  if (req.body.user?.role !== 'ADMIN') {
    return res.status(403).json({ message: 'Admin access required' });
  }
  next();
};
