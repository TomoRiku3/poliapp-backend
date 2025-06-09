// src/policies/userProfilePolicy.ts
import { AppDataSource } from '../config/data-source';
import { User } from '../entities/User';
import { UserFollow } from '../entities/UsertoUserEntities/UserFollow';
import { UserBlock } from '../entities/UsertoUserEntities/UserBlock';

/**
 * Determines whether a viewer can see a target user's profile.
 * Rules:
 * 1. A user can always view their own profile.
 * 2. If either the viewer has blocked the target, or the target has blocked the viewer, visibility = false.
 * 3. If the target's account is public, visibility = true.
 * 4. If the target's account is private, only direct followers can view.
 */
export async function canViewUserProfile(
  viewerId: number,
  targetId: number
): Promise<boolean> {
  // 1. Self
  if (viewerId === targetId) {
    return true;
  }

  const blockRepo = AppDataSource.getRepository(UserBlock);
  // 2. Blocking check (either direction)
  const block = await blockRepo.findOne({
    where: [
      { blocker: { id: viewerId }, blocked: { id: targetId } },
      { blocker: { id: targetId }, blocked: { id: viewerId } }
    ]
  });
  if (block) {
    return false;
  }

  // 3. Load target user privacy
  const userRepo = AppDataSource.getRepository(User);
  const target = await userRepo.findOne({ where: { id: targetId } });
  if (!target) {
    return false;  // or throw if you prefer
  }
  if (!target.isPrivate) {
    return true;
  }

  // 4. Private account: check follow relationship
  const followRepo = AppDataSource.getRepository(UserFollow);
  const follow = await followRepo.findOne({
    where: { follower: { id: viewerId }, following: { id: targetId } }
  });

  return !!follow;
}
