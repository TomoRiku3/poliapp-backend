// src/entities/Like.ts
import {
  Entity, PrimaryGeneratedColumn,
  ManyToOne, CreateDateColumn, Unique
} from 'typeorm';
import { User } from '../User';
import { Post } from '../Post';

@Entity('likes')
@Unique(['user', 'post'])
export class Like {
  @PrimaryGeneratedColumn() id!: number;

  @ManyToOne(() => User, user => user.likes, { onDelete: 'CASCADE' })
  user!: User;

  @ManyToOne(() => Post, post => post.likes, { onDelete: 'CASCADE' })
  post!: Post;

  @CreateDateColumn() createdAt!: Date;
}

