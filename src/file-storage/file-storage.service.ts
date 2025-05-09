import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, FindOptionsWhere, Brackets } from 'typeorm';
import { StoredFile } from './entities/stored-file.entity';
import { ConfigService } from '@nestjs/config';
import * as fs from 'fs';
import * as path from 'path';
import { promisify } from 'util';
import { v4 as uuidv4 } from 'uuid';

const mkdirAsync = promisify(fs.mkdir);
const existsAsync = promisify(fs.exists);
const unlinkAsync = promisify(fs.unlink);

interface StoreFileOptions {
  isPublic?: boolean;
  referenceType?: string;
  referenceId?: string;
  // Plex-specific metadata
  plexMediaType?: string;
  plexRatingKey?: string;
  plexParentRatingKey?: string;
  plexGrandparentRatingKey?: string;
  plexTitle?: string;
}

interface PlexThumbnailQuery {
  plexMediaType?: string;
  plexRatingKey?: string;
  plexParentRatingKey?: string;
  plexGrandparentRatingKey?: string;
}

@Injectable()
export class FileStorageService {
  private readonly logger = new Logger(FileStorageService.name);
  private readonly storagePath: string;

  constructor(
    @InjectRepository(StoredFile)
    private fileRepository: Repository<StoredFile>,
    private configService: ConfigService,
  ) {
    this.storagePath =
      this.configService.get<string>('FILE_STORAGE_PATH') || './storage';
    this.ensureStorageDirectoryExists();
  }

  private async ensureStorageDirectoryExists() {
    try {
      if (!(await existsAsync(this.storagePath))) {
        await mkdirAsync(this.storagePath, { recursive: true });
        this.logger.log(`Created storage directory: ${this.storagePath}`);
      }
    } catch (error) {
      this.logger.error(`Failed to create storage directory: ${error.message}`);
      throw error;
    }
  }

  async storeFile(
    file: Express.Multer.File,
    options: StoreFileOptions = {},
  ): Promise<StoredFile> {
    const {
      isPublic = false,
      referenceType = null,
      referenceId = null,
      plexMediaType = null,
      plexRatingKey = null,
      plexParentRatingKey = null,
      plexGrandparentRatingKey = null,
      plexTitle = null,
    } = options;

    const fileExtension = path.extname(file.originalname);
    const uniqueFilename = `${uuidv4()}${fileExtension}`;
    const relativePath = this.getRelativePath(uniqueFilename);
    const absolutePath = path.join(this.storagePath, relativePath);

    const directory = path.dirname(absolutePath);
    if (!(await existsAsync(directory))) {
      await mkdirAsync(directory, { recursive: true });
    }

    await fs.promises.writeFile(absolutePath, file.buffer);

    const storedFile = new StoredFile();
    storedFile.filename = uniqueFilename;
    storedFile.originalName = file.originalname;
    storedFile.mimeType = file.mimetype;
    storedFile.path = relativePath;
    storedFile.size = file.size;
    storedFile.isPublic = isPublic;
    storedFile.referenceType = referenceType || undefined;
    storedFile.referenceId = referenceId || undefined;

    storedFile.plexMediaType = plexMediaType || undefined;
    storedFile.plexRatingKey = plexRatingKey || undefined;
    storedFile.plexParentRatingKey = plexParentRatingKey || undefined;
    storedFile.plexGrandparentRatingKey = plexGrandparentRatingKey || undefined;
    storedFile.plexTitle = plexTitle || undefined;

    return this.fileRepository.save(storedFile);
  }

  async findPlexThumbnail(
    query: PlexThumbnailQuery,
  ): Promise<StoredFile | null> {
    this.logger.debug(
      `Finding Plex thumbnail with query: ${JSON.stringify(query)}`,
    );

    const whereConditions: FindOptionsWhere<StoredFile> = {};

    if (query.plexRatingKey) {
      whereConditions.plexRatingKey = query.plexRatingKey;
    }
    if (query.plexParentRatingKey) {
      whereConditions.plexParentRatingKey = query.plexParentRatingKey;
    }
    if (query.plexGrandparentRatingKey) {
      whereConditions.plexGrandparentRatingKey = query.plexGrandparentRatingKey;
    }

    if (Object.keys(whereConditions).length <= 1 && query.plexMediaType) {
      this.logger.debug('Not enough specific conditions for thumbnail search');
      return null;
    }

    try {
      const thumbnail = await this.fileRepository
        .createQueryBuilder('StoredFile')
        .where(
          new Brackets((qb) => {
            qb.where('StoredFile.plexRatingKey = :plexRatingKey', {
              plexRatingKey: query.plexRatingKey,
            })
              .orWhere(
                'StoredFile.plexParentRatingKey = :plexParentRatingKey',
                { plexParentRatingKey: query.plexParentRatingKey },
              )
              .orWhere(
                'StoredFile.plexGrandparentRatingKey = :plexGrandparentRatingKey',
                { plexGrandparentRatingKey: query.plexGrandparentRatingKey },
              );
          }),
        )
        .andWhere('StoredFile.plexMediaType = :plexMediaType', {
          plexMediaType: query.plexMediaType,
        })
        .orderBy('StoredFile.createdAt', 'DESC')
        .limit(1)
        .getOne();

      if (thumbnail) {
        this.logger.debug(`Found thumbnail: ${thumbnail.id} for query`);
      } else {
        this.logger.debug('No matching thumbnail found');
      }

      return thumbnail || null;
    } catch (error) {
      this.logger.error(`Error finding Plex thumbnail: ${error.message}`);
      return null;
    }
  }

  async deleteFile(id: string): Promise<void> {
    const file = await this.getFileById(id);

    const filePath = this.getFilePath(file);
    if (await existsAsync(filePath)) {
      await unlinkAsync(filePath);
    }

    await this.fileRepository.remove(file);
    this.logger.log(`Deleted file: ${file.filename} (ID: ${file.id})`);
  }

  async getFileById(id: string): Promise<StoredFile> {
    const file = await this.fileRepository.findOne({ where: { id } });
    if (!file) {
      throw new NotFoundException(`File with ID ${id} not found`);
    }
    return file;
  }

  async getFileByFilename(filename: string): Promise<StoredFile> {
    const file = await this.fileRepository.findOne({ where: { filename } });
    if (!file) {
      throw new NotFoundException(`File with filename ${filename} not found`);
    }
    return file;
  }

  getFilePath(file: StoredFile): string {
    return path.join(this.storagePath, file.path);
  }

  private getRelativePath(filename: string): string {
    // Organize files into subdirectories based on first 2 chars of filename
    const prefix = filename.substring(0, 2);
    return path.join(prefix, filename);
  }
}
