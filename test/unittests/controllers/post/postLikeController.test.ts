// test/unittests/controllers/postLikeController.test.ts

// 1) Fake repos
const mockLikeRepo = {
  findOne: jest.fn(),
  create: jest.fn(),
  save: jest.fn(),
  delete: jest.fn()
};
const mockPostRepo = {
  increment: jest.fn(),
  decrement: jest.fn(),
  findOne: jest.fn()
};

// 2) Mock data-source *before* importing controllers
jest.mock('../../../../src/config/data-source', () => ({
  AppDataSource: {
    getRepository: (entity: any) => {
      switch (entity.name) {
        case 'Like':    return mockLikeRepo;
        case 'Post':    return mockPostRepo;
        default:
          throw new Error(`Unexpected repository: ${entity.name}`);
      }
    }
  }
}));

import { Request, Response, NextFunction } from 'express';
import {
  likePostController,
  getPostLikesController
} from '../../../../src/controllers/post/likePostController';

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

describe('likePostController', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('toggles off existing like', async () => {
    // Arrange: existing like found
    mockLikeRepo.findOne.mockResolvedValue({ id: 99 });
    const req = { params: { id: '10' } } as any as Request;
    (req as any).userId = 5;
    const res = makeRes();
    const next = makeNext();

    // Act
    await likePostController(req, res, next);

    // Assert delete and decrement
    expect(mockLikeRepo.findOne).toHaveBeenCalledWith({ where: { user: { id: 5 }, post: { id: 10 } } });
    expect(mockLikeRepo.delete).toHaveBeenCalledWith(99);
    expect(mockPostRepo.decrement).toHaveBeenCalledWith({ id: 10 }, 'likeCount', 1);
    expect(res.json).toHaveBeenCalledWith({ liked: false });
  });

  it('toggles on new like', async () => {
    // Arrange: no existing like
    mockLikeRepo.findOne.mockResolvedValue(null);
    const fakeLike = { user: { id: 5 }, post: { id: 10 } };
    mockLikeRepo.create.mockReturnValue(fakeLike);
    const req = { params: { id: '10' } } as any as Request;
    (req as any).userId = 5;
    const res = makeRes();
    const next = makeNext();

    // Act
    await likePostController(req, res, next);

    // Assert create, save, increment
    expect(mockLikeRepo.create).toHaveBeenCalledWith({ user: { id: 5 }, post: { id: 10 } });
    expect(mockLikeRepo.save).toHaveBeenCalledWith(fakeLike);
    expect(mockPostRepo.increment).toHaveBeenCalledWith({ id: 10 }, 'likeCount', 1);
    expect(res.json).toHaveBeenCalledWith({ liked: true });
  });

  it('forwards errors to next()', async () => {
    const error = new Error('DB error');
    mockLikeRepo.findOne.mockRejectedValue(error);
    const req = { params: { id: '10' } } as any as Request;
    (req as any).userId = 5;
    const res = makeRes();
    const next = makeNext();

    await likePostController(req, res, next);
    expect(next).toHaveBeenCalledWith(error);
  });
});

describe('getPostLikesController', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns 404 if post not found', async () => {
    mockPostRepo.findOne.mockResolvedValue(null);
    const req = { params: { id: '20' } } as any as Request;
    const res = makeRes();
    const next = makeNext();

    await getPostLikesController(req, res, next);

    expect(mockPostRepo.findOne).toHaveBeenCalledWith({ where: { id: 20 }, select: ['likeCount'] });
    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ error: 'Post not found' });
  });

  it('returns like count on success', async () => {
    mockPostRepo.findOne.mockResolvedValue({ likeCount: 7 });
    const req = { params: { id: '20' } } as any as Request;
    const res = makeRes();
    const next = makeNext();

    await getPostLikesController(req, res, next);

    expect(res.json).toHaveBeenCalledWith({ likeCount: 7 });
  });

  it('forwards errors to next()', async () => {
    const error = new Error('DB failure');
    mockPostRepo.findOne.mockRejectedValue(error);
    const req = { params: { id: '20' } } as any as Request;
    const res = makeRes();
    const next = makeNext();

    await getPostLikesController(req, res, next);
    expect(next).toHaveBeenCalledWith(error);
  });
});
