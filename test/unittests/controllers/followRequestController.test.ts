// test/unittests/controllers/followRequestController.test.ts

// 1) Create your fake repos up front
const mockUserRepo = { findOne: jest.fn() };
const mockFollowReqRepo = { findOne: jest.fn(), create: jest.fn(), save: jest.fn() };
const mockFollowRepo = { create: jest.fn(), save: jest.fn() };
const mockNotifRepo = { create: jest.fn(), save: jest.fn() };

// 2) Mock the data-source module *before* importing the controllers
jest.mock('../../../src/config/data-source', () => ({
  AppDataSource: {
    getRepository: (entity: any) => {
      switch (entity.name) {
        case 'User':          return mockUserRepo;
        case 'FollowRequest': return mockFollowReqRepo;
        case 'UserFollow':    return mockFollowRepo;
        case 'Notification':  return mockNotifRepo;
        default:
          throw new Error(`Unexpected repository: ${entity.name}`);
      }
    }
  }
}));

import { Request, Response, NextFunction } from 'express';
import { AppDataSource } from '../../../src/config/data-source';
import { User } from '../../../src/entities/User';
import { UserFollow } from '../../../src/entities/UserFollow';
import { FollowRequest, FollowRequestStatus } from '../../../src/entities/FollowRequest';
import { Notification, NotificationType } from '../../../src/entities/Notification';
import {
  createFollowRequestController,
  acceptFollowRequestController,
  rejectFollowRequestController
} from '../../../src/controllers/user/followRequestController';

