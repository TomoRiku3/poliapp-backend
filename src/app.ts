// src/app.ts
import 'dotenv/config';
import express from 'express';
import authRoutes from './routes/authRoute';
import userRoutes from './routes/userRoute';
import { authMiddleware } from './middleware/auth';
import { errorHandler } from './middleware/errorHandler';

const app = express();
app.use(express.json());

// Public auth endpoints
app.use('/api/auth', authRoutes);

// Protect everything under /api/users
app.use('/api/users', authMiddleware, userRoutes);

// Health‐check or home
// @ts-ignore
app.get('/', (_req, res) => res.send('Hello, world!'));

// Global error handler
app.use(errorHandler);

export default app;
