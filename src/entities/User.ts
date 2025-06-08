// src/entities/User.ts
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { UserFollow } from './UsertoUserEntities/UserFollow';
import { FollowRequest } from './UsertoUserEntities/FollowRequest';
import { Notification } from './Notification';
import { UserBlock } from './UsertoUserEntities/UserBlock';
import { Post } from './Post';  // ← import the Post entity

@Entity('users')
export class User {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: 'text', unique: true })
  username!: string;

  @Column({ type: 'text', unique: true })
  email!: string;

  @Column({ type: 'text', name: 'password_hash' })
  passwordHash!: string;

  @Column({ type: 'boolean', name: 'is_private', default: false })
  isPrivate!: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;

  @OneToMany(() => UserFollow, uf => uf.follower)
  following!: UserFollow[];

  @OneToMany(() => UserFollow, uf => uf.following)
  followers!: UserFollow[];

  @OneToMany(() => FollowRequest, fr => fr.requester)
  outgoingRequests!: FollowRequest[];

  @OneToMany(() => FollowRequest, fr => fr.target)
  incomingRequests!: FollowRequest[];

  @OneToMany(() => Notification, n => n.user)
  notifications!: Notification[];

  // users I have blocked
  @OneToMany(() => UserBlock, ub => ub.blocker)
  blocks!: UserBlock[];

  // users who have blocked me
  @OneToMany(() => UserBlock, ub => ub.blocked)
  blockedBy!: UserBlock[];

  // ← add this:
  @OneToMany(() => Post, post => post.author)
  posts!: Post[];
}
