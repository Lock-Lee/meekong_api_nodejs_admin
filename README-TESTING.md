# 🧪 V2 Media System Testing Guide

## 🎯 Overview

Complete structured testing solution for the V2 Media System with Docker infrastructure.

## 🚀 Quick Start

### 1. Setup Docker Infrastructure
```bash
# Start Redis + LocalStack S3
docker-compose -f docker-compose.local.yml up -d

# Verify services are running
docker-compose -f docker-compose.local.yml ps
```

### 2. Configure Environment
```bash
# Add to your .env file:
REDIS_URL=redis://localhost:6379
AWS_ACCESS_KEY_ID=test
AWS_SECRET_ACCESS_KEY=test
S3_BUCKET=meekong-media-dev
S3_ENDPOINT=http://localhost:4566
S3_FORCE_PATH_STYLE=true
ENABLE_WORKERS=true
```

### 3. Start Your Application
```bash
# Terminal 1: Start API
npm run dev

# Terminal 2: Start Workers
npm run dev:workers
```

### 4. Run Tests
```bash
# Run complete test suite
npm run test:full

# Or run individual test phases:
npm run test:infrastructure  # Test Docker services
npm run test:api            # Test V2 API endpoints
npm run test:workers        # Test background workers
```

## 📋 Test Structure

### Phase 1: Infrastructure Testing
- ✅ Docker services running
- ✅ Redis connection
- ✅ LocalStack S3 health
- ✅ S3 bucket access

### Phase 2: API Testing
- ✅ Application health
- ✅ V2 item creation (JSON)
- ✅ Media presign endpoint
- ✅ Direct S3 upload
- ✅ Upload completion
- ✅ Media listing

### Phase 3: Worker Testing
- ✅ Redis queue status
- ✅ Worker processes
- ✅ Job processing
- ✅ Queue health

## 🔧 Configuration

### JWT Token for API Testing
```bash
# Set JWT token for API tests
export TEST_JWT_TOKEN=your-jwt-token-here
npm run test:api
```

### Database IDs for Testing
Update `scripts/test-api-endpoints.js` with real IDs:
```javascript
categoryId: 'your-real-category-id'
brandId: 'your-real-brand-id'
```

## 📊 Expected Results

### ✅ Success Output
```
🎉 SUCCESS: V2 Media System is ready for production!

✅ What's working:
   - Docker infrastructure (Redis + S3)
   - V2 API endpoints (JSON-only)
   - Direct-to-S3 uploads
   - Background worker processing
   - Complete media workflow
```

### ❌ Failure Scenarios
- **Docker services not running**: Run `docker-compose -f docker-compose.local.yml up -d`
- **Application not responding**: Check `npm run dev` is running
- **JWT token invalid**: Set valid `TEST_JWT_TOKEN` environment variable
- **Database IDs invalid**: Update category/brand IDs in test script

## 🔍 Monitoring

### Docker Services
```bash
# Check service status
docker-compose -f docker-compose.local.yml ps

# View logs
docker-compose -f docker-compose.local.yml logs redis
docker-compose -f docker-compose.local.yml logs localstack
```

### Redis Queues
```bash
# Connect to Redis
docker exec -it meekong-redis redis-cli

# Check queue lengths
LLEN bull:image-process:waiting
LLEN bull:image-process:completed
LLEN bull:video-validate:waiting
LLEN bull:video-validate:completed
```

### S3 Storage
```bash
# List buckets
aws --endpoint-url=http://localhost:4566 s3 ls

# List bucket contents
aws --endpoint-url=http://localhost:4566 s3 ls s3://meekong-media-dev
```

## 🚀 Production Deployment

After all tests pass:

1. **Update Redis URL** to your EC2 instance
2. **Configure real S3 bucket** (remove LocalStack settings)
3. **Deploy workers** to separate instances if needed
4. **Monitor production** queues and processing

## 🆘 Troubleshooting

### Common Issues
- **Port conflicts**: Change ports in `docker-compose.local.yml`
- **Memory issues**: Increase Docker memory allocation
- **Network issues**: Check Windows firewall/antivirus
- **Permission issues**: Run as administrator if needed

### Debug Commands
```bash
# Restart everything
docker-compose -f docker-compose.local.yml restart

# Clean slate
docker-compose -f docker-compose.local.yml down -v
docker-compose -f docker-compose.local.yml up -d

# Check Docker logs
docker-compose -f docker-compose.local.yml logs -f
```

## 📈 Performance Testing

For load testing, use the individual test scripts in loops:
```bash
# Test API performance
for i in {1..10}; do npm run test:api; done

# Monitor worker performance
npm run test:workers
```

This testing framework ensures your V2 Media System is production-ready! 🎉
