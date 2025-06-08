// src/routes/notificationRoutes.ts
import { Router } from 'express';
import { authMiddleware } from '../middleware/auth';
import {
  getNotificationsController,
  markNotificationReadController
} from '../controllers/notification/notificationController';

const router = Router();
router.use(authMiddleware);

// GET /api/notifications
router.get('/', getNotificationsController);
// POST /api/notifications/:id/read
router.post('/:id/read', markNotificationReadController);

export default router;