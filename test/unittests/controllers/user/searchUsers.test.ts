// test/integration/searchUsers.test.ts

import { Request, Response, NextFunction } from 'express';
import { searchUsersController } from '../../../../src/controllers/user/searchUsersController';
import { AppDataSource } from '../../../../src/config/data-source';
import { User } from '../../../../src/entities/User';

// 1) Fake repository with query builder
const mockUserRepo = { createQueryBuilder: jest.fn() };

// 2) Mock data-source
jest.mock('../../../../src/config/data-source', () => ({
  AppDataSource: {
    getRepository: () => mockUserRepo
  }
}));

describe('searchUsersController', () => {
  let req: Partial<Request>;
  let res: Partial<Response>;
  let next: NextFunction;

  beforeEach(() => {
    jest.clearAllMocks();
    req = { query: {} } as any;
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    } as any;
    next = jest.fn();
  });

  it('returns 400 when query is missing', async () => {
    req.query = {};
    await searchUsersController(req as Request, res as Response, next);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ error: 'Missing search query' });
  });

  it('returns paginated users on valid query', async () => {
    // Arrange
    req.query = { query: 'tom', page: '2', limit: '3' } as any;
    const mockQB = {
      where: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      addOrderBy: jest.fn().mockReturnThis(),
      skip: jest.fn().mockReturnThis(),
      take: jest.fn().mockReturnThis(),
      getManyAndCount: jest.fn().mockResolvedValue([
        [
          { id: 1, username: 'tommy', isPrivate: false },
          { id: 2, username: 'atom', isPrivate: true }
        ],
        10
      ])
    };
    mockUserRepo.createQueryBuilder.mockReturnValue(mockQB);

    // Act
    await searchUsersController(req as Request, res as Response, next);

    // Assert
    expect(mockUserRepo.createQueryBuilder).toHaveBeenCalledWith('user');
    expect(mockQB.where).toHaveBeenCalledWith('similarity(user.username, :query) > 0.2', { query: 'tom' });
    expect(mockQB.orderBy).toHaveBeenCalledWith('similarity(user.username, :query)', 'DESC');
    expect(mockQB.addOrderBy).toHaveBeenCalledWith('user.username', 'ASC');
    expect(mockQB.skip).toHaveBeenCalledWith((2 - 1) * 3);
    expect(mockQB.take).toHaveBeenCalledWith(3);

    expect(res.json).toHaveBeenCalledWith({
      page: 2,
      limit: 3,
      total: 10,
      users: [
        { id: 1, username: 'tommy', isPrivate: false },
        { id: 2, username: 'atom', isPrivate: true }
      ]
    });
  });

  it('forwards errors to next()', async () => {
    req.query = { query: 'test' } as any;
    const mockQB = {
      where: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      addOrderBy: jest.fn().mockReturnThis(),
      skip: jest.fn().mockReturnThis(),
      take: jest.fn().mockReturnThis(),
      getManyAndCount: jest.fn().mockRejectedValue(new Error('DB failure'))
    };
    mockUserRepo.createQueryBuilder.mockReturnValue(mockQB);

    await searchUsersController(req as Request, res as Response, next);

    expect(next).toHaveBeenCalledWith(expect.any(Error));
  });
});
