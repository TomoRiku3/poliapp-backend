// src/controllers/post/likePostController.ts

import { Request, Response, NextFunction } from 'express';
import { AppDataSource } from '../../config/data-source';
import { Like } from '../../entities/UsertoPostEntities/LikePost';
import { Post } from '../../entities/Post';
import { User } from '../../entities/User';
import { Notification, NotificationType } from '../../entities/Notification';


// POST /api/posts/:id/like
export async function likePostController(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const userId = req.userId as number;
    const postId = Number(req.params.id);

    if (Number.isNaN(postId)) {
      res.status(400).json({ error: 'Invalid post id' });
      return;
    }

    const postRepo = AppDataSource.getRepository(Post);
    const likeRepo = AppDataSource.getRepository(Like);

    // Check for existing like
    const existing = await likeRepo.findOne({
      where: { user: { id: userId }, post: { id: postId } }
    });

    if (existing) {
      // Unlike
      await likeRepo.delete(existing.id);
      await postRepo.decrement({ id: postId }, 'likeCount', 1);
      res.json({ liked: false });
      return;
    }

    // New like
    const like = likeRepo.create({
      user: { id: userId } as User,
      post: { id: postId } as Post
    });
    await likeRepo.save(like);
    await postRepo.increment({ id: postId }, 'likeCount', 1);

    // Create a notification for the post author
    const post = await postRepo.findOne({
      where: { id: postId },
      relations: ['author']
    });
    if (post && post.author) {
      const notifRepo = AppDataSource.getRepository(Notification);
      const notification = notifRepo.create({
        user: { id: post.author.id } as User,
        type: NotificationType.POST_LIKED,
        data: { by: userId, postId }
      });
      await notifRepo.save(notification);
    }
    res.json({ liked: true });
    return;
  } catch (err) {
    next(err);
  }
}
// GET /api/posts/:id/likes
export async function getPostLikesController(
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> {
  try {
  const postId = +req.params.id;
  const postRepo = AppDataSource.getRepository(Post);
  const post = await postRepo.findOne({ where: { id: postId }, select: ['likeCount'] });
  if (!post) {
    res.status(404).json({ error: 'Post not found' });
    return;
  }
  res.json({ likeCount: post.likeCount });
  return;
  } catch (err) {
    next(err);
  }
}

