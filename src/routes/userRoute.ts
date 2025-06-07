// src/routes/userRoutes.ts
import { Router } from 'express';
import { getMeController } from '../controllers/user/userController';
import { authMiddleware } from '../middleware/auth';

const router = Router();

// Protect *all* /api/users routes:
router.use(authMiddleware);

// GET /api/users/me
router.get('/me', getMeController);

// … later you can add more user routes here …

export default router;
