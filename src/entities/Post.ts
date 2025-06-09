// src/entities/Post.ts
import {
  Entity, PrimaryGeneratedColumn, Column,
  ManyToOne, OneToMany, CreateDateColumn, UpdateDateColumn
} from 'typeorm';
import { User } from './User';
import { Media } from './Media';
import { Like } from './UsertoPostEntities/LikePost'

@Entity('posts')
export class Post {
  @PrimaryGeneratedColumn()          id!: number;

  @ManyToOne(() => User, u => u.posts, { onDelete: 'CASCADE' })
                                     author!: User;

  @Column('text', { nullable: true }) text?: string;

  @OneToMany(() => Media, m => m.post, { cascade: true })
                                     media!: Media[];

  // ← new: parent post, if this is a reply
  @ManyToOne(() => Post, p => p.replies, { nullable: true, onDelete: 'CASCADE' })
                                     parent?: Post;

  // ← new: back-relation to fetch replies
  @OneToMany(() => Post, p => p.parent)
                                     replies!: Post[];

  // ← new: likes on this post                                
  @OneToMany(() => Like, like => like.post)
                                      likes!: Like[];

  //  a cached counter
  @Column({ default: 0 })
  likeCount!: number;

  @CreateDateColumn()                createdAt!: Date;
  @UpdateDateColumn()                updatedAt!: Date;
}
