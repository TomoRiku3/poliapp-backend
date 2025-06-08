// src/routes/postRoutes.ts
import express from 'express';
import multer from 'multer';
import { createPostController, getPostController } from '../controllers/post/postController';

const router = express.Router();
const upload = multer(); // memory storage for buffer upload

// Create a new post (text + optional media files[])
// POST /api/posts
router.post('/', upload.array('media'), createPostController);

// /api/posts/:id
router.get('/:id', getPostController);

export default router;
