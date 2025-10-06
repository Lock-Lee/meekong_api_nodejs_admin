#!/usr/bin/env node

/**
 * API Endpoints Testing Script
 * Tests V2 API endpoints systematically
 */

const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');

class APITest {
    constructor() {
        this.baseURL = 'http://localhost:3000';
        this.results = [];
        this.testData = {
            itemId: null,
            mediaId: null,
            uploadKey: null,
            uploadUrl: null
        };

        // You'll need to set this with a valid JWT token
        this.authToken = process.env.TEST_JWT_TOKEN || 'your-jwt-token-here';
    }

    async runAllTests() {
        console.log('🧪 Testing V2 API Endpoints\n');

        if (this.authToken === 'your-jwt-token-here') {
            console.log('⚠️ Please set TEST_JWT_TOKEN environment variable with a valid JWT token');
            console.log('   Example: TEST_JWT_TOKEN=eyJ... node scripts/test-api-endpoints.js');
            return;
        }

        await this.testApplicationHealth();
        await this.testV2ItemCreation();
        await this.testMediaPresignEndpoint();
        await this.testS3DirectUpload();
        await this.testUploadCompletion();
        await this.testMediaListing();

        this.printResults();
    }

    async testApplicationHealth() {
        console.log('1️⃣ Testing Application Health...');
        try {
            const response = await axios.get(`${this.baseURL}/health`, { timeout: 5000 });
            this.addResult('Application Health', response.status === 200, `Status: ${response.status}`);
        } catch (error) {
            this.addResult('Application Health', false, 'Application not responding');
        }
    }

    async testV2ItemCreation() {
        console.log('2️⃣ Testing V2 Item Creation...');
        try {
            const itemData = {
                nameTh: 'ทดสอบ',
                nameEn: 'Test',
                descriptionTh: 'ทดสอบ',
                descriptionEn: 'Test',
                categoryId: '11caecea-a7cb-4983-bc1e-3c50486b3587',
                brandId: '00497854-f90d-4372-956b-894326bc08a4',
                itemType: 'NEW',
                sellType: 'NORMAL',
                itemVariants: [
                    {
                        price: 100,
                        stockQuantity: 10
                    }
                ]
            };

            const response = await axios.post(`${this.baseURL}/api/v2/items`, itemData, {
                headers: {
                    'Authorization': `Bearer ${this.authToken}`,
                    'Content-Type': 'application/json'
                }
            });

            if ((response.status === 200 || response.status === 201) && response.data.data?.id) {
                this.testData.itemId = response.data.data.id;
                this.addResult('V2 Item Creation', true, `Item created: ${this.testData.itemId}`);
            } else {
                this.addResult('V2 Item Creation', false, `Invalid response: Status=${response.status}, HasId=${!!response.data.data?.id}`);
            }
        } catch (error) {
            this.addResult('V2 Item Creation', false, error.response?.data?.message || error.message);
        }
    }

    async testMediaPresignEndpoint() {
        console.log('3️⃣ Testing Media Presign Endpoint...');
        if (!this.testData.itemId) {
            this.addResult('Media Presign', false, 'No item ID available');
            return;
        }

        try {
            const presignData = {
                itemId: this.testData.itemId,
                type: 'IMAGE',
                contentType: 'image/jpeg',
                fileName: 'test-image.jpg',
                size: 1024
            };

            const response = await axios.post(`${this.baseURL}/api/v2/media/presign`, presignData, {
                headers: {
                    'Authorization': `Bearer ${this.authToken}`,
                    'Content-Type': 'application/json'
                }
            });

            if (response.status === 200 && response.data.data?.uploadUrl && response.data.data?.key) {
                this.testData.uploadUrl = response.data.data.uploadUrl;
                this.testData.uploadKey = response.data.data.key;
                this.addResult('Media Presign', true, 'Presigned URL generated');
            } else {
                this.addResult('Media Presign', false, 'Invalid presign response');
            }
        } catch (error) {
            this.addResult('Media Presign', false, error.response?.data?.message || error.message);
        }
    }

    async testS3DirectUpload() {
        console.log('4️⃣ Testing S3 Direct Upload...');
        if (!this.testData.uploadUrl) {
            this.addResult('S3 Direct Upload', false, 'No upload URL available');
            return;
        }

        try {
            // Create a simple test image (1x1 pixel JPEG)
            const testImageBuffer = Buffer.from([
                0xFF, 0xD8, 0xFF, 0xE0, 0x00, 0x10, 0x4A, 0x46, 0x49, 0x46, 0x00, 0x01,
                0x01, 0x01, 0x00, 0x48, 0x00, 0x48, 0x00, 0x00, 0xFF, 0xD9
            ]);

            const response = await axios.put(this.testData.uploadUrl, testImageBuffer, {
                headers: { 'Content-Type': 'image/jpeg' },
                timeout: 10000
            });

            this.addResult('S3 Direct Upload', response.status === 200, `Upload status: ${response.status}`);
        } catch (error) {
            this.addResult('S3 Direct Upload', false, error.message);
        }
    }

    async testUploadCompletion() {
        console.log('5️⃣ Testing Upload Completion...');
        if (!this.testData.uploadKey || !this.testData.itemId) {
            this.addResult('Upload Completion', false, 'Missing upload key or item ID');
            return;
        }

        try {
            const completeData = {
                itemId: this.testData.itemId,
                type: 'IMAGE',
                key: this.testData.uploadKey
            };

            const response = await axios.post(`${this.baseURL}/api/v2/media/complete`, completeData, {
                headers: {
                    'Authorization': `Bearer ${this.authToken}`,
                    'Content-Type': 'application/json'
                }
            });

            if (response.status === 200 && response.data.data?.id) {
                this.testData.mediaId = response.data.data.id;
                this.addResult('Upload Completion', true, `Media record created: ${this.testData.mediaId}`);
            } else {
                this.addResult('Upload Completion', false, 'Invalid completion response');
            }
        } catch (error) {
            this.addResult('Upload Completion', false, error.response?.data?.message || error.message);
        }
    }

    async testMediaListing() {
        console.log('6️⃣ Testing Media Listing...');
        if (!this.testData.itemId) {
            this.addResult('Media Listing', false, 'No item ID available');
            return;
        }

        try {
            const response = await axios.get(`${this.baseURL}/api/v2/media/items/${this.testData.itemId}`, {
                headers: { 'Authorization': `Bearer ${this.authToken}` }
            });

            const mediaCount = response.data.data?.length || 0;
            this.addResult('Media Listing', response.status === 200, `Found ${mediaCount} media files`);
        } catch (error) {
            this.addResult('Media Listing', false, error.response?.data?.message || error.message);
        }
    }

    addResult(test, passed, message) {
        this.results.push({ test, passed, message });
        console.log(`   ${passed ? '✅' : '❌'} ${test}: ${message}`);
    }

    printResults() {
        console.log('\n📊 API Test Results:');
        console.log('====================');

        const passed = this.results.filter(r => r.passed).length;
        const total = this.results.length;

        this.results.forEach(result => {
            console.log(`${result.passed ? '✅' : '❌'} ${result.test}`);
        });

        console.log(`\n📈 Score: ${passed}/${total} tests passed`);

        if (passed === total) {
            console.log('🎉 All API tests passed! Ready for worker testing.');
            console.log('\n📋 Test Data Generated:');
            console.log(`   Item ID: ${this.testData.itemId}`);
            console.log(`   Media ID: ${this.testData.mediaId}`);
        } else {
            console.log('⚠️ Some API tests failed. Check application logs.');
        }
    }
}

// Run tests
new APITest().runAllTests().catch(console.error);
