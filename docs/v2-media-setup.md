# V2 Media System Setup Guide

## Required Environment Variables

```bash
# AWS S3 Configuration
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your_access_key
AWS_SECRET_ACCESS_KEY=your_secret_key
S3_BUCKET=your-bucket-name

# Redis Configuration (for BullMQ workers)
REDIS_URL=redis://127.0.0.1:6379

# Worker Configuration
ENABLE_WORKERS=true  # Set to 'true' to enable background processing
```

## Dependencies

The following packages are automatically installed:
- `@aws-sdk/client-s3` - S3 client for uploads
- `@aws-sdk/s3-request-presigner` - Presigned URL generation
- `bullmq` - Background job processing
- `ioredis` - Redis client for BullMQ
- `sharp` - Image processing (1:1 crops)
- `fluent-ffmpeg` & `ffprobe-static` - Video processing

## S3 Bucket Configuration

1. Create an S3 bucket with the following structure:
   ```
   your-bucket/
   ├── items/
   │   ├── {itemId}/
   │   │   ├── images/
   │   │   │   ├── original.jpg
   │   │   │   ├── original_512x512.webp
   │   │   │   └── original_1024x1024.webp
   │   │   └── video/
   │   │       └── video.mp4
   ```

2. Set CORS policy for direct uploads:
   ```json
   [
       {
           "AllowedHeaders": ["*"],
           "AllowedMethods": ["PUT", "POST"],
           "AllowedOrigins": ["http://localhost:3000", "https://yourdomain.com"],
           "ExposeHeaders": ["ETag"]
       }
   ]
   ```

## Redis Setup

For local development:
```bash
# Using Docker
docker run -d -p 6379:6379 redis:alpine

# Or install locally (Windows)
# Download from https://github.com/microsoftarchive/redis/releases
```

## Running the System

### Development Mode
```bash
# Terminal 1: Start API server
npm run dev

# Terminal 2: Start workers (optional)
npm run dev:workers
```

### Production Mode
```bash
# Build first
npm run build

# Terminal 1: Start API server
npm start

# Terminal 2: Start workers (optional)
npm run start:workers
```

### Single Process (API + Workers)
```bash
# Set environment variable
ENABLE_WORKERS=true npm run dev
# or
ENABLE_WORKERS=true npm start
```

## API Flow Validation

1. **Create Item (v2)**:
   ```bash
   POST /api/v2/items
   Content-Type: application/json
   {
     "title": "Test Item",
     "description": "Test",
     "price": 100,
     "categoryId": "cat-id"
   }
   ```

2. **Request Media Presign**:
   ```bash
   POST /api/v2/media/presign
   {
     "itemId": "item-id",
     "type": "IMAGE",
     "contentType": "image/jpeg",
     "fileName": "photo.jpg",
     "size": 1048576
   }
   ```

3. **Upload to S3** (using returned presigned URL)

4. **Complete Upload**:
   ```bash
   POST /api/v2/media/complete
   {
     "itemId": "item-id",
     "type": "IMAGE",
     "key": "items/item-id/images/photo.jpg"
   }
   ```

5. **Check Worker Processing** (if enabled):
   - Image: 1:1 crops created at 512x512 and 1024x1024
   - Video: Duration validation (<60s)

## Monitoring

- Worker logs show processing status
- BullMQ provides job status tracking
- S3 metadata includes processing timestamps

## Constraints

- **Images**: Max 10 per item, 10MB each
- **Videos**: Max 1 per item, 100MB, <60s duration
- **Background Processing**: 1:1 image crops, video validation
- **Supported Formats**: Images (JPEG, PNG, WebP), Videos (MP4, MOV, AVI)
