// src/entities/Media.ts
import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn } from 'typeorm';
import { Post } from './Post';

export enum MediaType {
  IMAGE = 'IMAGE',
  VIDEO = 'VIDEO'
}

@Entity('media')
export class Media {
  @PrimaryGeneratedColumn()
  id!: number;

  @ManyToOne(() => Post, post => post.media, { onDelete: 'CASCADE' })
  post!: Post;

  @Column({ type: 'enum', enum: MediaType })
  type!: MediaType;

  @Column()
  url!: string;

  @Column({ nullable: true })
  width?: number;

  @Column({ nullable: true })
  height?: number;

  @CreateDateColumn()
  createdAt!: Date;
}
