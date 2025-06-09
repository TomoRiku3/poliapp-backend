// test/unittests/policies/userProfilePolicy.test.ts

// 1) Fake repos
const mockBlockRepo = { findOne: jest.fn() };
const mockUserRepo  = { findOne: jest.fn() };
const mockFollowRepo= { findOne: jest.fn() };

// 2) Mock data-source *before* importing the policy
jest.mock('../../../src/config/data-source', () => ({
  AppDataSource: {
    getRepository: (entity: any) => {
      switch (entity.name) {
        case 'UserBlock':   return mockBlockRepo;
        case 'User':        return mockUserRepo;
        case 'UserFollow':  return mockFollowRepo;
        default:
          throw new Error(`Unexpected repository: ${entity.name}`);
      }
    }
  }
}));

import { canViewUserProfile } from '../../../src/policies/userProfilePolicy';

// Tests
describe('canViewUserProfile', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('allows viewing own profile', async () => {
    const res = await canViewUserProfile(1, 1);
    expect(res).toBe(true);
    expect(mockBlockRepo.findOne).not.toHaveBeenCalled();
  });

  it('denies if viewer has blocked target', async () => {
    mockBlockRepo.findOne.mockResolvedValue({ blocker: { id: 1 }, blocked: { id: 2 } });
    const res = await canViewUserProfile(1, 2);
    expect(res).toBe(false);
  });

  it('denies if target has blocked viewer', async () => {
    mockBlockRepo.findOne.mockResolvedValue({ blocker: { id: 2 }, blocked: { id: 3 } });
    const res = await canViewUserProfile(3, 2);
    expect(res).toBe(false);
  });

  it('allows if target is public and no blocks', async () => {
    mockBlockRepo.findOne.mockResolvedValue(null);
    mockUserRepo.findOne.mockResolvedValue({ id: 5, isPrivate: false });
    const res = await canViewUserProfile(8, 5);
    expect(res).toBe(true);
  });

  it('denies if target not found', async () => {
    mockBlockRepo.findOne.mockResolvedValue(null);
    mockUserRepo.findOne.mockResolvedValue(null);
    const res = await canViewUserProfile(4, 9);
    expect(res).toBe(false);
  });

  it('allows if target is private and viewer is a follower', async () => {
    mockBlockRepo.findOne.mockResolvedValue(null);
    mockUserRepo.findOne.mockResolvedValue({ id: 7, isPrivate: true });
    mockFollowRepo.findOne.mockResolvedValue({ follower: { id: 10 }, following: { id: 7 } });
    const res = await canViewUserProfile(10, 7);
    expect(res).toBe(true);
  });

  it('denies if target is private and viewer is not a follower', async () => {
    mockBlockRepo.findOne.mockResolvedValue(null);
    mockUserRepo.findOne.mockResolvedValue({ id: 11, isPrivate: true });
    mockFollowRepo.findOne.mockResolvedValue(null);
    const res = await canViewUserProfile(12, 11);
    expect(res).toBe(false);
  });
});
