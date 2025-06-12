// test/unittests/middleware/csrf.test.ts

/**
 * Unit tests for CSRF middleware configuration and functionality
 */

// 1) Mock the 'csurf' module to observe its usage
jest.mock('csurf');
import csurf from 'csurf';
import { Request, Response, NextFunction } from 'express';

// 2) Create a fake middleware function to be returned by the csurf mock
const fakeCsrfMiddleware = jest.fn((req: Request, res: Response, next: NextFunction) => next());

// 3) Configure the csurf mock to return our fake middleware
(csurf as jest.Mock).mockReturnValue(fakeCsrfMiddleware);

// 4) Import the module under test (must come after jest.mock and mockReturnValue)
import { csrfProtection, getCsrfToken } from '../../../src/middleware/csrf';

describe('CSRF Middleware', () => {
  describe('Configuration via csurf()', () => {
    it('should call csurf() once with correct cookie options', () => {
      // csurf must have been called exactly once during module initialization
      expect(csurf).toHaveBeenCalledTimes(1);

      // Extract the argument passed into csurf()
      const configArg = (csurf as jest.Mock).mock.calls[0][0];

      // Validate cookie options
      expect(configArg).toHaveProperty('cookie.httpOnly', false);
      expect(configArg).toHaveProperty('cookie.sameSite', 'lax');
      expect(configArg).toHaveProperty('cookie.secure', process.env.NODE_ENV === 'production');
    });

    it('should export the middleware returned by csurf()', () => {
      // csrfProtection must be our fake middleware
      expect(csrfProtection).toBe(fakeCsrfMiddleware);
    });
  });

  describe('getCsrfToken()', () => {
    it('should invoke req.csrfToken() and send JSON payload', () => {
      // Arrange: stub req.csrfToken() and res.json()
      const req = { csrfToken: jest.fn().mockReturnValue('fake-token-123') } as any as Request;
      const res: Partial<Response> = { json: jest.fn() };
      const next: NextFunction = jest.fn();

      // Act: call the handler
      getCsrfToken(req, res as Response);

      // Assert: ensure the token generator and JSON response are called correctly
      expect(req.csrfToken).toHaveBeenCalledTimes(1);
      expect(res.json).toHaveBeenCalledWith({ csrfToken: 'fake-token-123' });
    });
  });
});
