// src/controllers/followController.ts
import { Request, Response, NextFunction } from 'express';
import { AppDataSource } from '../../config/data-source';
import { User } from '../../entities/User';
import { UserFollow } from '../../entities/UserFollow';

export async function getUserFollowingController(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const targetId = Number(req.params.id);
    const meId     = (req as any).userId as number;

    // 1) Validate ID
    if (Number.isNaN(targetId)) {
      res.status(400).json({ error: 'Invalid user id' });
      return;
    }

    const userRepo   = AppDataSource.getRepository(User);
    const followRepo = AppDataSource.getRepository(UserFollow);

    // 2) Load the target user (to check isPrivate)
    const targetUser = await userRepo.findOne({ where: { id: targetId }});
    if (!targetUser) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    // 3) Authorization rules
    const isOwnProfile = meId === targetId;
    const isPublic     = !targetUser.isPrivate;

    let canView = isOwnProfile || isPublic;
    if (!canView && targetUser.isPrivate) {
      // only their followers may see
      const youFollowThem = await followRepo.findOne({
        where: {
          follower:  { id: meId },
          following: { id: targetId },
        }
      });
      canView = Boolean(youFollowThem);
    }

    if (!canView) {
      res.status(403).json({ error: 'Profile is private' });
      return;
    }

    // 4) Fetch their “following” list
    const rows = await followRepo.find({
      where: { follower: { id: targetId } },
      relations: ['following'],
    });

    const list = rows.map(r => {
      const { id, username, email, createdAt, updatedAt } = r.following;
      return { id, username, email, createdAt, updatedAt };
    });

    res.json(list);
  } catch (err) {
    next(err);
  }
}
