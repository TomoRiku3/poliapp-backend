// src/routes/userRoutes.ts
import { Router } from 'express';
import { getMeController, getUserByIdController
 } from '../controllers/user/userController';
import { getUserFollowingController } from '../controllers/user/followController';
import { authMiddleware } from '../middleware/auth';
import { blockUserController, unblockUserController } from '../controllers/user/blockController';
import { searchUsersController } from '../controllers/user/searchUsersController';

const router = Router();

// Protect *all* /api/users routes:
router.use(authMiddleware);

// GET /api/users/me
router.get('/me', getMeController);

// GET /api/users/search
router.get('/search', searchUsersController);

// GET /api/users/:id/following
router.get('/:id/following', getUserFollowingController);

// POST /api/users/:id/block
router.post('/:id/block', blockUserController);

// DELETE /api/users/:id/block
router.delete('/:id/block', unblockUserController);

// GET /api/users/:id
router.get('/:id', getUserByIdController);



// … later you can add more user routes here …

export default router;
