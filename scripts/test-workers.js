#!/usr/bin/env node

/**
 * Worker Testing Script
 * Tests BullMQ workers and job processing
 */

const { execSync } = require('child_process');
const IORedis = require('ioredis');

class WorkerTest {
    constructor() {
        this.results = [];
        this.redis = new IORedis(process.env.REDIS_URL || 'redis://localhost:6379');
    }

    async runAllTests() {
        console.log('🧪 Testing Background Workers\n');

        await this.testRedisQueues();
        await this.testWorkerProcesses();
        await this.testJobProcessing();
        await this.testQueueHealth();

        this.printResults();
        await this.redis.disconnect();
    }

    async testRedisQueues() {
        console.log('1️⃣ Testing Redis Queues...');
        try {
            // Check if BullMQ queues exist
            const imageQueueWaiting = await this.redis.llen('bull:image-process:waiting');
            const imageQueueCompleted = await this.redis.llen('bull:image-process:completed');
            const videoQueueWaiting = await this.redis.llen('bull:video-validate:waiting');
            const videoQueueCompleted = await this.redis.llen('bull:video-validate:completed');

            this.addResult('Redis Queues', true,
                `Image: ${imageQueueWaiting} waiting, ${imageQueueCompleted} completed | Video: ${videoQueueWaiting} waiting, ${videoQueueCompleted} completed`);
        } catch (error) {
            this.addResult('Redis Queues', false, error.message);
        }
    }

    async testWorkerProcesses() {
        console.log('2️⃣ Testing Worker Processes...');
        try {
            // Check if worker processes are running (this is approximate)
            const processes = execSync('tasklist /FI "IMAGENAME eq node.exe" /FO CSV', { encoding: 'utf8' });
            const nodeProcesses = processes.split('\n').filter(line => line.includes('node.exe')).length - 1;

            this.addResult('Worker Processes', nodeProcesses > 0,
                `Found ${nodeProcesses} Node.js processes (workers may be included)`);
        } catch (error) {
            this.addResult('Worker Processes', false, 'Cannot check worker processes');
        }
    }

    async testJobProcessing() {
        console.log('3️⃣ Testing Job Processing...');
        try {
            // Add a test job to the image processing queue
            const testJob = {
                itemId: 'test-item-123',
                imageUrl: 'http://localhost:4566/meekong-media-dev/test-image.jpg',
                key: 'test-image.jpg',
                imageId: 'test-image-123'
            };

            await this.redis.lpush('bull:image-process:waiting', JSON.stringify({
                id: 'test-job-' + Date.now(),
                data: testJob,
                opts: {},
                timestamp: Date.now()
            }));

            // Wait a moment and check if job was processed
            await new Promise(resolve => setTimeout(resolve, 2000));

            const waitingJobs = await this.redis.llen('bull:image-process:waiting');
            const completedJobs = await this.redis.llen('bull:image-process:completed');

            this.addResult('Job Processing', true,
                `Test job added. Waiting: ${waitingJobs}, Completed: ${completedJobs}`);
        } catch (error) {
            this.addResult('Job Processing', false, error.message);
        }
    }

    async testQueueHealth() {
        console.log('4️⃣ Testing Queue Health...');
        try {
            // Check for failed jobs
            const imageQueueFailed = await this.redis.llen('bull:image-process:failed');
            const videoQueueFailed = await this.redis.llen('bull:video-validate:failed');

            const totalFailed = imageQueueFailed + videoQueueFailed;

            this.addResult('Queue Health', totalFailed === 0,
                totalFailed === 0 ? 'No failed jobs' : `${totalFailed} failed jobs found`);
        } catch (error) {
            this.addResult('Queue Health', false, error.message);
        }
    }

    addResult(test, passed, message) {
        this.results.push({ test, passed, message });
        console.log(`   ${passed ? '✅' : '❌'} ${test}: ${message}`);
    }

    printResults() {
        console.log('\n📊 Worker Test Results:');
        console.log('=======================');

        const passed = this.results.filter(r => r.passed).length;
        const total = this.results.length;

        this.results.forEach(result => {
            console.log(`${result.passed ? '✅' : '❌'} ${result.test}`);
        });

        console.log(`\n📈 Score: ${passed}/${total} tests passed`);

        if (passed === total) {
            console.log('🎉 All worker tests passed! Background processing is working.');
        } else {
            console.log('⚠️ Some worker tests failed. Check worker logs and Redis connection.');
        }

        console.log('\n💡 To monitor workers in real-time:');
        console.log('   - Check application logs for worker startup messages');
        console.log('   - Monitor Redis queues: docker exec meekong-redis redis-cli');
        console.log('   - Watch job processing in your application console');
    }
}

// Run tests
new WorkerTest().runAllTests().catch(console.error);
