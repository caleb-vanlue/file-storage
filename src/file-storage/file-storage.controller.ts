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
import { ApiParam, ApiQuery, ApiTags } from '@nestjs/swagger';

@ApiTags('files')
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
    @Body('plexMediaType') plexMediaType?: string,
    @Body('plexRatingKey') plexRatingKey?: string,
    @Body('plexParentRatingKey') plexParentRatingKey?: string,
    @Body('plexGrandparentRatingKey') plexGrandparentRatingKey?: string,
    @Body('plexTitle') plexTitle?: string,
  ) {
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }

    try {
      const storedFile = await this.fileStorageService.storeFile(file, {
        isPublic: isPublic === 'true',
        referenceType,
        referenceId,
        plexMediaType,
        plexRatingKey,
        plexParentRatingKey,
        plexGrandparentRatingKey,
        plexTitle,
      });

      return {
        id: storedFile.id,
        filename: storedFile.filename,
        originalName: storedFile.originalName,
        mimeType: storedFile.mimeType,
        size: storedFile.size,
        url: `/files/id/${storedFile.id}`,
      };
    } catch (error) {
      this.logger.error(`Error uploading file: ${error.message}`);
      throw new BadRequestException(`Error uploading file: ${error.message}`);
    }
  }

  @ApiQuery({
    name: 'mediaType',
    required: true,
    description: 'Type of Plex media (e.g., "movie", "episode", "track")',
    type: String,
  })
  @ApiQuery({
    name: 'ratingKey',
    required: false,
    description: 'Plex rating key for the media',
    type: String,
  })
  @ApiQuery({
    name: 'parentRatingKey',
    required: false,
    description: 'Plex parent rating key for the media',
    type: String,
  })
  @ApiQuery({
    name: 'grandparentRatingKey',
    required: false,
    description: 'Plex grandparent rating key for the media',
    type: String,
  })
  @Get('plex/thumbnail')
  async getPlexThumbnail(
    @Query('mediaType') mediaType: string,
    @Query('ratingKey') ratingKey?: string,
    @Query('parentRatingKey') parentRatingKey?: string,
    @Query('grandparentRatingKey') grandparentRatingKey?: string,
  ) {
    try {
      if (!ratingKey && !parentRatingKey && !grandparentRatingKey) {
        throw new BadRequestException('At least one rating key is required');
      }

      const thumbnail = await this.fileStorageService.findPlexThumbnail({
        plexMediaType: mediaType,
        plexRatingKey: ratingKey,
        plexParentRatingKey: parentRatingKey,
        plexGrandparentRatingKey: grandparentRatingKey,
      });

      if (!thumbnail) {
        throw new NotFoundException('No matching thumbnail found');
      }

      return {
        id: thumbnail.id,
        filename: thumbnail.filename,
        originalName: thumbnail.originalName,
        mimeType: thumbnail.mimeType,
        size: thumbnail.size,
        url: `/files/id/${thumbnail.id}`,
        plexMediaType: thumbnail.plexMediaType,
        plexTitle: thumbnail.plexTitle,
      };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      this.logger.error(`Error finding Plex thumbnail: ${error.message}`);
      throw new BadRequestException(
        `Error finding thumbnail: ${error.message}`,
      );
    }
  }

  @ApiParam({
    name: 'id',
    required: true,
    description: 'ID of the file to retrieve',
    type: String,
  })
  @Get('id/:id')
  async getFileById(@Param('id') id: string, @Res() res: Response) {
    try {
      const file = await this.fileStorageService.getFileById(id);
      const filePath = this.fileStorageService.getFilePath(file);

      if (!existsSync(filePath)) {
        throw new NotFoundException(`File not found on disk: ${id}`);
      }

      res.set({
        'Content-Type': file.mimeType,
        'Content-Disposition': `inline; filename="${file.originalName}"`,
      });

      const fileStream = createReadStream(filePath);
      fileStream.pipe(res);
    } catch (error) {
      this.logger.error(`Error retrieving file by ID: ${error.message}`);

      if (error instanceof NotFoundException) {
        return res.status(404).send({ error: 'File not found' });
      } else {
        return res
          .status(500)
          .send({ error: `Failed to retrieve file: ${error.message}` });
      }
    }
  }

  @ApiParam({
    name: 'filename',
    required: true,
    description: 'Filename of the file to retrieve',
    type: String,
  })
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

  @ApiParam({
    name: 'id',
    required: true,
    description: 'ID of the file to retrieve info for',
    type: String,
  })
  @Get('info/id/:id')
  async getFileInfoById(@Param('id') id: string) {
    try {
      const file = await this.fileStorageService.getFileById(id);
      return {
        id: file.id,
        filename: file.filename,
        originalName: file.originalName,
        mimeType: file.mimeType,
        size: file.size,
        createdAt: file.createdAt,
        url: `/files/id/${file.id}`,
      };
    } catch (error) {
      this.logger.error(`Error retrieving file info by ID: ${error.message}`);

      if (error instanceof NotFoundException) {
        throw new NotFoundException(`File not found: ${id}`);
      } else {
        throw new BadRequestException(
          `Error retrieving file info: ${error.message}`,
        );
      }
    }
  }

  @ApiParam({
    name: 'filename',
    required: true,
    description: 'Filename of the file to retrieve info for',
    type: String,
  })
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
        url: `/files/id/${file.id}`,
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

  @ApiParam({
    name: 'id',
    required: true,
    description: 'ID of the file to delete',
    type: String,
  })
  @Delete(':id')
  async deleteFile(@Param('id') id: string) {
    try {
      await this.fileStorageService.deleteFile(id);
      return { success: true, message: 'File deleted successfully' };
    } catch (error) {
      this.logger.error(`Error deleting file: ${error.message}`);

      if (error instanceof NotFoundException) {
        throw new NotFoundException(`File not found: ${id}`);
      } else {
        throw new BadRequestException(`Error deleting file: ${error.message}`);
      }
    }
  }
}
