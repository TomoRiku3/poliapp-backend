// src/controllers/postController.ts
// test/unittests/controllers/userController.test.ts

// 1) Mock canViewUserProfile policy
jest.mock('../../../../src/policies/userProfilePolicy', () => ({
  canViewUserProfile: jest.fn()
}));

import { Request, Response, NextFunction } from 'express';
import { AppDataSource } from '../../../../src/config/data-source';
import {
  getMeController,
  getUserByIdController
} from '../../../../src/controllers/user/userController';
import { User } from '../../../../src/entities/User';
import { canViewUserProfile } from '../../../../src/policies/userProfilePolicy';

describe('userController', () => {
  const mockUserRepo = { findOne: jest.fn() };
  const mockPostRepo = { findAndCount: jest.fn() };

  beforeAll(() => {
    jest.spyOn(AppDataSource, 'getRepository').mockImplementation((entity: any) => {
      if (entity.name === 'User') return mockUserRepo as any;
      if (entity.name === 'Post') return mockPostRepo as any;
      throw new Error(`Unexpected repository: ${entity.name}`);
    });
  });

  beforeEach(() => {
    jest.clearAllMocks();
    // default: allow viewing
    (canViewUserProfile as jest.Mock).mockResolvedValue(true);
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

  describe('getMeController', () => {
    it('returns 404 if user is not found', async () => {
      mockUserRepo.findOne.mockResolvedValue(null);
      const req = { params: {}, query: {} } as any as Request;
      (req as any).userId = 123;
      const res = makeRes();
      const next = makeNext();

      await getMeController(req, res, next);

      expect(mockUserRepo.findOne).toHaveBeenCalledWith({ where: { id: 123 } });
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ error: 'User not found' });
      expect(next).not.toHaveBeenCalled();
    });

    it('returns user profile and paginated posts when found', async () => {
      const fakeUser = {
        id: 5,
        username: 'tester',
        email: 't@example.com',
        passwordHash: 'h',
        createdAt: new Date('2025-06-08'),
        updatedAt: new Date('2025-06-09')
      } as User;
      mockUserRepo.findOne.mockResolvedValue(fakeUser);

      const fakePosts = [{ id: 1 }, { id: 2 }];
      mockPostRepo.findAndCount.mockResolvedValue([fakePosts, 20]);

      const req = { params: {}, query: {} } as any as Request;
      (req as any).userId = 5;
      const res = makeRes();
      const next = makeNext();

      await getMeController(req, res, next);

      expect(mockUserRepo.findOne).toHaveBeenCalledWith({ where: { id: 5 } });
      expect(mockPostRepo.findAndCount).toHaveBeenCalledWith({
        where: { author: { id: 5 } },
        relations: ['media'],
        order: { createdAt: 'DESC' },
        skip: 0,
        take: 10
      });

      expect(res.json).toHaveBeenCalledWith({
        id: 5,
        username: 'tester',
        email: 't@example.com',
        createdAt: fakeUser.createdAt,
        updatedAt: fakeUser.updatedAt,
        page: 1,
        limit: 10,
        total: 20,
        posts: fakePosts
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('forwards errors to next()', async () => {
      const error = new Error('db error');
      mockUserRepo.findOne.mockRejectedValue(error);
      const req = { params: {}, query: {} } as any as Request;
      (req as any).userId = 7;
      const res = makeRes();
      const next = makeNext();

      await getMeController(req, res, next);
      expect(next).toHaveBeenCalledWith(error);
    });
  });

  describe('getUserByIdController', () => {
    it('returns 400 if id is not a number', async () => {
      const req = { params: { id: 'abc' }, query: {} } as any as Request;
      const res = makeRes();
      const next = makeNext();

      await getUserByIdController(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ error: 'Invalid user id' });
      expect(next).not.toHaveBeenCalled();
    });

    it('returns 404 if user not found', async () => {
      mockUserRepo.findOne.mockResolvedValue(null);
      const req = { params: { id: '10' }, query: {} } as any as Request;
      const res = makeRes();
      const next = makeNext();

      await getUserByIdController(req, res, next);

      expect(mockUserRepo.findOne).toHaveBeenCalledWith({ where: { id: 10 } });
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ error: 'User not found' });
      expect(next).not.toHaveBeenCalled();
    });

    it('returns user profile and paginated, filtered posts when found', async () => {
      const fakeUser = {
        id: 42,
        username: 'foo',
        email: 'foo@bar.com',
        passwordHash: 'h',
        createdAt: new Date('2025-06-01'),
        updatedAt: new Date('2025-06-02')
      } as User;
      mockUserRepo.findOne.mockResolvedValue(fakeUser);

      const fakePosts = [ { id: 3 }, { id: 4 }, { id: 5 } ];
      mockPostRepo.findAndCount.mockResolvedValue([ fakePosts, 15 ]);

      const req = { params: { id: '42' }, query: { page: '2', limit: '5' } } as any as Request;
      (req as any).userId = 100;
      const res = makeRes();
      const next = makeNext();

      await getUserByIdController(req, res, next);

      expect(mockUserRepo.findOne).toHaveBeenCalledWith({ where: { id: 42 } });
      expect(mockPostRepo.findAndCount).toHaveBeenCalledWith({
        where: { author: { id: 42 } },
        relations: ['media'],
        order: { createdAt: 'DESC' },
        skip: 5,
        take: 5
      });

      expect(res.json).toHaveBeenCalledWith({
        id: 42,
        username: 'foo',
        email: 'foo@bar.com',
        createdAt: fakeUser.createdAt,
        updatedAt: fakeUser.updatedAt,
        page: 2,
        limit: 5,
        total: 15,
        posts: [ { id: 3 }, {id: 4}, { id: 5 } ]
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('forwards errors to next()', async () => {
      const error = new Error('db failure');
      mockUserRepo.findOne.mockRejectedValue(error);
      const req = { params: { id: '99' }, query: {} } as any as Request;
      (req as any).userId = 100;
      const res = makeRes();
      const next = makeNext();

      await getUserByIdController(req, res, next);
      expect(next).toHaveBeenCalledWith(error);
    });
  });
});
