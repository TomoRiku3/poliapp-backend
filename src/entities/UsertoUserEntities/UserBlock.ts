// src/entities/UserBlock.ts
import {
  Entity,
  PrimaryGeneratedColumn,
  ManyToOne,
  CreateDateColumn,
} from 'typeorm';
import { User } from '../User';

@Entity('user_blocks')
export class UserBlock {
  @PrimaryGeneratedColumn()
  id!: number;

  @ManyToOne(() => User, u => u.blocks, { onDelete: 'CASCADE' })
  blocker!: User;

  @ManyToOne(() => User, u => u.blockedBy, { onDelete: 'CASCADE' })
  blocked!: User;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;
}
