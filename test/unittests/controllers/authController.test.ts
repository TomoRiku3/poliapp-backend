// 1) Create your fake repo up front
const mockUserRepo = {
  findOne: jest.fn(),
  create:  jest.fn(),
  save:    jest.fn(),
};

// 2) Tell Jest to mock the data-source module *before* we import the controller
jest.mock('../../../src/config/data-source', () => ({
  AppDataSource: {
    // every call to getRepository() returns our fake
    getRepository: () => mockUserRepo
  }
}));

// src/controllers/authController.test.ts
import { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { AppDataSource } from '../../../src/config/data-source';
import { registerController, loginController } from '../../../src/controllers/authController';
import { User } from '../../../src/entities/User';

describe('authController', () => {
  beforeAll(() => {
    // @ts-ignore: we know this returns a Promise<string> in our code
    // stub bcrypt & jwt
    jest.spyOn(bcrypt, 'hash').mockResolvedValue('hashedPassword');
    jest.spyOn(bcrypt, 'compare').mockImplementation((pwd, hash) =>
      Promise.resolve(pwd === 'correctPassword')
    );
    // @ts-ignore: we know this returns a Promise<string> in our code
    jest.spyOn(jwt, 'sign').mockReturnValue('signedToken');
    
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  function makeRes() {
    const res: Partial<Response> = {};
    res.status = jest.fn().mockReturnValue(res as Response);
    res.json   = jest.fn().mockReturnValue(res as Response);
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
    });

    it('creates user, hashes password, returns token & user', async () => {
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
      expect(jwt.sign).toHaveBeenCalledWith({ userId: 42 }, process.env.JWT_SECRET!, { expiresIn: '7d' });
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({
        token: 'signedToken',
        user: { id: 42, username: 'u', email: 'e' },
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
    });

    it('returns 401 if user not found', async () => {
      mockUserRepo.findOne.mockResolvedValue(null);

      const req = { body: { email: 'e', password: 'p' } } as Request;
      const res = makeRes();
      const next = makeNext();

      await loginController(req, res, next);
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ error: 'Invalid credentials' });
    });

    it('returns 401 if password invalid', async () => {
      mockUserRepo.findOne.mockResolvedValue({ id: 1, username: 'u', email: 'e', passwordHash: 'h' } as User);
      // bcrypt.compare will return false for any password !== 'correctPassword'
      const req = { body: { email: 'e', password: 'wrong' } } as Request;
      const res = makeRes();
      const next = makeNext();

      await loginController(req, res, next);
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ error: 'Invalid credentials' });
    });

    it('returns token & user on successful login', async () => {
      mockUserRepo.findOne.mockResolvedValue({ id: 7, username: 'u7', email: 'e7', passwordHash: 'h' } as User);
      // simulate correct password
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      const req = { body: { email: 'e7', password: 'correctPassword' } } as Request;
      const res = makeRes();
      const next = makeNext();

      await loginController(req, res, next);
      expect(bcrypt.compare).toHaveBeenCalledWith('correctPassword', 'h');
      expect(jwt.sign).toHaveBeenCalledWith({ userId: 7 }, process.env.JWT_SECRET!, { expiresIn: '7d' });
      expect(res.json).toHaveBeenCalledWith({
        token: 'signedToken',
        user: { id: 7, username: 'u7', email: 'e7' },
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
