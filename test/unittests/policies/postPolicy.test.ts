// test/unittests/policies/postPolicy.test.ts

// 1) Fake Post repository
const mockPostRepo = { findOne: jest.fn() };

// 2) Mock data-source *before* importing canViewPost
jest.mock('../../../src/config/data-source', () => ({
  AppDataSource: {
    getRepository: (entity: any) => {
      if (entity.name === 'Post') return mockPostRepo;
      throw new Error(`Unexpected repository: ${entity.name}`);
    }
  }
}));

import { canViewPost } from '../../../src/policies/postPolicy';

// Tests
describe('canViewPost', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns false if post not found', async () => {
    mockPostRepo.findOne.mockResolvedValue(null);

    await expect(canViewPost(1, 100)).resolves.toBe(false);
    expect(mockPostRepo.findOne).toHaveBeenCalledWith({
      where: { id: 100 },
      relations: ['author', 'author.followers', 'author.blockedBy']
    });
  });

  it('returns false when author has blocked the viewer', async () => {
    const fakePost = {
      author: {
        id: 1,
        isPrivate: false,
        followers: [],
        blockedBy: [ { blocker: { id: 1 }, blocked: { id: 2 } } ]
      }
    };
    mockPostRepo.findOne.mockResolvedValue(fakePost);

    await expect(canViewPost(2, 200)).resolves.toBe(false);
  });

  it('returns true for public posts if not blocked', async () => {
    const fakePost = {
      author: {
        id: 1,
        isPrivate: false,
        followers: [],
        blockedBy: []
      }
    };
    mockPostRepo.findOne.mockResolvedValue(fakePost);

    await expect(canViewPost(3, 300)).resolves.toBe(true);
  });

  it('returns true for private posts when viewer is a follower', async () => {
    const fakePost = {
      author: {
        id: 1,
        isPrivate: true,
        followers: [ { follower: { id: 4 } } ],
        blockedBy: []
      }
    };
    mockPostRepo.findOne.mockResolvedValue(fakePost);

    await expect(canViewPost(4, 400)).resolves.toBe(true);
  });

  it('returns false for private posts when viewer is not a follower', async () => {
    const fakePost = {
      author: {
        id: 1,
        isPrivate: true,
        followers: [ { follower: { id: 5 } } ],
        blockedBy: []
      }
    };
    mockPostRepo.findOne.mockResolvedValue(fakePost);

    await expect(canViewPost(6, 500)).resolves.toBe(false);
  });
});
