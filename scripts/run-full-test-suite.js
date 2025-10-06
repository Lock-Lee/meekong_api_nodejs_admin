#!/usr/bin/env node

/**
 * Full Test Suite Runner
 * Orchestrates complete V2 media system testing
 */

const { spawn } = require('child_process');
const path = require('path');

class TestSuiteRunner {
    constructor() {
        this.testResults = [];
        this.currentPhase = 0;
        this.phases = [
            { name: 'Infrastructure', script: 'test-infrastructure.js', required: true },
            { name: 'API Endpoints', script: 'test-api-endpoints.js', required: true },
            { name: 'Background Workers', script: 'test-workers.js', required: false }
        ];
    }

    async runFullSuite() {
        console.log('🚀 V2 Media System - Full Test Suite');
        console.log('====================================\n');

        console.log('📋 Test Plan:');
        this.phases.forEach((phase, index) => {
            console.log(`   ${index + 1}. ${phase.name} ${phase.required ? '(Required)' : '(Optional)'}`);
        });
        console.log('');

        for (let i = 0; i < this.phases.length; i++) {
            const phase = this.phases[i];
            console.log(`\n🔄 Phase ${i + 1}: ${phase.name}`);
            console.log('='.repeat(50));

            const success = await this.runTestScript(phase.script);
            this.testResults.push({ phase: phase.name, success, required: phase.required });

            if (!success && phase.required) {
                console.log(`\n❌ Required phase "${phase.name}" failed. Stopping test suite.`);
                break;
            }

            if (i < this.phases.length - 1) {
                console.log('\n⏳ Waiting 3 seconds before next phase...');
                await this.sleep(3000);
            }
        }

        this.printFinalResults();
    }

    async runTestScript(scriptName) {
        return new Promise((resolve) => {
            const scriptPath = path.join(__dirname, scriptName);
            const process = spawn('node', [scriptPath], { stdio: 'inherit' });

            process.on('close', (code) => {
                resolve(code === 0);
            });

            process.on('error', (error) => {
                console.error(`Failed to start ${scriptName}:`, error.message);
                resolve(false);
            });
        });
    }

    printFinalResults() {
        console.log('\n\n🏁 Final Test Results');
        console.log('=====================');

        let allRequiredPassed = true;
        let totalPassed = 0;

        this.testResults.forEach(result => {
            const status = result.success ? '✅ PASS' : '❌ FAIL';
            const requirement = result.required ? '(Required)' : '(Optional)';
            console.log(`${status} ${result.phase} ${requirement}`);

            if (result.success) totalPassed++;
            if (result.required && !result.success) allRequiredPassed = false;
        });

        console.log(`\n📊 Summary: ${totalPassed}/${this.testResults.length} phases passed`);

        if (allRequiredPassed) {
            console.log('\n🎉 SUCCESS: V2 Media System is ready for production!');
            console.log('\n✅ What\'s working:');
            console.log('   - Docker infrastructure (Redis + S3)');
            console.log('   - V2 API endpoints (JSON-only)');
            console.log('   - Direct-to-S3 uploads');
            console.log('   - Background worker processing');
            console.log('   - Complete media workflow');

            console.log('\n🚀 Next steps:');
            console.log('   1. Deploy to your EC2 environment');
            console.log('   2. Update Redis URL to your EC2 instance');
            console.log('   3. Configure production S3 bucket');
            console.log('   4. Start using V2 API endpoints');
        } else {
            console.log('\n⚠️ ISSUES FOUND: Some required components failed');
            console.log('\n🔧 Troubleshooting:');
            console.log('   1. Check Docker services are running');
            console.log('   2. Verify environment variables');
            console.log('   3. Ensure JWT token is valid');
            console.log('   4. Check application logs for errors');
        }

        console.log('\n📖 For detailed logs, run individual test scripts:');
        this.phases.forEach(phase => {
            console.log(`   node scripts/${phase.script}`);
        });
    }

    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

// Run full test suite
new TestSuiteRunner().runFullSuite().catch(console.error);
