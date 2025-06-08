// src/routes/blockRoutes.ts
import { Router } from 'express';
import { authMiddleware } from '../middleware/auth';
import { blockUserController, unblockUserController } from '../controllers/user/blockController';

const router = Router();
router.use(authMiddleware);

// POST /api/users/:id/block
router.post('/:id/block', blockUserController);

// DELETE /api/users/:id/block
router.delete('/:id/block', unblockUserController);

export default router;
