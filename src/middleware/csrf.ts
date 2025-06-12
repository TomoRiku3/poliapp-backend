// src/middleware/csrf.ts
import csurf from 'csurf';
import { Request, Response } from 'express';

/**
 * CSRF protection middleware using double-submit cookie pattern.
 * - non-HttpOnly cookie so the client can read the token
 * - enforces token on mutating requests via header/body
 */
export const csrfProtection = csurf({
  cookie: {
    httpOnly: false,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
  },
});

/**
 * Route handler to expose the CSRF token to the client.
 */
export function getCsrfToken(req: Request, res: Response): void {
  res.json({ csrfToken: req.csrfToken() });
}
