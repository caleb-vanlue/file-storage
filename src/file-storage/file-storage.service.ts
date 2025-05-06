import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { StoredFile } from './entities/stored-file.entity';
import { ConfigService } from '@nestjs/config';
import * as fs from 'fs';
import * as path from 'path';
import { promisify } from 'util';
import { v4 as uuidv4 } from 'uuid';

const mkdirAsync = promisify(fs.mkdir);
const existsAsync = promisify(fs.exists);
const unlinkAsync = promisify(fs.unlink);

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
    options: {
      isPublic?: boolean;
      referenceType?: string;
      referenceId?: string;
    } = {},
  ): Promise<StoredFile> {
    const {
      isPublic = false,
      referenceType = null,
      referenceId = null,
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
    storedFile.referenceType = referenceType ? referenceType : undefined;
    storedFile.referenceId = referenceId ? referenceId : undefined;

    return this.fileRepository.save(storedFile);
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
