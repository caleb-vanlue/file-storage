# File Storage API

A robust NestJS-based file storage service for managing file uploads, retrieval, and metadata management.

## Features

- **File Upload**: Securely upload files with metadata support
- **File Retrieval**: Fetch files by ID or filename
- **Metadata Management**: Store and retrieve file metadata
- **Reference Support**: Associate files with other entities via reference types and IDs
- **Plex Integration**: Smart thumbnail management for Plex media items
- **Parent-Level Sharing**: Efficient storage with parent-level thumbnail sharing (album/show)
- **Access Control**: Support for public and private file visibility
- **Swagger API Documentation**: Interactive API documentation

## Prerequisites

- Node.js (v16+)
- PostgreSQL and a newly created database matching the name specified in the .env
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

### Core File Storage Endpoints

| Method | Endpoint                | Description                   |
| ------ | ----------------------- | ----------------------------- |
| POST   | `/files/upload`         | Upload a new file             |
| GET    | `/files/id/:id`         | Get file by ID                |
| GET    | `/files/:filename`      | Get file by filename          |
| GET    | `/files/info/id/:id`    | Get file metadata by ID       |
| GET    | `/files/info/:filename` | Get file metadata by filename |
| DELETE | `/files/:id`            | Delete a file                 |

### Plex Integration Endpoints

| Method | Endpoint                | Description                               |
| ------ | ----------------------- | ----------------------------------------- |
| GET    | `/files/plex/thumbnail` | Find Plex thumbnails by media identifiers |

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

## Plex Thumbnail Upload Example

```bash
# Using curl
curl -X POST http://localhost:3000/files/upload \
  -F "file=@/path/to/thumbnail.jpg" \
  -F "referenceType=plex-show" \
  -F "referenceId=12345" \
  -F "isPublic=true" \
  -F "plexMediaType=episode" \
  -F "plexRatingKey=67890" \
  -F "plexParentRatingKey=54321" \
  -F "plexGrandparentRatingKey=12345" \
  -F "plexTitle=My Show"
```

## Finding Plex Thumbnails Example

```bash
# Get thumbnail for a show by grandparent rating key
curl -X GET "http://localhost:3000/files/plex/thumbnail?mediaType=episode&grandparentRatingKey=12345"

# Get thumbnail for an album by parent rating key
curl -X GET "http://localhost:3000/files/plex/thumbnail?mediaType=track&parentRatingKey=67890"

# Get thumbnail for a movie by rating key
curl -X GET "http://localhost:3000/files/plex/thumbnail?mediaType=movie&ratingKey=54321"
```

## Response Example

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "filename": "550e8400-e29b-41d4-a716-446655440000.jpg",
  "originalName": "image.jpg",
  "mimeType": "image/jpeg",
  "size": 24680,
  "url": "/files/id/550e8400-e29b-41d4-a716-446655440000",
  "plexMediaType": "episode",
  "plexTitle": "My Show"
}
```

## Parent-Level Thumbnail Sharing

The API intelligently manages thumbnails at the parent level to avoid duplicates:

- **Movies**: Individual thumbnails for each movie
- **TV Shows**: One thumbnail shared by all episodes in the same show
- **Music**: One thumbnail shared by all tracks in the same album

This approach significantly reduces storage requirements and ensures consistent thumbnails.

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
