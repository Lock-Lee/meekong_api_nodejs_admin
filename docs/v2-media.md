## v2 Media Workflow

### Overview
- v2 decouples item creation from media uploads.
- Uploads go directly to S3 via presigned URLs; API orchestrates and persists records using existing `Image` model.

### Endpoints
- POST /api/v2/items (JSON only) – create item
- GET /api/v2/items/:id – item details with media
- POST /api/v2/media/presign – request S3 PUT URL
- POST /api/v2/media/complete – finalize and store media record
- GET /api/v2/media/items/:itemId – list media
- PATCH /api/v2/media/items/:itemId/order – set primary image
- DELETE /api/v2/media/:mediaId – delete media

### Constraints
- Images: ≤ 10 per item; ≤ 10MB each.
- Video: ≤ 1 per item; ≤ 100MB; (future) duration < 60s.
- Ownership: media mutations allowed only by item seller.

### S3 Keys
- Images: items/{itemId}/images/{fileName}
- Video: items/{itemId}/video/{fileName}

### Client Flow
1) Create item via POST /api/v2/items (no media).
2) For each file:
   - POST /api/v2/media/presign { itemId, type, contentType, fileName, size }
   - PUT file bytes to returned uploadUrl
   - POST /api/v2/media/complete { itemId, type, key }

### Security
- Short-lived presigns (10 minutes).
- Validate content type and size server-side.
- Ensure user owns the item.

### Future Enhancements
- Background processor for image square crops and video duration validation.
- CloudFront for delivery.

### Workers
- Enable with env: `ENABLE_WORKERS=true` and `REDIS_URL=redis://127.0.0.1:6379`.
- Dev run: `npm run dev:workers`
- Prod run: `npm run start:workers` (after build).
- Queues:
  - `image-process`: create 1:1 derived images (512/1024 webp)
  - `video-validate`: validate duration < 60s, (optional) poster

### Setup Guide
See [v2-media-setup.md](./v2-media-setup.md) for complete setup instructions including:
- Environment variables
- S3 bucket configuration
- Redis setup
- API flow validation
- Monitoring and constraints


