// src/entities/FollowRequest.ts
import {
  Entity,
  PrimaryGeneratedColumn,
  ManyToOne,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { User } from '../User';

export enum FollowRequestStatus {
  PENDING = 'pending',
  ACCEPTED = 'accepted',
  REJECTED = 'rejected',
}

@Entity('follow_requests')
export class FollowRequest {
  @PrimaryGeneratedColumn()
  id!: number;

  @ManyToOne(() => User, u => u.outgoingRequests, { onDelete: 'CASCADE' })
  requester!: User;

  @ManyToOne(() => User, u => u.incomingRequests, { onDelete: 'CASCADE' })
  target!: User;

  @Column({ type: 'enum', enum: FollowRequestStatus, default: FollowRequestStatus.PENDING })
  status!: FollowRequestStatus;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
}
