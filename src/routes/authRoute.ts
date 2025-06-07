// src/routes/authRoutes.ts
import { Router } from 'express';
import { registerController, loginController } from '../controllers/authController';

const router = Router();

// Registration: hashes the password then saves new user
router.post('/register', registerController);

// Login: verifies password hash and issues a JWT
router.post('/login', loginController);

export default router;
