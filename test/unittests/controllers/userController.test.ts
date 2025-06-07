// test/unittests/controllers/userController.test.ts
import { Request, Response, NextFunction } from 'express';
import { AppDataSource } from '../../../src/config/data-source';
import { getMeController } from '../../../src/controllers/user/userController';
import { User } from '../../../src/entities/User';

describe('userController', () => {
  const mockUserRepo = {
    findOne: jest.fn(),
  };

  beforeAll(() => {
    // Stub AppDataSource.getRepository to return our mock repo
    jest.spyOn(AppDataSource, 'getRepository').mockReturnValue(mockUserRepo as any);
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  // Helper to create a fake res
  function makeRes() {
    const res: Partial<Response> = {};
    res.status = jest.fn().mockReturnValue(res as Response);
    res.json = jest.fn().mockReturnValue(res as Response);
    return res as Response;
  }

  // Helper to create a fake next
  function makeNext() {
    return jest.fn() as NextFunction;
  }

  it('returns 404 if user is not found', async () => {
    mockUserRepo.findOne.mockResolvedValue(null);

    const req = { body: {}, headers: {}, params: {}, query: {} } as Request;
    // Attach a dummy userId on the request as authMiddleware would
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
    const fakeUser: Partial<User> = {
      id: 5,
      username: 'tester',
      email: 'tester@example.com',
      passwordHash: 'secret',
      createdAt: new Date('2025-06-07T12:00:00Z'),
      updatedAt: new Date('2025-06-07T12:00:00Z'),
    };
    mockUserRepo.findOne.mockResolvedValue(fakeUser as User);

    const req = {} as Request;
    (req as any).userId = 5;
    const res = makeRes();
    const next = makeNext();

    await getMeController(req, res, next);

    expect(mockUserRepo.findOne).toHaveBeenCalledWith({ where: { id: 5 } });
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
