// src/entities/Post.ts
import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, OneToMany, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { User } from './User';
import { Media } from './Media';

@Entity('posts')
export class Post {
  @PrimaryGeneratedColumn()
  id!: number;             

  @ManyToOne(() => User, user => user.posts, { onDelete: 'CASCADE' })
  author!: User;          

  @Column('text', { nullable: true })
  text?: string;

  @OneToMany(() => Media, media => media.post, { cascade: true })
  media!: Media[];        

  @CreateDateColumn()
  createdAt!: Date;         

  @UpdateDateColumn()
  updatedAt!: Date;       
}
