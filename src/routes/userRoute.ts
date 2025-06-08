// src/routes/userRoutes.ts
import { Router } from 'express';
import { getMeController, getUserByIdController
 } from '../controllers/user/userController';
import { getUserFollowingController } from '../controllers/user/followController';
import { authMiddleware } from '../middleware/auth';

const router = Router();

// Protect *all* /api/users routes:
router.use(authMiddleware);

// GET /api/users/me
router.get('/me', getMeController);

// GET /api/users/:id
router.get('/:id', getUserByIdController);

// GET /api/users/:id/following
router.get('/:id/following', getUserFollowingController);

// … later you can add more user routes here …

export default router;
