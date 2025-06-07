// src/middleware/errorHandler.ts
import { Request, Response, NextFunction } from 'express';

export function errorHandler(
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
): void {
  console.error(err);                  // log to console (or use your logger)
  const status = err.status || 500;    // allow custom err.status
  const message = err.message || 'Internal server error';
  res.status(status).json({ error: message });
}
