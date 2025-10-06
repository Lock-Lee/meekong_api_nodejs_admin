import { execSync } from 'child_process';

export default async function globalSetup(): Promise<void> {
    console.log('🚀 Setting up test environment...');

    try {
        // Start Docker services for testing
        console.log('📦 Starting Docker services...');
        execSync('docker-compose up -d redis localstack', {
            stdio: 'inherit',
            cwd: process.cwd()
        });

        // Wait for services to be ready
        console.log('⏳ Waiting for services to be ready...');
        await new Promise(resolve => setTimeout(resolve, 5000));

        // Setup test database
        console.log('🗄️ Setting up test database...');
        execSync('npx prisma migrate reset --force --skip-seed', {
            stdio: 'inherit',
            env: {
                ...process.env,
                DATABASE_URL: 'postgresql://test:test@localhost:5432/meekong_test'
            }
        });

        // Run minimal seed data for tests
        execSync('npx prisma db seed', {
            stdio: 'inherit',
            env: {
                ...process.env,
                DATABASE_URL: 'postgresql://test:test@localhost:5432/meekong_test'
            }
        });

        console.log('✅ Test environment ready!');

    } catch (error) {
        console.error('❌ Failed to setup test environment:', error);
        process.exit(1);
    }
}
