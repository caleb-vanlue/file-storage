import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

@Entity('stored_files')
export class StoredFile {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 255 })
  filename: string;

  @Column({ length: 255 })
  originalName: string;

  @Column({ length: 100 })
  mimeType: string;

  @Column({ length: 255 })
  path: string;

  @Column()
  size: number;

  @Column({ default: false })
  isPublic: boolean;

  @Column({ nullable: true })
  referenceType?: string;

  @Column({ nullable: true })
  referenceId?: string;

  @Column({ nullable: true })
  @Index()
  plexMediaType?: string; // 'movie', 'show', 'album', 'season', etc.

  @Column({ nullable: true })
  @Index()
  plexRatingKey?: string; // Individual item rating key

  @Column({ nullable: true })
  @Index()
  plexParentRatingKey?: string; // Parent rating key (album/season)

  @Column({ nullable: true })
  @Index()
  plexGrandparentRatingKey?: string; // Grandparent rating key (show)

  @Column({ nullable: true })
  plexTitle?: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
