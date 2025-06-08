// src/entities/UserFollow.ts
import {
  Entity, PrimaryGeneratedColumn,
  ManyToOne, CreateDateColumn
} from 'typeorm';
import { User } from '../User';

@Entity('user_follows')
export class UserFollow {
  @PrimaryGeneratedColumn()
  id!: number;

  @ManyToOne(() => User, user => user.following, { onDelete: 'CASCADE' })
  follower!: User;

  @ManyToOne(() => User, user => user.followers, { onDelete: 'CASCADE' })
  following!: User;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;
}
