// src/controllers/notificationController.ts
import { Request, Response, NextFunction } from 'express';
import { AppDataSource } from '../../config/data-source';
import { Notification } from '../../entities/Notification';

// Maximum number of unread notifications to return in the count
const MAX_UNREAD_COUNT = 100;

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

/**
 * GET /api/notifications/unread/count
 * Returns the count of unread notifications (capped at MAX_UNREAD_COUNT) for the authenticated user.
 */
export async function getUnreadCountController(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const userId = req.userId as number;
    const repo = AppDataSource.getRepository(Notification);

    // count unread notifications
    const count = await repo.count({
      where: { user: { id: userId }, read: false }
    });

    // cap the count to avoid large values
    const boundedCount = Math.min(count, MAX_UNREAD_COUNT);

    res.json({ count: boundedCount });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/notifications
 * Returns paginated notifications for the authenticated user.
 * Query params:
 *   - page (number, default: 1)
 *   - limit (number, default: 20)
 *   - read (boolean, optional)
 */
export async function getNotificationsController(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const userId = req.userId as number;
    const page   = Math.max(1, Number(req.query.page)  || 1);
    const limit  = Math.max(1, Number(req.query.limit) || 20);
    const readQuery = req.query.read;
    const readFilter: boolean | undefined =
      readQuery === undefined ? undefined : readQuery === 'true';

    const repo = AppDataSource.getRepository(Notification);

    const where: any = { user: { id: userId } };
    if (readFilter !== undefined) {
      where.read = readFilter;
    }

    const [items, total] = await repo.findAndCount({
      where,
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit
    });

    res.json({ page, limit, total, notifications: items });
  } catch (err) {
    next(err);
  }
}