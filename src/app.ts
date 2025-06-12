// src/app.ts
import 'dotenv/config';
import express from 'express';
import cookieParser from 'cookie-parser';
import authRoutes from './routes/authRoute';
import userRoutes from './routes/userRoutes';
import followRequestRoutes from './routes/userRoutes/followRequestRoute';
import notificationRoutes from './routes/notificationRoute';
import postRoutes from './routes/postRoute';
import { errorHandler } from './middleware/errorHandler';

const app = express();

// 1) Body parser
app.use(express.json());

// 2) Cookie parser (register here)
app.use(cookieParser());

// Public auth endpoints
app.use('/api/auth', authRoutes);

// Protect everything under /api/users
app.use('/api/users', userRoutes);

// Follow request flows
app.use('/api/follow-requests', followRequestRoutes);

// Notifications
app.use('/api/notifications', notificationRoutes);

// Posts
app.use('/api/posts', postRoutes);

// Health‐check or home
// @ts-ignore
app.get('/', (_req, res) => res.send('Hello, world!'));

// Global error handler
app.use(errorHandler);

export default app;
