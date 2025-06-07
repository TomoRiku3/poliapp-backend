// src/controllers/authController.ts
import { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { AppDataSource } from '../config/data-source';
import { User } from '../entities/User';

const userRepo = AppDataSource.getRepository(User);
const JWT_SECRET = process.env.JWT_SECRET!;
const SALT_ROUNDS = 10;

export async function registerController(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { username, email, password } = req.body;
    if (!username || !email || !password) {
      res.status(400).json({ error: 'Missing fields' });
      return;
    }

    const existing = await userRepo.findOne({
      where: [{ email }, { username }],
    });
    if (existing) {
      res.status(409).json({ error: 'User already exists' });
      return;
    }

    const hash = await bcrypt.hash(password, SALT_ROUNDS);
    const user = userRepo.create({
      username,
      email,
      passwordHash: hash,
    });
    await userRepo.save(user);

    const token = jwt.sign({ userId: user.id }, JWT_SECRET, {
      expiresIn: '7d',
    });
    res.status(201).json({ token, user: { id: user.id, username, email } });
  } catch (err) {
    next(err);
  }
}

export async function loginController(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      res.status(400).json({ error: 'Missing fields' });
      return;
    }

    const user = await userRepo.findOne({ where: { email } });
    if (!user) {
      res.status(401).json({ error: 'Invalid credentials' });
      return;
    }

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      res.status(401).json({ error: 'Invalid credentials' });
      return;
    }

    const token = jwt.sign({ userId: user.id }, JWT_SECRET, {
      expiresIn: '7d',
    });
    res.json({
      token,
      user: { id: user.id, username: user.username, email: user.email },
    });
  } catch (err) {
    next(err);
  }
}
