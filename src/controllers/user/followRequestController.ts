// src/controllers/followRequestController.ts
import { Request, Response, NextFunction } from 'express';
import { AppDataSource } from '../../config/data-source';
import { FollowRequest, FollowRequestStatus } from '../../entities/UsertoUserEntities/FollowRequest';
import { UserFollow } from '../../entities/UsertoUserEntities/UserFollow';
import { Notification, NotificationType } from '../../entities/Notification';
import { User } from '../../entities/User';
import { UserBlock } from '../../entities/UsertoUserEntities/UserBlock';

export async function createFollowRequestController(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const targetId = Number(req.params.id);
    const requesterId = (req as any).userId as number;
    if (Number.isNaN(targetId)) {
      res.status(400).json({ error: 'Invalid user id' });
      return;
    }
    if (requesterId === targetId) {
      res.status(400).json({ error: 'Cannot follow yourself' });
      return;
    }
    const userRepo = AppDataSource.getRepository(User);
    const targetUser = await userRepo.findOne({ where: { id: targetId } });
    if (!targetUser) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    // Check if blocked
    const blockRepo = AppDataSource.getRepository(UserBlock);
    const isBlocked = await blockRepo.findOne({
      where: { blocker: { id: targetId }, blocked: { id: requesterId } }
    });
    if (isBlocked) {
      res.status(204).end(); // No content, silently ignore
      return;
    }
    const frRepo = AppDataSource.getRepository(FollowRequest);
    const existing = await frRepo.findOne({
      where: { requester: { id: requesterId }, target: { id: targetId }, status: FollowRequestStatus.PENDING }
    });
    if (existing) {
      res.status(409).json({ error: 'Follow request already pending' });
      return;
    }
    if (!targetUser.isPrivate) {
      const ufRepo = AppDataSource.getRepository(UserFollow);
      await ufRepo.save(ufRepo.create({
        follower: { id: requesterId } as User,
        following: { id: targetId } as User
      }));
      res.status(201).json({ message: 'Followed successfully' });
      return;
    }
    const newReq = frRepo.create({
      requester: { id: requesterId } as User,
      target:     { id: targetId } as User
    });
    await frRepo.save(newReq);
    const notifRepo = AppDataSource.getRepository(Notification);
    await notifRepo.save(notifRepo.create({
      user: { id: targetId } as User,
      type: NotificationType.FOLLOW_REQUEST,
      data: { from: requesterId }
    }));
    res.status(201).json({ message: 'Follow request sent' });
  } catch (err) {
    next(err);
  }
}

export async function acceptFollowRequestController(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const reqId = Number(req.params.requestId);
    const meId = (req as any).userId as number;
    if (Number.isNaN(reqId)) {
      res.status(400).json({ error: 'Invalid request id' });
      return;
    }
    const frRepo = AppDataSource.getRepository(FollowRequest);
    const request = await frRepo.findOne({ where: { id: reqId }, relations: ['requester','target'] });
    if (!request) {
      res.status(404).json({ error: 'Request not found' });
      return;
    }
    if (request.target.id !== meId) {
      res.status(403).json({ error: 'Not authorized' });
      return;
    }
    if (request.status !== FollowRequestStatus.PENDING) {
      res.status(409).json({ error: 'Request already handled' });
      return;
    }
    request.status = FollowRequestStatus.ACCEPTED;
    await frRepo.save(request);
    const ufRepo = AppDataSource.getRepository(UserFollow);
    await ufRepo.save(ufRepo.create({
      follower:  { id: request.requester.id } as User,
      following: { id: meId } as User
    }));
    const notifRepo = AppDataSource.getRepository(Notification);
    await notifRepo.save(notifRepo.create({
      user: { id: request.requester.id } as User,
      type: NotificationType.REQUEST_ACCEPTED,
      data: { by: meId }
    }));
    res.json({ message: 'Follow request accepted' });
  } catch (err) {
    next(err);
  }
}

export async function rejectFollowRequestController(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const reqId = Number(req.params.requestId);
    const meId = (req as any).userId as number;
    if (Number.isNaN(reqId)) {
      res.status(400).json({ error: 'Invalid request id' });
      return;
    }
    const frRepo = AppDataSource.getRepository(FollowRequest);
    const request = await frRepo.findOne({ where: { id: reqId }, relations: ['target'] });
    if (!request) {
      res.status(404).json({ error: 'Request not found' });
      return;
    }
    if (request.target.id !== meId) {
      res.status(403).json({ error: 'Not authorized' });
      return;
    }
    if (request.status !== FollowRequestStatus.PENDING) {
      res.status(409).json({ error: 'Request already handled' });
      return;
    }
    request.status = FollowRequestStatus.REJECTED;
    await frRepo.save(request);
    res.json({ message: 'Follow request rejected' });
  } catch (err) {
    next(err);
  }
}