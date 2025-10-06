# V2 Media System Testing Plan

## 🎯 **Test Objectives**
- Verify V2 API endpoints work correctly
- Test direct-to-S3 upload flow
- Validate background worker processing
- Ensure image resizing and video validation
- Test complete item + media workflow

## 🐳 **Docker Test Environment**

### Infrastructure Services
- **Redis**: Job queue for BullMQ workers
- **LocalStack**: S3-compatible storage for media
- **Application**: Your Node.js API (runs locally)
- **Workers**: Background processing (runs locally)

## 📋 **Test Execution Plan**

### Phase 1: Infrastructure Setup
1. Start Docker services
2. Verify service health
3. Configure S3 bucket
4. Test connectivity

### Phase 2: API Testing
1. Test V2 item creation (JSON-only)
2. Test media presign endpoint
3. Test direct S3 upload
4. Test upload completion
5. Test media listing

### Phase 3: Worker Testing
1. Verify image processing jobs
2. Test video validation jobs
3. Check job queue status
4. Validate processed outputs

### Phase 4: Integration Testing
1. Complete end-to-end workflow
2. Test multiple media uploads
3. Verify database records
4. Check S3 storage structure

## 🎯 **Success Criteria**
- All API endpoints return expected responses
- Media files upload successfully to S3
- Background workers process jobs without errors
- Processed images are created (512x512, 1024x1024)
- Database records match uploaded media
- No memory leaks or performance issues
