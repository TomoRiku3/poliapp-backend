// GET /api/users/search?query=tomo&page=1&limit=10

import { Request, Response, NextFunction } from 'express';
import { AppDataSource } from '../../config/data-source';
import { User } from '../../entities/User';

export async function searchUsersController(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const query = (req.query.query as string || '').trim();
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.max(1, Number(req.query.limit) || 10);
    const offset = (page - 1) * limit;

    if (!query) {
      res.status(400).json({ error: 'Missing search query' });
      return;
    }

    const userRepo = AppDataSource.getRepository(User);

    const [users, total] = await userRepo
      .createQueryBuilder('user')
      .where('similarity(user.username, :query) > 0.2', { query })
      .orderBy('similarity(user.username, :query)', 'DESC')
      .addOrderBy('user.username', 'ASC')
      .skip(offset)
      .take(limit)
      .getManyAndCount();

    res.json({
      page,
      limit,
      total,
      users: users.map(u => ({
        id: u.id,
        username: u.username,
        isPrivate: u.isPrivate
      }))
    });
  } catch (err) {
    next(err);
  }
}
