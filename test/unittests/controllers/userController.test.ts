// test/unittests/controllers/userController.test.ts
import { Request, Response, NextFunction } from 'express';
import { AppDataSource } from '../../../src/config/data-source';
import { getMeController, getUserByIdController } from '../../../src/controllers/user/userController';
import { User } from '../../../src/entities/User';

describe('userController', () => {
  const mockUserRepo = { findOne: jest.fn() };

  beforeAll(() => {
    // Stub the repository returned by TypeORM
    jest.spyOn(AppDataSource, 'getRepository').mockReturnValue(mockUserRepo as any);
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  function makeRes() {
    const res: Partial<Response> = {};
    res.status = jest.fn().mockReturnValue(res as Response);
    res.json = jest.fn().mockReturnValue(res as Response);
    return res as Response;
  }
  
  function makeNext() {
    return jest.fn() as NextFunction;
  }

  describe('getMeController', () => {
    it('returns 404 if user is not found', async () => {
      mockUserRepo.findOne.mockResolvedValue(null);
      const req = { params: {}, body: {}, headers: {}, query: {} } as Request;
      (req as any).userId = 123;
      const res = makeRes();
      const next = makeNext();

      await getMeController(req, res, next);

      expect(mockUserRepo.findOne).toHaveBeenCalledWith({ where: { id: 123 } });
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ error: 'User not found' });
      expect(next).not.toHaveBeenCalled();
    });

    it('returns user profile when found', async () => {
      const fakeUser = { id: 5, username: 'tester', email: 't@example.com', passwordHash: 'h', createdAt: new Date(), updatedAt: new Date() } as User;
      mockUserRepo.findOne.mockResolvedValue(fakeUser);
      const req = {} as Request;
      (req as any).userId = 5;
      const res = makeRes();
      const next = makeNext();

      await getMeController(req, res, next);

      expect(res.json).toHaveBeenCalledWith({
        id: fakeUser.id,
        username: fakeUser.username,
        email: fakeUser.email,
        createdAt: fakeUser.createdAt,
        updatedAt: fakeUser.updatedAt,
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('forwards errors to next()', async () => {
      const error = new Error('db error');
      mockUserRepo.findOne.mockRejectedValue(error);
      const req = {} as Request;
      (req as any).userId = 7;
      const res = makeRes();
      const next = makeNext();

      await getMeController(req, res, next);
      expect(next).toHaveBeenCalledWith(error);
    });
  });

  describe('getUserByIdController', () => {
    it('returns 400 if id is not a number', async () => {
      const req = { params: { id: 'abc' } } as any as Request;
      const res = makeRes();
      const next = makeNext();

      await getUserByIdController(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ error: 'Invalid user id' });
      expect(next).not.toHaveBeenCalled();
    });

    it('returns 404 if user not found', async () => {
      mockUserRepo.findOne.mockResolvedValue(null);
      const req = { params: { id: '10' } } as any as Request;
      const res = makeRes();
      const next = makeNext();

      await getUserByIdController(req, res, next);

      expect(mockUserRepo.findOne).toHaveBeenCalledWith({ where: { id: 10 } });
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ error: 'User not found' });
      expect(next).not.toHaveBeenCalled();
    });

    it('returns user profile when found', async () => {
      const fakeUser = { id: 42, username: 'foo', email: 'foo@bar.com', passwordHash: 'h', createdAt: new Date(), updatedAt: new Date() } as User;
      mockUserRepo.findOne.mockResolvedValue(fakeUser);
      const req = { params: { id: '42' } } as any as Request;
      const res = makeRes();
      const next = makeNext();

      await getUserByIdController(req, res, next);

      expect(mockUserRepo.findOne).toHaveBeenCalledWith({ where: { id: 42 } });
      expect(res.json).toHaveBeenCalledWith({
        id: fakeUser.id,
        username: fakeUser.username,
        email: fakeUser.email,
        createdAt: fakeUser.createdAt,
        updatedAt: fakeUser.updatedAt,
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('forwards errors to next()', async () => {
      const error = new Error('db failure');
      mockUserRepo.findOne.mockRejectedValue(error);
      const req = { params: { id: '99' } } as any as Request;
      const res = makeRes();
      const next = makeNext();

      await getUserByIdController(req, res, next);
      expect(next).toHaveBeenCalledWith(error);
    });
  });
});
