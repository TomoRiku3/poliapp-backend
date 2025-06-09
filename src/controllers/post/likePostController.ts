// src/controllers/post/likePostController.ts

import { Request, Response, NextFunction } from 'express';
import { AppDataSource } from '../../config/data-source';
import { Like } from '../../entities/UsertoPostEntities/LikePost';
import { Post } from '../../entities/Post';


// POST /api/posts/:id/like
export async function likePostController(
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> {
  const userId = req.userId, postId = +req.params.id;
  const postRepo = AppDataSource.getRepository(Post);
  const likeRepo = AppDataSource.getRepository(Like);
  try {
    const existing = await likeRepo.findOne({ where: { user: { id: userId }, post: { id: postId } } });
    if (existing) {
      // unlike
      await likeRepo.delete(existing.id);
      await postRepo.decrement({ id: postId }, 'likeCount', 1);
      res.json({ liked: false });
      return;
    }
    // new like
    const like = likeRepo.create({ user: { id: userId }, post: { id: postId } });
    await likeRepo.save(like);
    await postRepo.increment({ id: postId }, 'likeCount', 1);
    res.json({ liked: true });
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

