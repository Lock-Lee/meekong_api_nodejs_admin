import { execSync } from 'child_process';

export default async function globalTeardown(): Promise<void> {
    console.log('🧹 Cleaning up test environment...');

    try {
        // Clean up test database
        console.log('🗄️ Cleaning test database...');
        execSync('npx prisma migrate reset --force --skip-seed', {
            stdio: 'inherit',
            env: {
                ...process.env,
                DATABASE_URL: 'postgresql://test:test@localhost:5432/meekong_test'
            }
        });

        // Keep Docker services running for next test run
        console.log('✅ Test cleanup complete!');

    } catch (error) {
        console.error('❌ Error during cleanup:', error);
    }
}
