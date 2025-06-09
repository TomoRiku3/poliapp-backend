// src/policies/postPolicy.ts
import { AppDataSource } from '../config/data-source';
import { Post } from '../entities/Post';

export async function canViewPost(viewerId: number, postId: number): Promise<boolean> {
  const repo = AppDataSource.getRepository(Post);
  const post = await repo.findOne({
    where: { id: postId },
    relations: ['author', 'author.followers', 'author.blockedBy']
  });
  if (!post) return false;

  // 1) Author blocked you?
  if (post.author.blockedBy.some(b => b.blocker.id === post.author.id && b.blocked.id === viewerId)) {
    return false;
  }

  // 2) Public account?
  if (!post.author.isPrivate) return true;

  // 3) Private → are you in followers?
  return post.author.followers.some(f => f.follower.id === viewerId);
}
