import {
  Controller,
  Get,
  Post,
  Param,
  Delete,
  UseInterceptors,
  UploadedFile,
  Res,
  Query,
  Body,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Response } from 'express';
import { FileStorageService } from './file-storage.service';
import { createReadStream } from 'fs';
import { existsSync } from 'fs';

@Controller('files')
export class FileStorageController {
  private readonly logger = new Logger(FileStorageController.name);

  constructor(private readonly fileStorageService: FileStorageService) {}

  @Post('upload')
  @UseInterceptors(FileInterceptor('file'))
  async uploadFile(
    @UploadedFile() file: Express.Multer.File,
    @Body('referenceType') referenceType?: string,
    @Body('referenceId') referenceId?: string,
    @Body('isPublic') isPublic?: string,
  ) {
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }

    try {
      const storedFile = await this.fileStorageService.storeFile(file, {
        isPublic: isPublic === 'true',
        referenceType,
        referenceId,
      });

      return {
        id: storedFile.id,
        filename: storedFile.filename,
        originalName: storedFile.originalName,
        mimeType: storedFile.mimeType,
        size: storedFile.size,
        url: `/files/${storedFile.filename}`,
      };
    } catch (error) {
      this.logger.error(`Error uploading file: ${error.message}`);
      throw new BadRequestException(`Error uploading file: ${error.message}`);
    }
  }

  @Get(':filename')
  async getFile(@Param('filename') filename: string, @Res() res: Response) {
    try {
      const file = await this.fileStorageService.getFileByFilename(filename);
      const filePath = this.fileStorageService.getFilePath(file);

      if (!existsSync(filePath)) {
        throw new NotFoundException(`File not found on disk: ${filename}`);
      }

      res.set({
        'Content-Type': file.mimeType,
        'Content-Disposition': `inline; filename="${file.originalName}"`,
      });

      const fileStream = createReadStream(filePath);
      fileStream.pipe(res);
    } catch (error) {
      this.logger.error(`Error retrieving file: ${error.message}`);

      if (error instanceof NotFoundException) {
        return res.status(404).send({ error: 'File not found' });
      } else {
        return res
          .status(500)
          .send({ error: `Failed to retrieve file: ${error.message}` });
      }
    }
  }

  @Get('info/:filename')
  async getFileInfo(@Param('filename') filename: string) {
    try {
      const file = await this.fileStorageService.getFileByFilename(filename);
      return {
        id: file.id,
        filename: file.filename,
        originalName: file.originalName,
        mimeType: file.mimeType,
        size: file.size,
        createdAt: file.createdAt,
        url: `/files/${file.filename}`,
      };
    } catch (error) {
      this.logger.error(`Error retrieving file info: ${error.message}`);

      if (error instanceof NotFoundException) {
        throw new NotFoundException(`File not found: ${filename}`);
      } else {
        throw new BadRequestException(
          `Error retrieving file info: ${error.message}`,
        );
      }
    }
  }
}
