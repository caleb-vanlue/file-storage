import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
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

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
