import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { FileStorageModule } from './file-storage/file-storage.module';
import { getDataSourceOptions } from 'typeorm.config';
import { StoredFile } from './file-storage/entities/stored-file.entity';
import { FileStorageController } from './file-storage/file-storage.controller';

@Module({
  imports: [
    ConfigModule.forRoot(),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: () => getDataSourceOptions(),
    }),
    TypeOrmModule.forFeature([StoredFile]),
    FileStorageModule,
  ],
  controllers: [FileStorageController],
})
export class AppModule {}
