// test/unittests/controllers/postController.test.ts

// 1) Fake repos
const mockPostRepo = { create: jest.fn(), save: jest.fn(), findOne: jest.fn() };
const mockMediaRepo = { create: jest.fn(), save: jest.fn() };

// 2) Fake storage service
const mockUploadObject = jest.fn();

// 3) Mock data-source and storage *before* importing controller
jest.mock('../../../../src/config/data-source', () => ({
  AppDataSource: {
    getRepository: (entity: any) => {
      switch (entity.name) {
        case 'Post':  return mockPostRepo;
        case 'Media': return mockMediaRepo;
        default:
          throw new Error(`Unexpected repository: ${entity.name}`);
      }
    }
  }
}));

jest.mock('../../../../src/services/storage', () => ({
  uploadObject: (...args: any[]) => mockUploadObject(...args)
}));

import { Request, Response, NextFunction } from 'express';
import { createPostController, getPostController } from '../../../../src/controllers/post/postController';

// Helpers
function makeRes() {
  const res: Partial<Response> = {};
  res.status = jest.fn().mockReturnValue(res as Response);
  res.json   = jest.fn().mockReturnValue(res as Response);
  res.end    = jest.fn().mockReturnValue(res as Response);
  return res as Response;
}
function makeNext(): NextFunction {
  return jest.fn() as NextFunction;
}

// Tests for createPostController
describe('createPostController', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Make create return the given entity
    mockPostRepo.create.mockImplementation((entity: any) => entity);
  });

  it('should create a text-only post and return 201', async () => {
    const req = { body: { text: 'Hello world' } } as any as Request;
    (req as any).userId = 10;
    const res = makeRes();
    const next = makeNext();

    mockPostRepo.save.mockResolvedValue({ id: 50 });

    await createPostController(req, res, next);

    expect(mockPostRepo.create).toHaveBeenCalledWith({ author: { id: 10 }, text: 'Hello world' });
    expect(mockPostRepo.save).toHaveBeenCalledWith(
      expect.objectContaining({ author: { id: 10 }, text: 'Hello world' })
    );
    expect(mockUploadObject).not.toHaveBeenCalled();
    expect(mockMediaRepo.create).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith({ postId: 50 });
  });

  it('should upload media and save Media entries', async () => {
    const buffer = Buffer.from('fake');
    const file = {
      fieldname: 'media',
      originalname: 'image.png',
      encoding: '7bit',
      mimetype: 'image/png',
      buffer,
      size: buffer.length,
      destination: '',
      filename: '',
      path: ''
    };
    const req = { body: {}, files: [file] } as any as Request;
    (req as any).userId = 20;
    const res = makeRes();
    const next = makeNext();

    mockPostRepo.save.mockResolvedValue({ id: 60 });
    mockUploadObject.mockResolvedValue('https://bucket.s3.amazonaws.com/posts/60/fake.png');

    await createPostController(req, res, next);

    expect(mockPostRepo.create).toHaveBeenCalledWith({ author: { id: 20 }, text: undefined });
    expect(mockPostRepo.save).toHaveBeenCalled();
    expect(mockUploadObject).toHaveBeenCalledWith(
      buffer,
      expect.stringContaining('posts/60/'),
      'image/png'
    );
    expect(mockMediaRepo.create).toHaveBeenCalledWith({
      post: { id: 60 },
      type: 'IMAGE',
      url: 'https://bucket.s3.amazonaws.com/posts/60/fake.png'
    });
    expect(mockMediaRepo.save).toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith({ postId: 60 });
  });

  it('forwards errors to next()', async () => {
    const req = { body: {} } as any as Request;
    (req as any).userId = 5;
    const res = makeRes();
    const next = makeNext();

    const err = new Error('DB failure');
    mockPostRepo.save.mockRejectedValue(err);

    await createPostController(req, res, next);

    expect(next).toHaveBeenCalledWith(err);
    expect(res.status).not.toHaveBeenCalled();
  });
});

// Tests for getPostController
describe('getPostController', () => {
  beforeEach(() => jest.clearAllMocks());

  it('should return 400 on non-numeric id', async () => {
    const req = { params: { id: 'abc' } } as any as Request;
    const res = makeRes();
    const next = makeNext();

    await getPostController(req, res, next);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ error: 'Invalid post id' });
  });

  it('should return 404 when post not found', async () => {
    mockPostRepo.findOne.mockResolvedValue(null);
    const req = { params: { id: '123' } } as any as Request;
    const res = makeRes();
    const next = makeNext();

    await getPostController(req, res, next);

    expect(mockPostRepo.findOne).toHaveBeenCalledWith({
      where: { id: 123 },
      relations: ['author', 'media']
    });
    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ error: 'Post not found' });
  });

  it('should return 200 and the post on success', async () => {
    const fakePost = {
      id: 5,
      author: { id: 2, username: 'bob' },
      text: 'hi',
      media: [
        { id: 10, type: 'IMAGE', url: 'url1', width: undefined, height: undefined, createdAt: new Date() }
      ],
      createdAt: new Date('2025-06-08'),
      updatedAt: new Date('2025-06-08')
    };
    mockPostRepo.findOne.mockResolvedValue(fakePost);

    const req = { params: { id: '5' } } as any as Request;
    const res = makeRes();
    const next = makeNext();

    await getPostController(req, res, next);

    expect(res.json).toHaveBeenCalledWith(fakePost);
  });

  it('forwards errors to next()', async () => {
    const err = new Error('DB fail');
    mockPostRepo.findOne.mockRejectedValue(err);

    const req = { params: { id: '7' } } as any as Request;
    const res = makeRes();
    const next = makeNext();

    await getPostController(req, res, next);

    expect(next).toHaveBeenCalledWith(err);
  });
});
