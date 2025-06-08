// src/controllers/blockController.ts
import { Request, Response, NextFunction } from 'express';
import { AppDataSource } from '../../config/data-source';
import { UserBlock } from '../../entities/UsertoUserEntities/UserBlock';
import { User } from '../../entities/User';

export async function blockUserController(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const targetId = Number(req.params.id);
    const meId = (req as any).userId as number;
    if (Number.isNaN(targetId) || meId === targetId) {
      res.status(400).json({ error: 'Invalid user' });
      return;
    }
    const blockRepo = AppDataSource.getRepository(UserBlock);
    // Check if already blocked
    const exists = await blockRepo.findOne({
      where: { blocker: { id: meId }, blocked: { id: targetId } }
    });
    if (exists) {
      res.status(409).json({ error: 'Already blocked' });
      return;
    }
    const block = blockRepo.create({
      blocker: { id: meId } as User,
      blocked: { id: targetId } as User
    });
    await blockRepo.save(block);
    res.status(201).json({ message: 'User blocked' });
  } catch (err) {
    next(err);
  }
}

export async function unblockUserController(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const targetId = Number(req.params.id);
    const meId = (req as any).userId as number;
    if (Number.isNaN(targetId) || meId === targetId) {
      res.status(400).json({ error: 'Invalid user' });
      return;
    }
    const blockRepo = AppDataSource.getRepository(UserBlock);
    const existing = await blockRepo.findOne({
      where: { blocker: { id: meId }, blocked: { id: targetId } }
    });
    if (!existing) {
      res.status(404).json({ error: 'Not blocked' });
      return;
    }
    await blockRepo.delete(existing.id);
    res.json({ message: 'User unblocked' });
  } catch (err) {
    next(err);
  }
}
