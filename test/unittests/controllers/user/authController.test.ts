// src/controllers/authController.test.ts
// 1) Create your fake repo up front
const mockUserRepo = {
  findOne: jest.fn(),
  create:  jest.fn(),
  save:    jest.fn(),
};

// 2) Tell Jest to mock the data-source module *before* we import the controller
jest.mock('../../../../src/config/data-source', () => ({
  AppDataSource: {
    // every call to getRepository() returns our fake
    getRepository: () => mockUserRepo
  }
}));

import { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { registerController, loginController } from '../../../../src/controllers/authController';
import { User } from '../../../../src/entities/User';

describe('authController (cookie-based)', () => {
  beforeAll(() => {
    // stub bcrypt & jwt
    // @ts-ignore
    jest.spyOn(bcrypt, 'hash').mockResolvedValue('hashedPassword');
    jest.spyOn(bcrypt, 'compare').mockImplementation((pwd, hash) =>
      Promise.resolve(pwd === 'correctPassword')
    );
    // @ts-ignore
    jest.spyOn(jwt, 'sign').mockReturnValue('signedToken');
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  function makeRes() {
    const res: Partial<Response> = {};
    res.status = jest.fn().mockReturnValue(res as Response);
    res.json   = jest.fn().mockReturnValue(res as Response);
    res.cookie = jest.fn().mockReturnValue(res as Response);
    return res as Response;
  }

  function makeNext() {
    return jest.fn() as NextFunction;
  }

  describe('registerController', () => {
    it('returns 400 if any field is missing', async () => {
      const req = { body: { email: 'e', password: 'p' } } as Request;
      const res = makeRes();
      const next = makeNext();

      await registerController(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ error: 'Missing fields' });
      expect(res.cookie).not.toHaveBeenCalled();
      expect(next).not.toHaveBeenCalled();
    });

    it('returns 409 if user already exists', async () => {
      mockUserRepo.findOne.mockResolvedValue({ id: 1, email: 'e', username: 'u' } as User);

      const req = { body: { username: 'u', email: 'e', password: 'p' } } as Request;
      const res = makeRes();
      const next = makeNext();

      await registerController(req, res, next);

      expect(res.status).toHaveBeenCalledWith(409);
      expect(res.json).toHaveBeenCalledWith({ error: 'User already exists' });
      expect(res.cookie).not.toHaveBeenCalled();
    });

    it('creates user, hashes password, sets cookie & returns user', async () => {
      mockUserRepo.findOne.mockResolvedValue(null);
      mockUserRepo.create.mockReturnValue({ id: 42, username: 'u', email: 'e', passwordHash: 'h' });
      mockUserRepo.save.mockResolvedValue({ id: 42, username: 'u', email: 'e' });

      const req = { body: { username: 'u', email: 'e', password: 'p' } } as Request;
      const res = makeRes();
      const next = makeNext();

      await registerController(req, res, next);

      expect(bcrypt.hash).toHaveBeenCalledWith('p', expect.any(Number));
      expect(mockUserRepo.create).toHaveBeenCalledWith({
        username: 'u',
        email: 'e',
        passwordHash: 'hashedPassword',
      });
      expect(mockUserRepo.save).toHaveBeenCalled();

      expect(jwt.sign).toHaveBeenCalledWith(
        { userId: 42 },
        process.env.JWT_SECRET!,
        { expiresIn: '7d' }
      );

      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.cookie).toHaveBeenCalledWith(
        'token',
        'signedToken',
        expect.objectContaining({
          httpOnly: true,
          secure: expect.any(Boolean),
          sameSite: 'lax',
          maxAge: expect.any(Number),
        })
      );
      expect(res.json).toHaveBeenCalledWith({
        user: { id: 42, username: 'u', email: 'e' }
      });
    });

    it('forwards unexpected errors to next()', async () => {
      mockUserRepo.findOne.mockRejectedValue(new Error('db down'));

      const req = { body: { username: 'u', email: 'e', password: 'p' } } as Request;
      const res = makeRes();
      const next = makeNext();

      await registerController(req, res, next);
      expect(next).toHaveBeenCalledWith(expect.any(Error));
    });
  });

  describe('loginController', () => {
    it('returns 400 if missing fields', async () => {
      const req = { body: { email: 'e' } } as Request;
      const res = makeRes();
      const next = makeNext();

      await loginController(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ error: 'Missing fields' });
      expect(res.cookie).not.toHaveBeenCalled();
    });

    it('returns 401 if user not found', async () => {
      mockUserRepo.findOne.mockResolvedValue(null);

      const req = { body: { email: 'e', password: 'p' } } as Request;
      const res = makeRes();
      const next = makeNext();

      await loginController(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ error: 'Invalid credentials' });
      expect(res.cookie).not.toHaveBeenCalled();
    });

    it('returns 401 if password invalid', async () => {
      mockUserRepo.findOne.mockResolvedValue({ id: 1, username: 'u', email: 'e', passwordHash: 'h' } as User);

      const req = { body: { email: 'e', password: 'wrong' } } as Request;
      const res = makeRes();
      const next = makeNext();

      await loginController(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ error: 'Invalid credentials' });
      expect(res.cookie).not.toHaveBeenCalled();
    });

    it('sets cookie & returns user on successful login', async () => {
      mockUserRepo.findOne.mockResolvedValue({ id: 7, username: 'u7', email: 'e7', passwordHash: 'h' } as User);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      const req = { body: { email: 'e7', password: 'correctPassword' } } as Request;
      const res = makeRes();
      const next = makeNext();

      await loginController(req, res, next);

      expect(bcrypt.compare).toHaveBeenCalledWith('correctPassword', 'h');
      expect(jwt.sign).toHaveBeenCalledWith(
        { userId: 7 },
        process.env.JWT_SECRET!,
        { expiresIn: '7d' }
      );
      expect(res.cookie).toHaveBeenCalledWith(
        'token',
        'signedToken',
        expect.objectContaining({
          httpOnly: true,
          secure: expect.any(Boolean),
          sameSite: 'lax',
          maxAge: expect.any(Number),
        })
      );
      expect(res.json).toHaveBeenCalledWith({
        user: { id: 7, username: 'u7', email: 'e7' }
      });
    });

    it('forwards errors to next()', async () => {
      (mockUserRepo.findOne as jest.Mock).mockRejectedValue(new Error('db error'));

      const req = { body: { email: 'e', password: 'p' } } as Request;
      const res = makeRes();
      const next = makeNext();

      await loginController(req, res, next);
      expect(next).toHaveBeenCalledWith(expect.any(Error));
    });
  });
});
