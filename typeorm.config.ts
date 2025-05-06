import { DataSource, DataSourceOptions } from 'typeorm';
import * as dotenv from 'dotenv';
import { StoredFile } from './src/file-storage/entities/stored-file.entity';

dotenv.config();

export const getDataSourceOptions = (): DataSourceOptions => ({
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432', 10),
  username: process.env.DB_USERNAME || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  database: process.env.DB_DATABASE || 'file_storage',
  entities: [StoredFile],
  migrations: ['dist/migrations/*.js'],
});

const dataSource = new DataSource(getDataSourceOptions());
export default dataSource;
