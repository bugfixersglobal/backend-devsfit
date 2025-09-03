const Redis = require('ioredis');

// Test Redis caching functionality for billing service
async function testCaching() {
  console.log('🧪 Testing Redis caching for Billing Service...');

  const redis = new Redis({
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379'),
    db: parseInt(process.env.REDIS_DB || '2'),
    lazyConnect: true,
  });

  try {
    // Test connection
    await redis.ping();
    console.log('✅ Redis connection successful');

    // Test basic operations
    const testKey = 'billing:test:cache';
    const testValue = JSON.stringify({
      service: 'billing-service',
      timestamp: new Date().toISOString(),
      data: { test: true, message: 'Cache test successful' }
    });

    // Set value
    await redis.setex(testKey, 300, testValue);
    console.log('✅ Set cache value');

    // Get value
    const retrieved = await redis.get(testKey);
    if (retrieved === testValue) {
      console.log('✅ Retrieved cache value correctly');
    } else {
      console.log('❌ Cache retrieval failed');
    }

    // Test pattern operations
    const pattern = 'billing:test:*';
    const keys = await redis.keys(pattern);
    console.log(`✅ Found ${keys.length} keys matching pattern '${pattern}'`);

    // Test TTL
    const ttl = await redis.ttl(testKey);
    console.log(`✅ TTL for test key: ${ttl} seconds`);

    // Clean up
    await redis.del(testKey);
    console.log('✅ Cleaned up test key');

    // Test cache performance
    const performanceKey = 'billing:performance:test';
    const startTime = Date.now();
    
    for (let i = 0; i < 100; i++) {
      await redis.setex(`${performanceKey}:${i}`, 60, `value-${i}`);
    }
    
    const setTime = Date.now() - startTime;
    console.log(`✅ Set 100 keys in ${setTime}ms`);

    const getStartTime = Date.now();
    for (let i = 0; i < 100; i++) {
      await redis.get(`${performanceKey}:${i}`);
    }
    const getTime = Date.now() - getStartTime;
    console.log(`✅ Retrieved 100 keys in ${getTime}ms`);

    // Clean up performance test
    const perfKeys = await redis.keys(`${performanceKey}:*`);
    if (perfKeys.length > 0) {
      await redis.del(...perfKeys);
      console.log(`✅ Cleaned up ${perfKeys.length} performance test keys`);
    }

    console.log('🎉 All cache tests passed!');

  } catch (error) {
    console.error('❌ Cache test failed:', error.message);
    process.exit(1);
  } finally {
    await redis.quit();
    console.log('🔌 Redis connection closed');
  }
}

// Run the test
testCaching().catch(error => {
  console.error('❌ Test execution failed:', error);
  process.exit(1);
});