describe('FollowRequestController', () => {
  const mockUserRepo = { findOne: jest.fn() };
  const mockFollowReqRepo = { findOne: jest.fn(), create: jest.fn(), save: jest.fn() };
  const mockFollowRepo = { create: jest.fn(), save: jest.fn() };
  const mockNotifRepo = { create: jest.fn(), save: jest.fn() };

  beforeAll(() => {
    jest.spyOn(AppDataSource, 'getRepository').mockImplementation((entity) => {
      if (entity === User) return mockUserRepo as any;
      if (entity === FollowRequest) return mockFollowReqRepo as any;
      if (entity === UserFollow) return mockFollowRepo as any;
      if (entity === Notification) return mockNotifRepo as any;
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

  describe('createFollowRequestController', () => {
    it('400: invalid target id', async () => {
      const req = { params: { id: 'abc' } } as any as Request;
      const res = makeRes(); const next = makeNext();
      await createFollowRequestController(req, res, next);
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ error: 'Invalid user id' });
    });

    it('400: cannot follow yourself', async () => {
      const req = { params: { id: '5' } } as any as Request;
      (req as any).userId = 5;
      const res = makeRes(); const next = makeNext();
      await createFollowRequestController(req, res, next);
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ error: 'Cannot follow yourself' });
    });

    it('404: target not found', async () => {
      mockUserRepo.findOne.mockResolvedValue(null);
      const req = { params: { id: '2' } } as any as Request;
      (req as any).userId = 1;
      const res = makeRes(); const next = makeNext();
      await createFollowRequestController(req, res, next);
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ error: 'User not found' });
    });

    it('409: pending request exists', async () => {
      mockUserRepo.findOne.mockResolvedValue({ id: 2, isPrivate: true } as Partial<User>);
      mockFollowReqRepo.findOne.mockResolvedValue({} as Partial<FollowRequest>);
      const req = { params: { id: '2' } } as any as Request;
      (req as any).userId = 1;
      const res = makeRes(); const next = makeNext();
      await createFollowRequestController(req, res, next);
      expect(res.status).toHaveBeenCalledWith(409);
      expect(res.json).toHaveBeenCalledWith({ error: 'Follow request already pending' });
    });

    it('201: follow public user', async () => {
      mockUserRepo.findOne.mockResolvedValue({ id: 3, isPrivate: false } as Partial<User>);
      const req = { params: { id: '3' } } as any as Request;
      (req as any).userId = 1;
      const res = makeRes(); const next = makeNext();
      await createFollowRequestController(req, res, next);
      expect(mockFollowRepo.create).toHaveBeenCalledWith({ follower: { id: 1 }, following: { id: 3 } });
      expect(mockFollowRepo.save).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({ message: 'Followed successfully' });
    });

    it('201: send request and notification for private user', async () => {
      mockUserRepo.findOne.mockResolvedValue({ id: 4, isPrivate: true } as Partial<User>);
      mockFollowReqRepo.findOne.mockResolvedValue(null);
      const createdReq = { id: 20 } as Partial<FollowRequest>;
      mockFollowReqRepo.create.mockReturnValue(createdReq as FollowRequest);
      const req = { params: { id: '4' } } as any as Request;
      (req as any).userId = 1;
      const res = makeRes(); const next = makeNext();
      await createFollowRequestController(req, res, next);
      expect(mockFollowReqRepo.create).toHaveBeenCalledWith({ requester: { id: 1 }, target: { id: 4 } });
      expect(mockFollowReqRepo.save).toHaveBeenCalledWith(createdReq);
      expect(mockNotifRepo.create).toHaveBeenCalledWith({ user: { id: 4 }, type: NotificationType.FOLLOW_REQUEST, data: { from: 1 } });
      expect(mockNotifRepo.save).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({ message: 'Follow request sent' });
    });

    it('forwards errors to next', async () => {
      const error = new Error('oops');
      mockUserRepo.findOne.mockResolvedValue({ id: 5, isPrivate: false } as Partial<User>);
      mockFollowRepo.save.mockRejectedValue(error);
      const req = { params: { id: '5' } } as any as Request;
      (req as any).userId = 1;
      const res = makeRes(); const next = makeNext();
      await createFollowRequestController(req, res, next);
      expect(next).toHaveBeenCalledWith(error);
    });
  });

  describe('acceptFollowRequestController', () => {
    it('400: invalid request id', async () => {
      const req = { params: { requestId: 'abc' } } as any as Request;
      const res = makeRes(); const next = makeNext();
      await acceptFollowRequestController(req, res, next);
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ error: 'Invalid request id' });
    });

    it('404: request not found', async () => {
      mockFollowReqRepo.findOne.mockResolvedValue(null);
      const req = { params: { requestId: '10' } } as any as Request;
      (req as any).userId = 2;
      const res = makeRes(); const next = makeNext();
      await acceptFollowRequestController(req, res, next);
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ error: 'Request not found' });
    });

    it('403: not target', async () => {
      const fr = { id: 11, status: FollowRequestStatus.PENDING, requester: { id: 1 } as User, target: { id: 3 } as User } as FollowRequest;
      mockFollowReqRepo.findOne.mockResolvedValue(fr);
      const req = { params: { requestId: '11' } } as any as Request;
      (req as any).userId = 2;
      const res = makeRes(); const next = makeNext();
      await acceptFollowRequestController(req, res, next);
      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({ error: 'Not authorized' });
    });

    it('409: already handled', async () => {
      const fr = { id: 12, status: FollowRequestStatus.ACCEPTED, requester: { id: 1 } as User, target: { id: 2 } as User } as FollowRequest;
      mockFollowReqRepo.findOne.mockResolvedValue(fr);
      const req = { params: { requestId: '12' } } as any as Request;
      (req as any).userId = 2;
      const res = makeRes(); const next = makeNext();
      await acceptFollowRequestController(req, res, next);
      expect(res.status).toHaveBeenCalledWith(409);
      expect(res.json).toHaveBeenCalledWith({ error: 'Request already handled' });
    });

    it('201: accepts and notifies', async () => {
      const fr = { id: 13, status: FollowRequestStatus.PENDING, requester: { id: 1 } as User, target: { id: 2 } as User } as FollowRequest;
      mockFollowReqRepo.findOne.mockResolvedValue(fr);
      const req = { params: { requestId: '13' } } as any as Request;
      (req as any).userId = 2;
      const res = makeRes(); const next = makeNext();

      await acceptFollowRequestController(req, res, next);
      expect(mockFollowReqRepo.save).toHaveBeenCalledWith(expect.objectContaining({ status: FollowRequestStatus.ACCEPTED }));
      expect(mockFollowRepo.create).toHaveBeenCalledWith({ follower: { id: 1 }, following: { id: 2 } });
      expect(mockFollowRepo.save).toHaveBeenCalled();
      expect(mockNotifRepo.create).toHaveBeenCalledWith({ user: { id: 1 }, type: NotificationType.REQUEST_ACCEPTED, data: { by: 2 } });
      expect(mockNotifRepo.save).toHaveBeenCalled();
      expect(res.json).toHaveBeenCalledWith({ message: 'Follow request accepted' });
    });

    it('forwards errors to next', async () => {
      const error = new Error('oops');
      const fr = { id: 14, status: FollowRequestStatus.PENDING, requester: { id: 1 } as User, target: { id: 2 } as User } as FollowRequest;
      mockFollowReqRepo.findOne.mockResolvedValue(fr);
      mockFollowRepo.save.mockRejectedValue(error);
      const req = { params: { requestId: '14' } } as any as Request;
      (req as any).userId = 2;
      const res = makeRes(); const next = makeNext();
      await acceptFollowRequestController(req, res, next);
      expect(next).toHaveBeenCalledWith(error);
    });

    it('201: rejects the request', async () => {
      const fr = { id: 23, status: FollowRequestStatus.PENDING, target: { id: 7 } as User } as any as FollowRequest;
      mockFollowReqRepo.findOne.mockResolvedValue(fr);
      const req = { params: { requestId: '23' } } as any as Request;
      (req as any).userId = 7;
      const res = makeRes(); const next = makeNext();
      await rejectFollowRequestController(req, res, next);
      expect(mockFollowReqRepo.save).toHaveBeenCalledWith(expect.objectContaining({ status: FollowRequestStatus.REJECTED }));
      expect(res.json).toHaveBeenCalledWith({ message: 'Follow request rejected' });
    });

    it('forward errors on reject', async () => {
      const error = new Error('fail');
      const fr = { id: 24, status: FollowRequestStatus.PENDING, target: { id: 8 } as User } as any as FollowRequest;
      mockFollowReqRepo.findOne.mockResolvedValue(fr);
      mockFollowReqRepo.save.mockRejectedValue(error);
      const req = { params: { requestId: '24' } } as any as Request;
      (req as any).userId = 8;
      const res = makeRes(); const next = makeNext();
      await rejectFollowRequestController(req, res, next);
      expect(next).toHaveBeenCalledWith(error);
    });
  });
});
