// Custom Jest matchers will be added in individual test files
// This setup file is for global configuration only

// Global test configuration
// jest.setTimeout(30000); // This is handled in jest.config.js

// Mock environment variables for testing
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-jwt-secret-key-for-testing-only';
process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/meekong_test';
process.env.REDIS_URL = 'redis://localhost:6379/1';
process.env.S3_BUCKET = 'meekong-media-test';
process.env.AWS_REGION = 'us-east-1';
process.env.AWS_ACCESS_KEY_ID = 'test';
process.env.AWS_SECRET_ACCESS_KEY = 'test';
process.env.S3_ENDPOINT = 'http://localhost:4566';

// Global console log suppression can be handled in individual test files
// Test files can use beforeEach/afterEach directly for setup/teardown

// TypeScript declarations are in jest.d.ts
