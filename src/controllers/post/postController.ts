// src/controllers/postController.ts
import { Request, Response, NextFunction } from 'express';
import { AppDataSource } from '../../config/data-source';
import { Post } from '../../entities/Post';
import { Media } from '../../entities/Media';
import { uploadObject } from '../../services/storage';
import { StatusCodes } from '../../constants/statusCode';

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
    const postId = Number(req.params.id);
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

