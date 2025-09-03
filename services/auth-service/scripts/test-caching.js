const axios = require('axios');

const BASE_URL = process.env.AUTH_SERVICE_URL || 'http://localhost:3001';
const TEST_EMAIL = 'test@example.com';
const TEST_PASSWORD = 'TestPassword123!';

async function testCachingSystem() {
  console.log('🧪 Testing Caching System...\n');

  try {
    // Step 1: Login to get token
    console.log('1. Logging in to get access token...');
    const loginResponse = await axios.post(`${BASE_URL}/auth/login`, {
      email: TEST_EMAIL,
      password: TEST_PASSWORD
    });

    const token = loginResponse.data.tokens.accessToken;
    const userId = loginResponse.data.user.id;
    console.log('✅ Login successful\n');

    // Step 2: Test /auth/me (fast endpoint)
    console.log('2. Testing /auth/me (fast endpoint)...');
    const startMe = Date.now();
    const meResponse = await axios.get(`${BASE_URL}/auth/me`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    const meTime = Date.now() - startMe;
    console.log(`✅ /auth/me response time: ${meTime}ms`);
    console.log(`   User: ${meResponse.data.fullName}\n`);

    // Step 3: Test /auth/profile (cached endpoint)
    console.log('3. Testing /auth/profile (cached endpoint)...');
    const startProfile = Date.now();
    const profileResponse = await axios.get(`${BASE_URL}/auth/profile`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    const profileTime = Date.now() - startProfile;
    console.log(`✅ /auth/profile response time: ${profileTime}ms`);
    console.log(`   User: ${profileResponse.data.fullName}\n`);

    // Step 4: Test /auth/profile/fresh (fresh endpoint)
    console.log('4. Testing /auth/profile/fresh (fresh endpoint)...');
    const startFresh = Date.now();
    const freshResponse = await axios.get(`${BASE_URL}/auth/profile/fresh`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    const freshTime = Date.now() - startFresh;
    console.log(`✅ /auth/profile/fresh response time: ${freshTime}ms`);
    console.log(`   User: ${freshResponse.data.fullName}\n`);

    // Step 5: Test cache metrics
    console.log('5. Testing cache metrics...');
    const metricsResponse = await axios.get(`${BASE_URL}/cache/metrics`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log('✅ Cache metrics retrieved');
    console.log(`   Hit Rate: ${(metricsResponse.data.application.hitRate * 100).toFixed(1)}%`);
    console.log(`   Total Requests: ${metricsResponse.data.application.totalRequests}\n`);

    // Step 6: Test cache health
    console.log('6. Testing cache health...');
    const healthResponse = await axios.get(`${BASE_URL}/cache/health`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log(`✅ Cache health: ${healthResponse.data.healthy ? 'Healthy' : 'Unhealthy'}\n`);

    // Performance Summary
    console.log('📊 Performance Summary:');
    console.log(`   /auth/me: ${meTime}ms (JWT data)`);
    console.log(`   /auth/profile: ${profileTime}ms (cached)`);
    console.log(`   /auth/profile/fresh: ${freshTime}ms (fresh)`);
    console.log(`   Cache Hit Rate: ${(metricsResponse.data.application.hitRate * 100).toFixed(1)}%`);

    // Recommendations
    console.log('\n💡 Recommendations:');
    if (meTime < 50) {
      console.log('   ✅ /auth/me is performing well (<50ms)');
    } else {
      console.log('   ⚠️  /auth/me is slow (>50ms)');
    }

    if (profileTime < 100) {
      console.log('   ✅ /auth/profile is performing well (<100ms)');
    } else {
      console.log('   ⚠️  /auth/profile is slow (>100ms)');
    }

    if (metricsResponse.data.application.hitRate > 0.8) {
      console.log('   ✅ Cache hit rate is good (>80%)');
    } else {
      console.log('   ⚠️  Cache hit rate is low (<80%)');
    }

    console.log('\n🎉 Caching system test completed successfully!');

  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
    process.exit(1);
  }
}

// Run the test
if (require.main === module) {
  testCachingSystem();
}

module.exports = { testCachingSystem }; 