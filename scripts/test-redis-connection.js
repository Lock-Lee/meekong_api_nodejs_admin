#!/usr/bin/env node

/**
 * Redis Connection Test Script for EC2
 * Tests Redis connectivity and basic operations
 */

const IORedis = require('ioredis');
require('dotenv').config();

async function testRedisConnection() {
    console.log('🔴 Testing Redis Connection...\n');

    const redisUrl = process.env.REDIS_URL || 'redis://127.0.0.1:6379';
    console.log(`📍 Connecting to: ${redisUrl.replace(/:([^:@]*@)/, ':***@')}`);

    const redis = new IORedis(redisUrl, {
        retryDelayOnFailover: 100,
        enableReadyCheck: false,
        maxRetriesPerRequest: 3,
        connectTimeout: 10000,
        commandTimeout: 5000,
        lazyConnect: true,
    });

    try {
        // Test connection
        console.log('⏳ Connecting...');
        await redis.connect();
        console.log('✅ Connected successfully!');

        // Test basic operations
        console.log('\n📝 Testing basic operations...');

        // SET operation
        await redis.set('test:connection', 'success', 'EX', 60);
        console.log('✅ SET operation successful');

        // GET operation
        const value = await redis.get('test:connection');
        console.log(`✅ GET operation successful: ${value}`);

        // Test BullMQ queue operations
        console.log('\n🔄 Testing BullMQ operations...');

        // Test queue creation (this is what BullMQ does)
        await redis.lpush('bull:test-queue:waiting', JSON.stringify({
            id: 'test-job-1',
            data: { message: 'test' },
            timestamp: Date.now()
        }));
        console.log('✅ Queue push operation successful');

        // Test queue read
        const job = await redis.rpop('bull:test-queue:waiting');
        console.log(`✅ Queue pop operation successful: ${job ? 'Job retrieved' : 'No job'}`);

        // Test Redis info
        const info = await redis.info('server');
        const version = info.match(/redis_version:([^\r\n]+)/)?.[1];
        console.log(`✅ Redis version: ${version}`);

        // Cleanup
        await redis.del('test:connection');
        console.log('\n🧹 Cleanup completed');

        console.log('\n🎉 All Redis tests passed! Your EC2 Redis is ready for BullMQ.');

    } catch (error) {
        console.error('\n❌ Redis connection failed:');
        console.error(`   Error: ${error.message}`);

        if (error.code === 'ECONNREFUSED') {
            console.error('\n💡 Troubleshooting tips:');
            console.error('   1. Check if Redis is running on EC2');
            console.error('   2. Verify security group allows port 6379');
            console.error('   3. Check Redis bind configuration');
            console.error('   4. Verify REDIS_URL in .env file');
        }

        if (error.message.includes('NOAUTH')) {
            console.error('\n💡 Authentication required:');
            console.error('   Add password to REDIS_URL: redis://:password@host:port');
        }

        process.exit(1);
    } finally {
        await redis.disconnect();
        console.log('🔌 Disconnected from Redis');
    }
}

// Run the test
testRedisConnection().catch(console.error);
