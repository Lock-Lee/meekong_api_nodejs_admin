#!/usr/bin/env node

/**
 * V2 Media System Test Script
 * 
 * This script validates the v2 media API endpoints and worker functionality.
 * Run: node scripts/test-v2-media.js
 * 
 * Prerequisites:
 * - API server running on http://localhost:3000
 * - Valid auth token in AUTH_TOKEN environment variable
 * - Redis running for workers (if testing background processing)
 */

const http = require('http');
const https = require('https');
const fs = require('fs');

const API_BASE = process.env.API_BASE || 'http://localhost:3000/api/v2';
const AUTH_TOKEN = process.env.AUTH_TOKEN;

if (!AUTH_TOKEN) {
    console.error('❌ AUTH_TOKEN environment variable is required');
    process.exit(1);
}

const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${AUTH_TOKEN}`
};

function makeRequest(method, path, data = null) {
    return new Promise((resolve, reject) => {
        const url = new URL(API_BASE + path);
        const options = {
            method,
            headers: data ? headers : { ...headers, 'Content-Length': '0' }
        };

        const req = (url.protocol === 'https:' ? https : http).request(url, options, (res) => {
            let body = '';
            res.on('data', chunk => body += chunk);
            res.on('end', () => {
                try {
                    const response = body ? JSON.parse(body) : {};
                    resolve({ status: res.statusCode, data: response, headers: res.headers });
                } catch (e) {
                    resolve({ status: res.statusCode, data: body, headers: res.headers });
                }
            });
        });

        req.on('error', reject);

        if (data) {
            req.write(JSON.stringify(data));
        }
        req.end();
    });
}

async function testV2MediaSystem() {
    console.log('🧪 Testing V2 Media System\n');

    try {
        // 1. Test Item Creation (v2)
        console.log('1️⃣ Testing Item Creation (v2)...');
        const itemData = {
            brandId: '01234567-89ab-cdef-0123-456789abcdef', // Use a valid brand ID
            categoryId: '01234567-89ab-cdef-0123-456789abcdef', // Use a valid category ID
            nameTh: 'Test Item V2',
            nameEn: 'Test Item V2',
            descriptionTh: 'Test Description',
            descriptionEn: 'Test Description',
            price: 100,
            type: 'NORMAL',
            sellType: 'SELL',
            itemVariants: [
                { name: 'Color', value: 'Red' },
                { name: 'Size', value: 'M' }
            ]
        };

        const createResponse = await makeRequest('POST', '/items', itemData);

        if (createResponse.status === 201) {
            console.log('✅ Item created successfully');
            const itemId = createResponse.data.data?.id;

            if (itemId) {
                console.log(`📝 Item ID: ${itemId}\n`);

                // 2. Test Media Presign
                console.log('2️⃣ Testing Media Presign...');
                const presignData = {
                    itemId,
                    type: 'IMAGE',
                    contentType: 'image/jpeg',
                    fileName: 'test-image.jpg',
                    size: 1048576 // 1MB
                };

                const presignResponse = await makeRequest('POST', '/media/presign', presignData);

                if (presignResponse.status === 200) {
                    console.log('✅ Presign URL generated successfully');
                    console.log(`🔗 Upload URL: ${presignResponse.data.data?.uploadUrl?.substring(0, 50)}...`);
                    console.log(`🔑 S3 Key: ${presignResponse.data.data?.key}\n`);

                    // 3. Test Media Complete (simulating successful upload)
                    console.log('3️⃣ Testing Media Complete...');
                    const completeData = {
                        itemId,
                        type: 'IMAGE',
                        key: presignResponse.data.data?.key || 'test-key'
                    };

                    const completeResponse = await makeRequest('POST', '/media/complete', completeData);

                    if (completeResponse.status === 201) {
                        console.log('✅ Media upload completed successfully');
                        console.log(`🖼️  Media ID: ${completeResponse.data.data?.id}\n`);

                        // 4. Test Media List
                        console.log('4️⃣ Testing Media List...');
                        const listResponse = await makeRequest('GET', `/media/items/${itemId}`);

                        if (listResponse.status === 200) {
                            console.log('✅ Media list retrieved successfully');
                            console.log(`📊 Media count: ${listResponse.data.data?.length || 0}\n`);
                        } else {
                            console.log(`❌ Media list failed: ${listResponse.status}`);
                        }
                    } else {
                        console.log(`❌ Media complete failed: ${completeResponse.status}`);
                        console.log(completeResponse.data);
                    }
                } else {
                    console.log(`❌ Presign failed: ${presignResponse.status}`);
                    console.log(presignResponse.data);
                }
            }
        } else {
            console.log(`❌ Item creation failed: ${createResponse.status}`);
            console.log(createResponse.data);
        }

        // 5. Test API Health
        console.log('5️⃣ Testing API Health...');
        const healthResponse = await makeRequest('GET', '/items');

        if (healthResponse.status === 200) {
            console.log('✅ V2 Items endpoint is healthy');
        } else {
            console.log(`❌ V2 Items endpoint unhealthy: ${healthResponse.status}`);
        }

    } catch (error) {
        console.error('❌ Test failed with error:', error.message);
    }

    console.log('\n🏁 V2 Media System Test Complete');
}

// Environment validation
console.log('🔧 Environment Check:');
console.log(`API Base: ${API_BASE}`);
console.log(`Auth Token: ${AUTH_TOKEN ? '✅ Set' : '❌ Missing'}`);
console.log(`Redis URL: ${process.env.REDIS_URL || 'Not set (workers may not function)'}`);
console.log(`S3 Bucket: ${process.env.S3_BUCKET || 'Not set (media upload will fail)'}`);
console.log(`AWS Region: ${process.env.AWS_REGION || 'Not set (media upload will fail)'}\n`);

testV2MediaSystem();
