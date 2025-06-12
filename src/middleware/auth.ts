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
    // 1) Get the token from the cookie
    const token = req.cookies?.token;
    if (!token) {
      res.status(401).json({ error: 'Missing or malformed token' });
      return;
    }

    // 2) Verify it
    const payload = jwt.verify(token, process.env.JWT_SECRET!) as JwtPayload;

    // 3) Attach userId to the request object
    req.userId = payload.userId;

    // 4) Continue on to the controller
    next();
  } catch (err) {
    res.status(401).json({ error: 'Invalid or expired token' });
  }
}
