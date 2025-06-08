// src/routes/followRequestRoutes.ts
import { Router } from 'express';
import { authMiddleware } from '../../middleware/auth';
import {
  createFollowRequestController,
  acceptFollowRequestController,
  rejectFollowRequestController
} from '../../controllers/user/followRequestController';

const router = Router();
router.use(authMiddleware);

// POST /api/follow-requests/:id/follow
router.post('/:id/follow', createFollowRequestController);
// POST /api/follow-requests/:requestId/accept
router.post('/:requestId/accept', acceptFollowRequestController);
// POST /api/follow-requests/:requestId/reject
router.post('/:requestId/reject', rejectFollowRequestController);

export default router;