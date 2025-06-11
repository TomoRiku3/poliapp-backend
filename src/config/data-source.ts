// src/config/data-source.ts
import 'reflect-metadata';
import { DataSource } from 'typeorm';
import { User } from '../entities/User';
import { Post } from '../entities/Post';
import { Media } from '../entities/Media';
import { Notification } from '../entities/Notification';
import { Like } from '../entities/UsertoPostEntities/LikePost';
import { UserFollow } from '../entities/UsertoUserEntities/UserFollow';
import { FollowRequest } from '../entities/UsertoUserEntities/FollowRequest';
import { UserBlock } from '../entities/UsertoUserEntities/UserBlock';


export const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: +(process.env.DB_PORT || 5432),
  username: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASS || 'password',
  database: process.env.DB_NAME || 'poliapp_dev',
  synchronize: false,          // never use `synchronize: true` in production
  logging: false,
  entities: [User, Post, Media, Notification, Like,
    UserFollow, FollowRequest, UserBlock],
  migrations: ['src/migrations/*.ts'],
  subscribers: [],
});
