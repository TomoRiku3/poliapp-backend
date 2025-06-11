// test/unittests/controllers/postController.test.ts

// 1) Fake repos
const mockPostRepo = { create: jest.fn(), save: jest.fn(), findOne: jest.fn(), findAndCount: jest.fn() };
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

jest.mock('../../../../src/policies/postPolicy', () => ({
  canViewPost: jest.fn()
}));

import { Request, Response, NextFunction } from 'express';
import { 
  createPostController, 
  getPostController,
  replyToPostController,
  getRepliesController,
  getFeedController
} from '../../../../src/controllers/post/postController';
import { canViewPost } from '../../../../src/policies/postPolicy';


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
  beforeEach(() => {
    jest.clearAllMocks();
    // by default, allow viewing
    (canViewPost as jest.Mock).mockResolvedValue(true);
  });

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

// Tests for replyToPostController
describe('replyToPostController', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // let create return its input
    mockPostRepo.create.mockImplementation((e: any) => e);
    (canViewPost as jest.Mock).mockResolvedValue(true);

  });

  it('responds 400 on invalid parent id', async () => {
    const req = { params: { id: 'foo' }, body: { text: 'hi' } } as any as Request;
    (req as any).userId = 1;
    const res = makeRes();
    const next = makeNext();

    await replyToPostController(req, res, next);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ error: 'Invalid post id' });
  });

  it('responds 404 when parent not found', async () => {
    mockPostRepo.findOne.mockResolvedValue(null);
    const req = { params: { id: '5' }, body: { text: 'reply' } } as any as Request;
    (req as any).userId = 2;
    const res = makeRes();
    const next = makeNext();

    await replyToPostController(req, res, next);
    expect(mockPostRepo.findOne).toHaveBeenCalledWith({ where: { id: 5 } });
    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ error: 'Parent post not found' });
  });

  it('creates a reply and returns 201', async () => {
    // Arrange: parent exists
    mockPostRepo.findOne.mockResolvedValue({ id: 10 });
    mockPostRepo.save.mockResolvedValue({ id: 99 });

    const req = { params: { id: '10' }, body: { text: 'a reply' } } as any as Request;
    (req as any).userId = 3;
    const res = makeRes();
    const next = makeNext();

    // Act
    await replyToPostController(req, res, next);

    // Assert create with parent relation
    expect(mockPostRepo.create).toHaveBeenCalledWith({
      author: { id: 3 },
      text: 'a reply',
      parent: { id: 10 }
    });
    expect(mockPostRepo.save).toHaveBeenCalledWith(
      expect.objectContaining({ parent: { id: 10 }, text: 'a reply' })
    );
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith({ postId: 99 });
  });

  it('forwards errors to next()', async () => {
    const err = new Error('DB error');
    mockPostRepo.findOne.mockResolvedValue({ id: 1 });
    mockPostRepo.save.mockRejectedValue(err);

    const req = { params: { id: '1' }, body: { text: 'oops' } } as any as Request;
    (req as any).userId = 4;
    const res = makeRes();
    const next = makeNext();

    await replyToPostController(req, res, next);
    expect(next).toHaveBeenCalledWith(err);
  });
});

// Tests for getRepliesController
describe('getRepliesController', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // by default, allow viewing
    (canViewPost as jest.Mock).mockResolvedValue(true);
  });

  it('responds 400 on invalid post id', async () => {
    const req = { params: { id: 'bar' }, query: {} } as any as Request;
    const res = makeRes();
    const next = makeNext();

    await getRepliesController(req, res, next);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ error: 'Invalid post id' });
  });

  it('returns paged replies on success', async () => {
    const fakeReplies = [{ id: 1 }, { id: 2 }];
    const totalCount = 10;
    mockPostRepo.findAndCount.mockResolvedValue([fakeReplies, totalCount]);

    const req = { params: { id: '7' }, query: { page: '2', limit: '5' } } as any as Request;
    const res = makeRes();
    const next = makeNext();

    await getRepliesController(req, res, next);

    expect(mockPostRepo.findAndCount).toHaveBeenCalledWith({
      where: { parent: { id: 7 } },
      relations: ['author','media'],
      order: { createdAt: 'ASC' },
      skip: (2 - 1) * 5,
      take: 5
    });
    expect(res.json).toHaveBeenCalledWith({
      page: 2,
      limit: 5,
      total: totalCount,
      replies: fakeReplies
    });
  });

  it('forwards errors to next()', async () => {
    const err = new Error('Fetch error');
    mockPostRepo.findAndCount.mockRejectedValue(err);

    const req = { params: { id: '3' }, query: {} } as any as Request;
    const res = makeRes();
    const next = makeNext();

    await getRepliesController(req, res, next);
    expect(next).toHaveBeenCalledWith(err);
  });
});

// Tests for getFeedController
describe('getFeedController', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (canViewPost as jest.Mock).mockResolvedValue(true);
  });

  it('returns paginated feed of visible posts', async () => {
    const fakePosts = [
      { id: 1, text: 'Post 1' },
      { id: 2, text: 'Post 2' }
    ];
    mockPostRepo.findAndCount.mockResolvedValue([fakePosts, 12]);

    const req = { query: { page: '1', limit: '2' } } as any as Request;
    (req as any).userId = 10;
    const res = makeRes();
    const next = makeNext();

    await getFeedController(req, res, next);

    expect(mockPostRepo.findAndCount).toHaveBeenCalledWith({
      where: { parent: expect.any(Object) }, // Will be IsNull()
      relations: ['author', 'media'],
      order: { createdAt: 'DESC' },
      skip: 0,
      take: 2
    });

    expect(res.json).toHaveBeenCalledWith({
      page: 1,
      limit: 2,
      total: 12,
      posts: fakePosts
    });
  });

  it('filters out posts viewer cannot see', async () => {
    const fakePosts = [
      { id: 1, text: 'Visible' },
      { id: 2, text: 'Hidden' }
    ];
    mockPostRepo.findAndCount.mockResolvedValue([fakePosts, 2]);
    (canViewPost as jest.Mock).mockImplementation((viewerId, postId) => postId === 1);

    const req = { query: {}, userId: 50 } as any as Request;
    const res = makeRes();
    const next = makeNext();

    await getFeedController(req, res, next);

    expect(res.json).toHaveBeenCalledWith({
      page: 1,
      limit: 20,
      total: 2,
      posts: [{ id: 1, text: 'Visible' }]
    });
  });

  it('forwards errors to next()', async () => {
    const err = new Error('DB error');
    mockPostRepo.findAndCount.mockRejectedValue(err);

    const req = { query: {}, userId: 10 } as any as Request;
    const res = makeRes();
    const next = makeNext();

    await getFeedController(req, res, next);

    expect(next).toHaveBeenCalledWith(err);
  });
});

