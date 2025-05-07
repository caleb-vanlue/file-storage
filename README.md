# File Storage API

A robust NestJS-based file storage service for managing file uploads, retrieval, and metadata management.

## Features

- **File Upload**: Securely upload files with metadata support
- **File Retrieval**: Fetch files by ID or filename
- **Metadata Management**: Store and retrieve file metadata
- **Reference Support**: Associate files with other entities via reference types and IDs
- **Access Control**: Support for public and private file visibility
- **Swagger API Documentation**: Interactive API documentation

## Prerequisites

- Node.js (v16+)
- PostgreSQL
- TypeScript

## Environment Variables

Create a `.env` file in the root directory with the following variables:

```
# Application
PORT=3000

# Database
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=postgres
DB_DATABASE=file_storage

# File Storage
FILE_STORAGE_PATH=./storage
```

## Installation

```bash
# Install dependencies
npm install

# Build the application
npm run build

# Run database migrations
npm run migration:run
```

## Running the Application

```bash
# Development mode
npm run start:dev

# Production mode
npm run start:prod
```

## API Endpoints

| Method | Endpoint                | Description                   |
| ------ | ----------------------- | ----------------------------- |
| POST   | `/files/upload`         | Upload a new file             |
| GET    | `/files/id/:id`         | Get file by ID                |
| GET    | `/files/:filename`      | Get file by filename          |
| GET    | `/files/info/id/:id`    | Get file metadata by ID       |
| GET    | `/files/info/:filename` | Get file metadata by filename |
| DELETE | `/files/:id`            | Delete a file                 |

## API Documentation

Once the application is running, visit `http://localhost:3000/api` to access the Swagger documentation.

## File Upload Example

```bash
# Using curl
curl -X POST http://localhost:3000/files/upload \
  -F "file=@/path/to/file.jpg" \
  -F "referenceType=product" \
  -F "referenceId=123" \
  -F "isPublic=true"
```

## Response Example

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "filename": "550e8400-e29b-41d4-a716-446655440000.jpg",
  "originalName": "image.jpg",
  "mimeType": "image/jpeg",
  "size": 24680,
  "url": "/files/550e8400-e29b-41d4-a716-446655440000"
}
```

## Project Structure

- `src/` - Source code
  - `file-storage/` - File storage module
    - `entities/` - Database entities
    - `file-storage.controller.ts` - API endpoints
    - `file-storage.service.ts` - Business logic
  - `main.ts` - Application entry point
  - `app.module.ts` - Main application module

## Testing

```bash
# Unit tests
npm run test
```
