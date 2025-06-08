// test/unittests/controllers/followController.test.ts
import { Request, Response, NextFunction } from 'express';
import { AppDataSource } from '../../../../src/config/data-source';
import { User } from '../../../../src/entities/User';
import { UserFollow } from '../../../../src/entities/UsertoUserEntities/UserFollow';
import { getUserFollowingController } from '../../../../src/controllers/user/followController';

describe('getUserFollowingController', () => {
  const mockUserRepo = { findOne: jest.fn() };
  const mockFollowRepo = { findOne: jest.fn(), find: jest.fn() };

  beforeAll(() => {
    // Return mock repos based on entity
    jest.spyOn(AppDataSource, 'getRepository')
      .mockImplementation((entity) => {
        if (entity === User) return mockUserRepo as any;
        if (entity === UserFollow) return mockFollowRepo as any;
        throw new Error('Unexpected repository');
      });
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

  it('returns 400 for invalid user id', async () => {
    const req = { params: { id: 'abc' } } as any as Request;
    const res = makeRes();
    const next = makeNext();

    await getUserFollowingController(req, res, next);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ error: 'Invalid user id' });
    expect(next).not.toHaveBeenCalled();
  });

  it('returns 404 if target user not found', async () => {
    mockUserRepo.findOne.mockResolvedValue(null);
    const req = { params: { id: '1' } } as any as Request;
    const res = makeRes();
    const next = makeNext();

    await getUserFollowingController(req, res, next);

    expect(mockUserRepo.findOne).toHaveBeenCalledWith({ where: { id: 1 } });
    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ error: 'User not found' });
    expect(next).not.toHaveBeenCalled();
  });

  it('allows own profile following list regardless of privacy', async () => {
    // user is private
    mockUserRepo.findOne.mockResolvedValue({ id: 5, isPrivate: true } as Partial<User>);
    // rows stub
    const rows = [ { following: { id: 2, username: 'bob', email: 'b@b', createdAt: new Date(), updatedAt: new Date() } } ];
    mockFollowRepo.find.mockResolvedValue(rows as any);

    const req = { params: { id: '5' } } as any as Request;
    (req as any).userId = 5;
    const res = makeRes();
    const next = makeNext();

    await getUserFollowingController(req, res, next);

    expect(mockFollowRepo.find).toHaveBeenCalledWith({
      where: { follower: { id: 5 } },
      relations: ['following'],
    });
    expect(res.json).toHaveBeenCalledWith([
      { id: 2, username: 'bob', email: 'b@b', createdAt: expect.any(Date), updatedAt: expect.any(Date) }
    ]);
    expect(next).not.toHaveBeenCalled();
  });

  it('allows public account following list', async () => {
    mockUserRepo.findOne.mockResolvedValue({ id: 3, isPrivate: false } as Partial<User>);
    const rows = [ { following: { id: 4, username: 'jane', email: 'j@j', createdAt: new Date(), updatedAt: new Date() } } ];
    mockFollowRepo.find.mockResolvedValue(rows as any);

    const req = { params: { id: '3' } } as any as Request;
    (req as any).userId = 9;
    const res = makeRes();
    const next = makeNext();

    await getUserFollowingController(req, res, next);

    expect(res.json).toHaveBeenCalledWith([
      { id: 4, username: 'jane', email: 'j@j', createdAt: expect.any(Date), updatedAt: expect.any(Date) }
    ]);
    expect(next).not.toHaveBeenCalled();
  });

  it('allows private account if requesting user follows them', async () => {
    mockUserRepo.findOne.mockResolvedValue({ id: 7, isPrivate: true } as Partial<User>);
    mockFollowRepo.findOne.mockResolvedValue({});  // indicates follower relation exists
    const rows = [ { following: { id: 8, username: 'sam', email: 's@s', createdAt: new Date(), updatedAt: new Date() } } ];
    mockFollowRepo.find.mockResolvedValue(rows as any);

    const req = { params: { id: '7' } } as any as Request;
    (req as any).userId = 9;
    const res = makeRes();
    const next = makeNext();

    await getUserFollowingController(req, res, next);

    expect(mockFollowRepo.findOne).toHaveBeenCalledWith({
      where: { follower: { id: 9 }, following: { id: 7 } }
    });
    expect(res.json).toHaveBeenCalledWith([
      { id: 8, username: 'sam', email: 's@s', createdAt: expect.any(Date), updatedAt: expect.any(Date) }
    ]);
  });

  it('returns 403 if private account and user does not follow', async () => {
    mockUserRepo.findOne.mockResolvedValue({ id: 10, isPrivate: true } as Partial<User>);
    mockFollowRepo.findOne.mockResolvedValue(null);

    const req = { params: { id: '10' } } as any as Request;
    (req as any).userId = 11;
    const res = makeRes();
    const next = makeNext();

    await getUserFollowingController(req, res, next);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith({ error: 'Profile is private' });
  });

  it('forwards errors to next()', async () => {
    const error = new Error('db fail');
    mockUserRepo.findOne.mockResolvedValue({ id: 12, isPrivate: false } as Partial<User>);
    mockFollowRepo.find.mockRejectedValue(error);

    const req = { params: { id: '12' } } as any as Request;
    (req as any).userId = 5;
    const res = makeRes();
    const next = makeNext();

    await getUserFollowingController(req, res, next);
    expect(next).toHaveBeenCalledWith(error);
  });
});
