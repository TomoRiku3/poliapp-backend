// src/routes/postRoutes.ts
import express from 'express';
import multer from 'multer';
import { authMiddleware } from '../middleware/auth';

import { 
    createPostController, 
    getPostController,
    replyToPostController,
    getRepliesController
} from '../controllers/post/postController';

import { 
    likePostController, 
    getPostLikesController 
} from '../controllers/post/likePostController';

const router = express.Router();
const upload = multer(); // memory storage for buffer upload

// Protect *all* /api/users routes:
router.use(authMiddleware);

// Create a new post (text + optional media files[])
// POST /api/posts
router.post('/', upload.array('media'), createPostController);

// /api/posts/:id
router.get('/:id', getPostController);

// /api/posts/:id/replies
router.post('/:id/replies', replyToPostController);
router.get( '/:id/replies', getRepliesController);


// /api/posts/:id/like
router.post('/:id/like', likePostController);
router.get('/:id/likes', getPostLikesController);

export default router;
