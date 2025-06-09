// src/controllers/postController.ts
import { Request, Response, NextFunction } from 'express';
import { AppDataSource } from '../../config/data-source';
import { Post } from '../../entities/Post';
import { Media } from '../../entities/Media';
import { uploadObject } from '../../services/storage';
import { StatusCodes } from '../../constants/statusCode';
import { User } from '../../entities/User';
import { canViewPost } from '../../policies/postPolicy';

// api/post
export async function createPostController(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const authorId = (req as any).userId as number;
    const text = req.body.text as string | undefined;
    const files = (req as any).files as Express.Multer.File[] | undefined;

    const postRepo = AppDataSource.getRepository(Post);
    const mediaRepo = AppDataSource.getRepository(Media);

    // Create and save post metadata
    const post = postRepo.create({ author: { id: authorId } as any, text });
    const savedPost = await postRepo.save(post);

    // Handle media uploads
    if (files && files.length) {
      for (const file of files) {
        const key = `posts/${savedPost.id}/${Date.now()}_${file.originalname}`;
        const url = await uploadObject(file.buffer, key, file.mimetype);
        // @ts-ignore
        const media = mediaRepo.create({
          post: { id: savedPost.id } as any,
          type: file.mimetype.startsWith('image/') ? 'IMAGE' : 'VIDEO',
          url
        });
        await mediaRepo.save(media);
      }
    }

    res.status(StatusCodes.CREATED).json({ postId: savedPost.id });
  } catch (err) {
    next(err);
  }
}

// api/post/:id
export async function getPostController(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const viewerId = req.userId;
    const postId = Number(req.params.id);

    // 1) Check if viewer can see this post
    if (!await canViewPost(viewerId, postId)) {
      res.status(StatusCodes.FORBIDDEN).json({ error: 'Forbidden' });
      return;
    }

    if (Number.isNaN(postId)) {
      res.status(StatusCodes.BAD_REQUEST).json({ error: 'Invalid post id' });
      return;
    }

    const postRepo = AppDataSource.getRepository(Post);
    const post = await postRepo.findOne({
      where: { id: postId },
      relations: ['author', 'media']
    });

    if (!post) {
      res.status(StatusCodes.NOT_FOUND).json({ error: 'Post not found' });
      return;
    }

    res.json(post);
  } catch (err) {
    next(err);
  }
}

// POST api/post/:id/reply
export async function replyToPostController(
  req: Request, res: Response, next: NextFunction
) {
  try {
    const viewerId = req.userId;
    const authorId = (req as any).userId as number;

    // 1) Check if viewer can see this post
    if (!await canViewPost(viewerId, authorId)) {
      res.status(StatusCodes.FORBIDDEN).json({ error: 'Forbidden' });
      return;
    }

    const parentId = Number(req.params.id);
    if (Number.isNaN(parentId)) {
      res.status(400).json({ error: 'Invalid post id' });
      return;
    }

    // 1) confirm the parent exists
    const postRepo = AppDataSource.getRepository(Post);
    const parent = await postRepo.findOne({ where: { id: parentId } });
    if (!parent) {
      res.status(404).json({ error: 'Parent post not found' });
      return;
    }

    // 2) create reply
    const { text } = req.body;
    const reply = postRepo.create({
      author: { id: authorId } as User,
      text,
      parent: { id: parentId } as any
    });
    const saved = await postRepo.save(reply);
    res.status(201).json({ postId: saved.id });
  } catch (err) {
    next(err);
  }
}

// GET api/post/:id/replies
export async function getRepliesController(
  req: Request, res: Response, next: NextFunction
) {
  try {

    const postId = Number(req.params.id);
    const page   = Math.max(1, Number(req.query.page)   || 1);
    const limit  = Math.max(1, Number(req.query.limit)  || 20);
    const viewerId = req.userId as number;

    if (Number.isNaN(postId)) {
      res.status(400).json({ error: 'Invalid post id' });
      return;
    }

    const postRepo = AppDataSource.getRepository(Post);
    const [ items, total ] = await postRepo.findAndCount({
      where: { parent: { id: postId } },
      relations: ['author','media'],
      order: { createdAt: 'ASC' },
      skip: (page - 1) * limit,
      take: limit
    });

    // Filter by permission
    const visible: Post[] = [];
    for (const reply of items) {
      if (await canViewPost(viewerId, reply.id)) {
        visible.push(reply);
      }
    }

    res.json({
      page,
      limit,
      total,
      replies: visible
    });
  } catch (err) {
    next(err);
  }
}

