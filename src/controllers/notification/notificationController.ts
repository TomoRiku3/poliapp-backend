// src/controllers/notificationController.ts
import { Request, Response, NextFunction } from 'express';
import { AppDataSource } from '../../config/data-source';
import { Notification } from '../../entities/Notification';

export async function getNotificationsController(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const userId = (req as any).userId as number;
    const repo = AppDataSource.getRepository(Notification);
    const notes = await repo.find({
      where: { user: { id: userId } },
      order: { createdAt: 'DESC' }
    });
    res.json(notes);
  } catch (err) {
    next(err);
  }
}

export async function markNotificationReadController(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const noteId = Number(req.params.id);
    const userId = (req as any).userId as number;
    if (Number.isNaN(noteId)) {
      res.status(400).json({ error: 'Invalid notification id' });
      return;
    }
    const repo = AppDataSource.getRepository(Notification);
    const note = await repo.findOne({ where: { id: noteId }, relations: ['user'] });
    if (!note) {
      res.status(404).json({ error: 'Notification not found' });
      return;
    }
    if (note.user.id !== userId) {
      res.status(403).json({ error: 'Not authorized' });
      return;
    }
    note.read = true;
    await repo.save(note);
    res.json({ message: 'Notification marked read' });
  } catch (err) {
    next(err);
  }
}