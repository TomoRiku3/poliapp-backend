// src/middleware/auth.ts
import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

interface JwtPayload {
  userId: number;
}

export function authMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  try {
    // 1) Get the token from the header (or cookie)
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      res.status(401).json({ error: 'Missing or malformed token' });
      return;
    }
    const token = authHeader.slice(7); // remove "Bearer "

    // 2) Verify it
    const payload = jwt.verify(token, process.env.JWT_SECRET!) as JwtPayload;

    // 3) Attach userId to the request object
    ;(req as any).userId = payload.userId; 

    // 4) Call next to move on to the controller
    next();
  } catch (err) {
    res.status(401).json({ error: 'Invalid or expired token' });
  }
}
