// test/unittests/controllers/blockController.test.ts

// 1) Fake repo
const mockBlockRepo = {
  findOne: jest.fn(),
  create: jest.fn(),
  save: jest.fn(),
  delete: jest.fn()
};

// 2) Mock data-source *before* importing controllers
jest.mock('../../../../src/config/data-source', () => ({
  AppDataSource: {
    getRepository: (entity: any) => {
      switch (entity.name) {
        case 'UserBlock':
          return mockBlockRepo;
        default:
          throw new Error(`Unexpected repository: ${entity.name}`);
      }
    }
  }
}));

import { Request, Response, NextFunction } from 'express';
import {
  blockUserController,
  unblockUserController
} from '../../../../src/controllers/user/blockController';

// Helpers
function makeRes() {
  const res: Partial<Response> = {};
  res.status = jest.fn().mockReturnValue(res as Response);
  res.json   = jest.fn().mockReturnValue(res as Response);
  return res as Response;
}
function makeNext() { return jest.fn() as NextFunction; }

describe('blockUserController', () => {
  beforeEach(() => jest.clearAllMocks());

  it('400 if id is not a number', async () => {
    const req = { params: { id: 'foo' } } as any as Request;
    (req as any).userId = 1;
    const res = makeRes(), next = makeNext();

    await blockUserController(req, res, next);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ error: 'Invalid user' });
  });

  it('400 if trying to block self', async () => {
    const req = { params: { id: '1' } } as any as Request;
    (req as any).userId = 1;
    const res = makeRes(), next = makeNext();

    await blockUserController(req, res, next);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ error: 'Invalid user' });
  });

  it('409 if already blocked', async () => {
    const req = { params: { id: '2' } } as any as Request;
    (req as any).userId = 1;
    const res = makeRes(), next = makeNext();
    mockBlockRepo.findOne.mockResolvedValue({ id: 99 });

    await blockUserController(req, res, next);

    expect(mockBlockRepo.findOne).toHaveBeenCalledWith({
      where: { blocker: { id: 1 }, blocked: { id: 2 } }
    });
    expect(res.status).toHaveBeenCalledWith(409);
    expect(res.json).toHaveBeenCalledWith({ error: 'Already blocked' });
  });

  it('201 and saves block on success', async () => {
    const req = { params: { id: '2' } } as any as Request;
    (req as any).userId = 1;
    const res = makeRes(), next = makeNext();
    mockBlockRepo.findOne.mockResolvedValue(null);
    mockBlockRepo.create.mockReturnValue({ blocker: { id: 1 }, blocked: { id: 2 } });

    await blockUserController(req, res, next);

    expect(mockBlockRepo.create).toHaveBeenCalledWith({
      blocker: { id: 1 },
      blocked: { id: 2 }
    });
    expect(mockBlockRepo.save).toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith({ message: 'User blocked' });
  });

  it('forwards error to next()', async () => {
    const req = { params: { id: '2' } } as any as Request;
    (req as any).userId = 1;
    const res = makeRes(), next = makeNext();
    const err = new Error('DB error');
    mockBlockRepo.findOne.mockRejectedValue(err);

    await blockUserController(req, res, next);

    expect(next).toHaveBeenCalledWith(err);
  });
});

describe('unblockUserController', () => {
  beforeEach(() => jest.clearAllMocks());

  it('400 if id is not a number', async () => {
    const req = { params: { id: 'bar' } } as any as Request;
    (req as any).userId = 1;
    const res = makeRes(), next = makeNext();

    await unblockUserController(req, res, next);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ error: 'Invalid user' });
  });

  it('400 if trying to unblock self', async () => {
    const req = { params: { id: '1' } } as any as Request;
    (req as any).userId = 1;
    const res = makeRes(), next = makeNext();

    await unblockUserController(req, res, next);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ error: 'Invalid user' });
  });

  it('404 if not blocked', async () => {
    const req = { params: { id: '3' } } as any as Request;
    (req as any).userId = 1;
    const res = makeRes(), next = makeNext();
    mockBlockRepo.findOne.mockResolvedValue(null);

    await unblockUserController(req, res, next);

    expect(mockBlockRepo.findOne).toHaveBeenCalledWith({
      where: { blocker: { id: 1 }, blocked: { id: 3 } }
    });
    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ error: 'Not blocked' });
  });

  it('deletes block and returns message on success', async () => {
    const req = { params: { id: '3' } } as any as Request;
    (req as any).userId = 1;
    const res = makeRes(), next = makeNext();
    mockBlockRepo.findOne.mockResolvedValue({ id: 123 });

    await unblockUserController(req, res, next);

    expect(mockBlockRepo.delete).toHaveBeenCalledWith(123);
    expect(res.json).toHaveBeenCalledWith({ message: 'User unblocked' });
  });

  it('forwards error to next()', async () => {
    const req = { params: { id: '3' } } as any as Request;
    (req as any).userId = 1;
    const res = makeRes(), next = makeNext();
    const err = new Error('Crash');
    mockBlockRepo.findOne.mockRejectedValue(err);

    await unblockUserController(req, res, next);

    expect(next).toHaveBeenCalledWith(err);
  });
});
