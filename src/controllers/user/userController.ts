// src/controllers/userController.ts
import { Request, Response, NextFunction } from 'express';
import { AppDataSource } from '../../config/data-source';
import { User } from '../../entities/User';

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
