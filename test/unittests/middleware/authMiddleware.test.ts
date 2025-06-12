// test/unittests/middleware/authMiddleware.test.ts
import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { authMiddleware } from '../../../src/middleware/auth';

describe('authMiddleware (cookie-based)', () => {
  const mockVerify = jest.spyOn(jwt, 'verify');

  function makeReq(cookieToken?: string) {
    return {
      cookies: cookieToken ? { token: cookieToken } : {},
    } as Partial<Request> as Request;
  }

  function makeRes() {
    const res: Partial<Response> = {};
    res.status = jest.fn().mockReturnValue(res as Response);
    res.json = jest.fn().mockReturnValue(res as Response);
    return res as Response;
  }

  function makeNext() {
    return jest.fn() as NextFunction;
  }

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should return 401 if no cookie.token', () => {
    const req = makeReq();
    const res = makeRes();
    const next = makeNext();

    authMiddleware(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ error: 'Missing or malformed token' });
    expect(next).not.toHaveBeenCalled();
  });

  it('should return 401 if token verification throws', () => {
    const req = makeReq('invalid-token');
    const res = makeRes();
    const next = makeNext();
    mockVerify.mockImplementation(() => { throw new Error('invalid'); });

    authMiddleware(req, res, next);

    expect(mockVerify).toHaveBeenCalledWith('invalid-token', process.env.JWT_SECRET!);
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ error: 'Invalid or expired token' });
    expect(next).not.toHaveBeenCalled();
  });

  it('should call next and set req.userId on valid token', () => {
    const fakePayload = { userId: 42 };
    const req = makeReq('valid-token');
    const res = makeRes();
    const next = makeNext();
    mockVerify.mockReturnValue(fakePayload as any);

    authMiddleware(req, res, next);

    expect(mockVerify).toHaveBeenCalledWith('valid-token', process.env.JWT_SECRET!);
    expect((req as any).userId).toBe(42);
    expect(next).toHaveBeenCalled();
  });
});
