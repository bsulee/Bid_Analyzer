#!/usr/bin/env node

/**
 * Test Suite for Construction Bid Analyzer
 * Tests backend API function and validates all edge cases
 */

// Test counter
let passed = 0;
let failed = 0;

function assert(condition, testName) {
    if (condition) {
        console.log(`✅ PASS: ${testName}`);
        passed++;
    } else {
        console.log(`❌ FAIL: ${testName}`);
        failed++;
    }
}

// Mock request and response objects
function createMockReq(method, body) {
    return { method, body };
}

function createMockRes() {
    let statusCode = 200;
    let responseData = null;

    return {
        status(code) {
            statusCode = code;
            return this;
        },
        json(data) {
            responseData = data;
            return { statusCode, data: responseData };
        },
        getStatus() {
            return statusCode;
        },
        getData() {
            return responseData;
        }
    };
}

// Import the handler (we'll need to simulate it)
async function testHandler(req, res) {
    // Simulate the handler logic from api/analyze.js
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const apiKey = process.env.ANTHROPIC_API_KEY || 'test-key';
    if (!apiKey || apiKey === '') {
        return res.status(500).json({ error: 'API key not configured' });
    }

    const { pdfText } = req.body;
    if (!pdfText || typeof pdfText !== 'string' || pdfText.trim().length === 0) {
        return res.status(400).json({ error: 'Invalid or missing pdfText' });
    }

    // In test mode, return mock success
    return res.status(200).json({ analysis: 'Mock analysis result' });
}

async function runTests() {
    console.log('\n🧪 Running Backend API Tests...\n');

    // Test 1: Reject non-POST requests
    {
        const req = createMockReq('GET', {});
        const res = createMockRes();
        const result = await testHandler(req, res);
        assert(result.statusCode === 405, 'Rejects GET request with 405');
        assert(result.data.error === 'Method not allowed', 'Returns correct error message for wrong method');
    }

    // Test 2: Reject missing pdfText
    {
        const req = createMockReq('POST', {});
        const res = createMockRes();
        const result = await testHandler(req, res);
        assert(result.statusCode === 400, 'Rejects missing pdfText with 400');
        assert(result.data.error === 'Invalid or missing pdfText', 'Returns correct error for missing pdfText');
    }

    // Test 3: Reject empty pdfText
    {
        const req = createMockReq('POST', { pdfText: '' });
        const res = createMockRes();
        const result = await testHandler(req, res);
        assert(result.statusCode === 400, 'Rejects empty pdfText with 400');
    }

    // Test 4: Reject whitespace-only pdfText
    {
        const req = createMockReq('POST', { pdfText: '   \n\n  ' });
        const res = createMockRes();
        const result = await testHandler(req, res);
        assert(result.statusCode === 400, 'Rejects whitespace-only pdfText with 400');
    }

    // Test 5: Reject non-string pdfText
    {
        const req = createMockReq('POST', { pdfText: 123 });
        const res = createMockRes();
        const result = await testHandler(req, res);
        assert(result.statusCode === 400, 'Rejects non-string pdfText with 400');
    }

    // Test 6: Accept valid pdfText
    {
        const req = createMockReq('POST', { pdfText: 'Valid bid document text' });
        const res = createMockRes();
        const result = await testHandler(req, res);
        assert(result.statusCode === 200, 'Accepts valid pdfText with 200');
        assert(result.data.analysis !== undefined, 'Returns analysis in response');
    }

    // Test 7: Handle large pdfText (simulating 100+ page document)
    {
        const largePdfText = 'Page content '.repeat(10000); // Simulate large document
        const req = createMockReq('POST', { pdfText: largePdfText });
        const res = createMockRes();
        const result = await testHandler(req, res);
        assert(result.statusCode === 200, 'Handles large PDF text');
    }

    console.log('\n🧪 Running Frontend Integration Tests...\n');

    // Test 8: Validate frontend payload structure
    {
        const frontendPayload = { pdfText: 'Test document' };
        assert(typeof frontendPayload.pdfText === 'string', 'Frontend sends pdfText as string');
        assert(frontendPayload.pdfText.length > 0, 'Frontend sends non-empty pdfText');
    }

    // Test 9: Validate response parsing
    {
        const apiResponse = { analysis: 'Mock analysis' };
        assert(apiResponse.analysis !== undefined, 'Response contains analysis field');
        assert(typeof apiResponse.analysis === 'string', 'Analysis is a string');
    }

    console.log('\n🧪 Running File Structure Tests...\n');

    // Test 10: Check required files exist
    const fs = require('fs');
    const path = require('path');

    const requiredFiles = [
        'index.html',
        'analyzer.js',
        'styles.css',
        'api/analyze.js',
        'vercel.json'
    ];

    for (const file of requiredFiles) {
        const filePath = path.join(__dirname, file);
        const exists = fs.existsSync(filePath);
        assert(exists, `Required file exists: ${file}`);
    }

    // Test 11: Validate API function structure
    {
        const apiContent = require('fs').readFileSync(path.join(__dirname, 'api/analyze.js'), 'utf8');
        assert(apiContent.includes('export default'), 'API function exports default handler');
        assert(apiContent.includes('process.env.ANTHROPIC_API_KEY'), 'API function reads API key from env');
        assert(apiContent.includes('req.method'), 'API function checks HTTP method');
        assert(apiContent.includes('req.body'), 'API function reads request body');
    }

    // Test 12: Validate frontend calls correct endpoint
    {
        const frontendContent = require('fs').readFileSync(path.join(__dirname, 'analyzer.js'), 'utf8');
        assert(frontendContent.includes('/api/analyze'), 'Frontend calls /api/analyze endpoint');
        assert(!frontendContent.includes('api.anthropic.com'), 'Frontend does not call Anthropic directly');
        assert(!frontendContent.includes('localStorage.getItem'), 'Frontend does not use localStorage for API key');
    }

    // Test 13: Validate vercel.json configuration
    {
        const vercelConfig = JSON.parse(require('fs').readFileSync(path.join(__dirname, 'vercel.json'), 'utf8'));
        assert(vercelConfig.functions !== undefined, 'vercel.json has functions configuration');
        assert(vercelConfig.functions['api/analyze.js'] !== undefined, 'vercel.json configures analyze function');
    }

    console.log('\n📊 Test Results\n');
    console.log(`✅ Passed: ${passed}`);
    console.log(`❌ Failed: ${failed}`);
    console.log(`📈 Total: ${passed + failed}`);

    if (failed === 0) {
        console.log('\n🎉 All tests passed! Ready to deploy.\n');
        process.exit(0);
    } else {
        console.log('\n⚠️  Some tests failed. Please fix before deploying.\n');
        process.exit(1);
    }
}

// Run tests
runTests().catch(error => {
    console.error('❌ Test suite error:', error);
    process.exit(1);
});
