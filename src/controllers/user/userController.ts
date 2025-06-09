// src/controllers/postController.ts
import { Request, Response, NextFunction } from 'express';
import { AppDataSource } from '../../config/data-source';
import { User } from '../../entities/User';
import { Post } from '../../entities/Post';

// api/user/me
export async function getMeController(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const userId = (req as any).userId as number;
    const page   = Math.max(1, Number(req.query.page) || 1);
    const limit  = Math.max(1, Number(req.query.limit) || 10);

    const userRepo = AppDataSource.getRepository(User);
    const user = await userRepo.findOne({ where: { id: userId } });
    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    // strip out sensitive fields
    const { id, username, email, createdAt, updatedAt } = user;

    // fetch recent posts by this user
    const postRepo = AppDataSource.getRepository(Post);
    const [posts, total] = await postRepo.findAndCount({
      where: { author: { id } },
      relations: ['media'],
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit
    });

    res.json({ id, username, email, createdAt, updatedAt, page, limit, total, posts });
  } catch (err) {
    next(err);
  }
}

// api/user/:id
export async function getUserByIdController(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const viewerId = (req as any).userId as number;
    const targetId = Number(req.params.id);
    const page     = Math.max(1, Number(req.query.page) || 1);
    const limit    = Math.max(1, Number(req.query.limit) || 10);

    if (Number.isNaN(targetId)) {
      res.status(400).json({ error: 'Invalid user id' });
      return;
    }

    const userRepo = AppDataSource.getRepository(User);
    const user = await userRepo.findOne({ where: { id: targetId } });
    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    // strip sensitive fields
    const { id, username, email, createdAt, updatedAt } = user;

    // fetch recent posts by this user
    const postRepo = AppDataSource.getRepository(Post);
    const [posts, total] = await postRepo.findAndCount({
      where: { author: { id } },
      relations: ['media'],
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit
    });

    res.json({ id, username, email, createdAt, updatedAt, page, limit, total, posts });
  } catch (err) {
    next(err);
  }
}
