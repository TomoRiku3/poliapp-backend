// test/unittests/controllers/followRequestController.test.ts

// 1) Fake repos
const mockUserRepo = { findOne: jest.fn() };
const mockFollowReqRepo = { findOne: jest.fn(), create: jest.fn(), save: jest.fn() };
const mockFollowRepo = { create: jest.fn(), save: jest.fn() };
const mockNotifRepo = { create: jest.fn(), save: jest.fn() };
const mockBlockRepo     = { findOne: jest.fn().mockResolvedValue(null) };

// 2) Mock data-source *before* importing controllers
jest.mock('../../../src/config/data-source', () => ({
  AppDataSource: {
    getRepository: (entity: any) => {
      switch (entity.name) {
        case 'User':          return mockUserRepo;
        case 'FollowRequest': return mockFollowReqRepo;
        case 'UserFollow':    return mockFollowRepo;
        case 'Notification':  return mockNotifRepo;
        case 'UserBlock':     return mockBlockRepo;
        default:
          throw new Error(`Unexpected repository: ${entity.name}`);
      }
    }
  }
}));

import { Request, Response, NextFunction } from 'express';
import { FollowRequestStatus } from '../../../src/entities/UsertoUserEntities/FollowRequest';
import { NotificationType } from '../../../src/entities/Notification';
import {
  createFollowRequestController,
  acceptFollowRequestController,
  rejectFollowRequestController
} from '../../../src/controllers/user/followRequestController';

// Helpers
function makeRes() {
  const res: Partial<Response> = {};
  res.status = jest.fn().mockReturnValue(res as Response);
  res.json   = jest.fn().mockReturnValue(res as Response);
  return res as Response;
}
function makeNext() { return jest.fn() as NextFunction; }

// Tests
describe('createFollowRequestController', () => {
  beforeEach(() => jest.clearAllMocks());

  it('400: invalid target id', async () => {
    const req = { params: { id: 'abc' } } as any as Request;
    const res = makeRes(), next = makeNext();
    await createFollowRequestController(req, res, next);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ error: 'Invalid user id' });
  });

  it('201: follow public user', async () => {
    mockUserRepo.findOne.mockResolvedValue({ id: 3, isPrivate: false });
    const req = { params: { id: '3' } } as any as Request;
    (req as any).userId = 1;
    const res = makeRes(), next = makeNext();

    await createFollowRequestController(req, res, next);

    expect(mockFollowRepo.create).toHaveBeenCalledWith({ follower: { id: 1 }, following: { id: 3 } });
    expect(mockFollowRepo.save).toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith({ message: 'Followed successfully' });
  });

  it('204: silently ignores when target has blocked requester', async () => {
    // Arrange: target exists and is not private (privacy doesn’t matter for block check)
    mockUserRepo.findOne.mockResolvedValue({ id: 3, isPrivate: false });
    // NEW: simulate that targetId (3) has blocked requesterId (1)
    mockBlockRepo.findOne.mockResolvedValue({ id: 42 });

    const req = { params: { id: '3' } } as any as Request;
    (req as any).userId = 1;

    const res = makeRes();
    // stub out .end()
    res.end = jest.fn().mockReturnValue(res as Response);

    const next = makeNext();

    // Act
    await createFollowRequestController(req, res, next);

    // Assert
    expect(mockBlockRepo.findOne).toHaveBeenCalledWith({
      where: { blocker: { id: 3 }, blocked: { id: 1 } }
    });
    expect(res.status).toHaveBeenCalledWith(204);
    expect(res.end).toHaveBeenCalled();
    expect(res.json).not.toHaveBeenCalled();
  });
});


describe('acceptFollowRequestController', () => {
  beforeEach(() => jest.clearAllMocks());

  it('201: accepts and notifies', async () => {
    const fr = { id: 13, status: FollowRequestStatus.PENDING, requester: { id: 1 }, target: { id: 2 } } as any;
    mockFollowReqRepo.findOne.mockResolvedValue(fr);
    const req = { params: { requestId: '13' } } as any as Request;
    (req as any).userId = 2;
    const res = makeRes(), next = makeNext();

    await acceptFollowRequestController(req, res, next);

    expect(mockFollowReqRepo.save).toHaveBeenCalledWith(expect.objectContaining({ status: FollowRequestStatus.ACCEPTED }));
    expect(mockFollowRepo.create).toHaveBeenCalledWith({ follower: { id: 1 }, following: { id: 2 } });
    expect(mockFollowRepo.save).toHaveBeenCalled();
    expect(mockNotifRepo.create).toHaveBeenCalledWith({ user: { id: 1 }, type: NotificationType.REQUEST_ACCEPTED, data: { by: 2 } });
    expect(mockNotifRepo.save).toHaveBeenCalled();
    expect(res.json).toHaveBeenCalledWith({ message: 'Follow request accepted' });
  });
});


describe('rejectFollowRequestController', () => {
  beforeEach(() => jest.clearAllMocks());

  it('201: rejects the request', async () => {
    const fr = { id: 23, status: FollowRequestStatus.PENDING, target: { id: 7 } } as any;
    mockFollowReqRepo.findOne.mockResolvedValue(fr);
    const req = { params: { requestId: '23' } } as any as Request;
    (req as any).userId = 7;
    const res = makeRes(), next = makeNext();

    await rejectFollowRequestController(req, res, next);

    expect(mockFollowReqRepo.save).toHaveBeenCalledWith(expect.objectContaining({ status: FollowRequestStatus.REJECTED }));
    expect(res.json).toHaveBeenCalledWith({ message: 'Follow request rejected' });
  });
});
