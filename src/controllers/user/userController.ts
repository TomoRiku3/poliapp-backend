// src/controllers/user/userController.ts
import { Request, Response, NextFunction } from 'express';
import { AppDataSource } from '../../config/data-source';
import { User } from '../../entities/User';
import { Post } from '../../entities/Post';
import { canViewUserProfile } from '../../policies/userProfilePolicy';

// api/user/me
export async function getMeController(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const viewerId = req.userId as number;

    // Self‐view authorization
    if (!(await canViewUserProfile(viewerId, viewerId))) {
      res.status(403).json({ error: 'Forbidden' });
      return;
    }

    const page  = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.max(1, Number(req.query.limit) || 10);

    const userRepo = AppDataSource.getRepository(User);
    const user     = await userRepo.findOne({ where: { id: viewerId } });
    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    const { id, username, email, createdAt, updatedAt } = user;

    // Paginated posts
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
    const viewerId = req.userId as number;
    const targetId = Number(req.params.id);
    const page     = Math.max(1, Number(req.query.page) || 1);
    const limit    = Math.max(1, Number(req.query.limit) || 10);

    if (Number.isNaN(targetId)) {
      res.status(400).json({ error: 'Invalid user id' });
      return;
    }

    // Profile‐level authorization
    if (!(await canViewUserProfile(viewerId, targetId))) {
      res.status(403).json({ error: 'Forbidden' });
      return;
    }

    const userRepo = AppDataSource.getRepository(User);
    const user     = await userRepo.findOne({ where: { id: targetId } });
    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    const { id, username, email, createdAt, updatedAt } = user;

    // Paginated posts
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
