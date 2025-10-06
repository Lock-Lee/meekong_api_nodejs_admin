#!/usr/bin/env node

/**
 * Infrastructure Testing Script
 * Tests Docker services (Redis, LocalStack S3)
 */

const { execSync } = require('child_process');
const axios = require('axios');

class InfrastructureTest {
    constructor() {
        this.results = [];
    }

    async runAllTests() {
        console.log('🧪 Testing Infrastructure Services\n');

        await this.testDockerServices();
        await this.testRedisConnection();
        await this.testLocalStackHealth();
        await this.testS3BucketAccess();

        this.printResults();
    }

    async testDockerServices() {
        console.log('1️⃣ Testing Docker Services...');
        try {
            const result = execSync('wsl --exec bash -c "cd /mnt/c/Pete/meekong_api_nodejs && docker-compose -f docker-compose.local.yml ps --services --filter \\"status=running\\""', { encoding: 'utf8' });
            const runningServices = result.trim().split('\n').filter(s => s);

            const expectedServices = ['redis', 'localstack'];
            const allRunning = expectedServices.every(service => runningServices.includes(service));

            this.addResult('Docker Services', allRunning,
                allRunning ? 'All services running' : `Missing: ${expectedServices.filter(s => !runningServices.includes(s)).join(', ')}`);
        } catch (error) {
            this.addResult('Docker Services', false, error.message);
        }
    }

    async testRedisConnection() {
        console.log('2️⃣ Testing Redis Connection...');
        try {
            const result = execSync('wsl --exec bash -c "docker exec meekong-redis redis-cli ping"', { encoding: 'utf8' });
            const success = result.trim() === 'PONG';
            this.addResult('Redis Connection', success, success ? 'Redis responding' : 'Redis not responding');
        } catch (error) {
            this.addResult('Redis Connection', false, error.message);
        }
    }

    async testLocalStackHealth() {
        console.log('3️⃣ Testing LocalStack Health...');
        try {
            const response = await axios.get('http://localhost:4566/_localstack/health', { timeout: 5000 });
            const s3Running = response.data.services?.s3 === 'running';
            this.addResult('LocalStack Health', s3Running, s3Running ? 'S3 service running' : 'S3 service not ready');
        } catch (error) {
            this.addResult('LocalStack Health', false, error.message);
        }
    }

    async testS3BucketAccess() {
        console.log('4️⃣ Testing S3 Bucket Access...');
        try {
            execSync('wsl --exec bash -c "AWS_ACCESS_KEY_ID=test AWS_SECRET_ACCESS_KEY=test aws --endpoint-url=http://localhost:4566 s3 ls s3://meekong-media-dev"', { stdio: 'ignore' });
            this.addResult('S3 Bucket Access', true, 'Bucket accessible');
        } catch (error) {
            // Try to create bucket if it doesn't exist
            try {
                execSync('wsl --exec bash -c "AWS_ACCESS_KEY_ID=test AWS_SECRET_ACCESS_KEY=test aws --endpoint-url=http://localhost:4566 s3 mb s3://meekong-media-dev"', { stdio: 'ignore' });
                this.addResult('S3 Bucket Access', true, 'Bucket created and accessible');
            } catch (createError) {
                this.addResult('S3 Bucket Access', false, 'Cannot access or create bucket');
            }
        }
    }

    addResult(test, passed, message) {
        this.results.push({ test, passed, message });
        console.log(`   ${passed ? '✅' : '❌'} ${test}: ${message}`);
    }

    printResults() {
        console.log('\n📊 Infrastructure Test Results:');
        console.log('================================');

        const passed = this.results.filter(r => r.passed).length;
        const total = this.results.length;

        this.results.forEach(result => {
            console.log(`${result.passed ? '✅' : '❌'} ${result.test}`);
        });

        console.log(`\n📈 Score: ${passed}/${total} tests passed`);

        if (passed === total) {
            console.log('🎉 All infrastructure tests passed! Ready for API testing.');
        } else {
            console.log('⚠️ Some infrastructure tests failed. Fix issues before proceeding.');
        }
    }
}

// Run tests
new InfrastructureTest().runAllTests().catch(console.error);
