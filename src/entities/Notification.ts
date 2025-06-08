// src/entities/Notification.ts
import {
  Entity,
  PrimaryGeneratedColumn,
  ManyToOne,
  Column,
  CreateDateColumn,
} from 'typeorm';
import { User } from './User';

export enum NotificationType {
  FOLLOW_REQUEST = 'follow_request',
  REQUEST_ACCEPTED = 'request_accepted',
}

@Entity('notifications')
export class Notification {
  @PrimaryGeneratedColumn()
  id!: number;

  @ManyToOne(() => User, u => u.notifications, { onDelete: 'CASCADE' })
  user!: User;

  @Column({ type: 'enum', enum: NotificationType })
  type!: NotificationType;

  @Column({ type: 'jsonb', nullable: true })
  data!: Record<string, any>;

  @Column({ default: false })
  read!: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;
}
