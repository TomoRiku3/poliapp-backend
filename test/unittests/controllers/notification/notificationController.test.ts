// test/unittests/controllers/notificationController.test.ts

// 1) Fake repo
const mockNotifRepo = {
  findOne: jest.fn(),
  save: jest.fn(),
  count: jest.fn(),
  findAndCount: jest.fn()
};

// 2) Mock data-source *before* importing controllers
jest.mock('../../../../src/config/data-source', () => ({
  AppDataSource: {
    getRepository: (entity: any) => {
      if (entity.name === 'Notification') return mockNotifRepo;
      throw new Error(`Unexpected repository: ${entity.name}`);
    }
  }
}));

import { Request, Response, NextFunction } from 'express';
import {
  markNotificationReadController,
  getUnreadCountController,
  getNotificationsController
} from '../../../../src/controllers/notification/notificationController';

// Helpers
function makeRes() {
  const res: Partial<Response> = {};
  res.status = jest.fn().mockReturnValue(res as Response);
  res.json   = jest.fn().mockReturnValue(res as Response);
  return res as Response;
}
function makeNext(): NextFunction {
  return jest.fn() as NextFunction;
}

describe('markNotificationReadController', () => {
  beforeEach(() => jest.clearAllMocks());

  it('returns 400 for invalid notification id', async () => {
    const req = { params: { id: 'foo' } } as any as Request;
    (req as any).userId = 1;
    const res = makeRes();
    const next = makeNext();

    await markNotificationReadController(req, res, next);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ error: 'Invalid notification id' });
    expect(next).not.toHaveBeenCalled();
  });

  it('returns 404 if notification not found', async () => {
    mockNotifRepo.findOne.mockResolvedValue(null);
    const req = { params: { id: '2' } } as any as Request;
    (req as any).userId = 5;
    const res = makeRes();
    const next = makeNext();

    await markNotificationReadController(req, res, next);
    expect(mockNotifRepo.findOne).toHaveBeenCalledWith({ where: { id: 2 }, relations: ['user'] });
    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ error: 'Notification not found' });
    expect(next).not.toHaveBeenCalled();
  });

  it('returns 403 if not authorized', async () => {
    const note = { id: 3, user: { id: 6 }, read: false };
    mockNotifRepo.findOne.mockResolvedValue(note);
    const req = { params: { id: '3' } } as any as Request;
    (req as any).userId = 5;
    const res = makeRes();
    const next = makeNext();

    await markNotificationReadController(req, res, next);
    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith({ error: 'Not authorized' });
    expect(next).not.toHaveBeenCalled();
  });

  it('marks notification read on success', async () => {
    const note = { id: 4, user: { id: 7 }, read: false } as any;
    mockNotifRepo.findOne.mockResolvedValue(note);
    const req = { params: { id: '4' } } as any as Request;
    (req as any).userId = 7;
    const res = makeRes();
    const next = makeNext();

    await markNotificationReadController(req, res, next);
    expect(note.read).toBe(true);
    expect(mockNotifRepo.save).toHaveBeenCalledWith(note);
    expect(res.json).toHaveBeenCalledWith({ message: 'Notification marked read' });
  });

  it('forwards errors to next()', async () => {
    const err = new Error('DB error');
    mockNotifRepo.findOne.mockRejectedValue(err);
    const req = { params: { id: '5' } } as any as Request;
    (req as any).userId = 8;
    const res = makeRes();
    const next = makeNext();

    await markNotificationReadController(req, res, next);
    expect(next).toHaveBeenCalledWith(err);
  });
});

describe('getUnreadCountController', () => {
  beforeEach(() => jest.clearAllMocks());

  it('returns capped count when over MAX_UNREAD_COUNT', async () => {
    mockNotifRepo.count.mockResolvedValue(150);
    const req = {} as any as Request;
    (req as any).userId = 9;
    const res = makeRes();
    const next = makeNext();

    await getUnreadCountController(req, res, next);
    expect(mockNotifRepo.count).toHaveBeenCalledWith({ where: { user: { id: 9 }, read: false } });
    expect(res.json).toHaveBeenCalledWith({ count: 100 });
  });

  it('returns actual count when under MAX_UNREAD_COUNT', async () => {
    mockNotifRepo.count.mockResolvedValue(42);
    const req = {} as any as Request;
    (req as any).userId = 10;
    const res = makeRes();
    const next = makeNext();

    await getUnreadCountController(req, res, next);
    expect(res.json).toHaveBeenCalledWith({ count: 42 });
  });

  it('forwards errors to next()', async () => {
    const err = new Error('count error');
    mockNotifRepo.count.mockRejectedValue(err);
    const req = {} as any as Request;
    (req as any).userId = 11;
    const res = makeRes();
    const next = makeNext();

    await getUnreadCountController(req, res, next);
    expect(next).toHaveBeenCalledWith(err);
  });
});

describe('getNotificationsController', () => {
  beforeEach(() => jest.clearAllMocks());

  it('returns paged notifications with defaults', async () => {
    const fakeNotes = [{ id: 1 }, { id: 2 }];
    mockNotifRepo.findAndCount.mockResolvedValue([fakeNotes, 50]);
    const req = { params: {}, query: {} } as any as Request;
    (req as any).userId = 12;
    const res = makeRes();
    const next = makeNext();

    await getNotificationsController(req, res, next);
    expect(mockNotifRepo.findAndCount).toHaveBeenCalledWith({
      where: { user: { id: 12 } },
      order: { createdAt: 'DESC' },
      skip: 0,
      take: 20
    });
    expect(res.json).toHaveBeenCalledWith({ page: 1, limit: 20, total: 50, notifications: fakeNotes });
  });

  it('applies read filter and pagination', async () => {
    const fakeNotes = [{ id: 3 }];
    mockNotifRepo.findAndCount.mockResolvedValue([fakeNotes, 10]);
    const req = { params: {}, query: { page: '2', limit: '5', read: 'true' } } as any as Request;
    (req as any).userId = 13;
    const res = makeRes();
    const next = makeNext();

    await getNotificationsController(req, res, next);
    expect(mockNotifRepo.findAndCount).toHaveBeenCalledWith({
      where: { user: { id: 13 }, read: true },
      order: { createdAt: 'DESC' },
      skip: 5,
      take: 5
    });
    expect(res.json).toHaveBeenCalledWith({ page: 2, limit: 5, total: 10, notifications: fakeNotes });
  });

  it('forwards errors to next()', async () => {
    const err = new Error('find error');
    mockNotifRepo.findAndCount.mockRejectedValue(err);
    const req = { params: {}, query: {} } as any as Request;
    (req as any).userId = 14;
    const res = makeRes();
    const next = makeNext();

    await getNotificationsController(req, res, next);
    expect(next).toHaveBeenCalledWith(err);
  });
});
