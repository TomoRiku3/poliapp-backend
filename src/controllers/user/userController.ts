// src/controllers/userController.ts
import { Request, Response, NextFunction } from 'express';
import { AppDataSource } from '../../config/data-source';
import { User } from '../../entities/User';

// api/user/me
export async function getMeController(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    // req.userId was set by authMiddleware
    const userId = (req as any).userId as number;
    const userRepo = AppDataSource.getRepository(User);
    const user = await userRepo.findOne({ where: { id: userId } });
    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }
    // strip out sensitive fields
    const { id, username, email, createdAt, updatedAt } = user;
    res.json({ id, username, email, createdAt, updatedAt });
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
    const id = Number(req.params.id);
    if (Number.isNaN(id)) {
      res.status(400).json({ error: 'Invalid user id' });
      return;
    }

    const userRepo = AppDataSource.getRepository(User);
    const user = await userRepo.findOne({ where: { id } });
    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    // strip sensitive fields
    const { id: userId, username, email, createdAt, updatedAt } = user;
    res.json({ id: userId, username, email, createdAt, updatedAt });
  } catch (err) {
    next(err);
  }
}
