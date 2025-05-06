import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FileStorageService } from './file-storage.service';
import { StoredFile } from './entities/stored-file.entity';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [TypeOrmModule.forFeature([StoredFile]), ConfigModule],
  providers: [FileStorageService],
  exports: [FileStorageService],
})
export class FileStorageModule {}
