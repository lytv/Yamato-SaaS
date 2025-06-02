/**
 * DEBUG SCRIPT: 400 Bad Request Issue
 * 
 * Chuyên debug cho lỗi "GET /api/todos 400 (Bad Request)"
 * 
 * Cách sử dụng:
 * 1. Mở browser và đăng nhập
 * 2. Navigate to /dashboard/todos  
 * 3. Mở DevTools Console
 * 4. Paste script này và chạy
 */

console.log('🔍 DEBUGGING 400 BAD REQUEST ISSUE...');

// Test exact API call that's failing
async function test400Issue() {
  console.log('\n📡 Testing exact failing request...');
  
  const url = 'http://localhost:3000/api/todos?page=1&limit=10&sortBy=createdAt&sortOrder=desc';
  
  try {
    console.log(`🔗 Calling: ${url}`);
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      }
    });
    
    console.log(`📊 Response Status: ${response.status}`);
    console.log(`📊 Response Headers:`, Object.fromEntries(response.headers));
    
    const text = await response.text();
    console.log(`📊 Response Text Length: ${text.length}`);
    console.log(`📊 Response Text (first 500 chars):`, text.substring(0, 500));
    
    // Try to parse as JSON to see actual error
    try {
      const json = JSON.parse(text);
      console.log(`📊 Parsed JSON:`, json);
      
      if (json.error) {
        console.error(`❌ API Error: ${json.error}`);
        console.error(`❌ Error Code: ${json.code}`);
        if (json.details) {
          console.error(`❌ Error Details:`, json.details);
        }
      }
    } catch (parseError) {
      console.error(`❌ JSON Parse Error: ${parseError.message}`);
      console.log('📄 Raw response (likely HTML):', text);
    }
    
  } catch (fetchError) {
    console.error(`❌ Fetch Error: ${fetchError.message}`);
  }
}

// Test different parameter combinations
async function testParameterCombinations() {
  console.log('\n🧪 Testing different parameter combinations...');
  
  const testCases = [
    // No parameters
    '/api/todos',
    
    // Individual parameters
    '/api/todos?page=1',
    '/api/todos?limit=10',
    '/api/todos?sortBy=createdAt',
    '/api/todos?sortOrder=desc',
    
    // Invalid parameters that might cause 400
    '/api/todos?page=0',           // Invalid page (should be >= 1)
    '/api/todos?page=abc',         // Invalid page (not number)
    '/api/todos?limit=0',          // Invalid limit (should be >= 1)
    '/api/todos?limit=101',        // Invalid limit (should be <= 100)
    '/api/todos?sortBy=invalid',   // Invalid sortBy
    '/api/todos?sortOrder=invalid', // Invalid sortOrder
    
    // Original failing request
    '/api/todos?page=1&limit=10&sortBy=createdAt&sortOrder=desc',
  ];
  
  for (const endpoint of testCases) {
    try {
      console.log(`\n🔗 Testing: ${endpoint}`);
      
      const response = await fetch(`http://localhost:3000${endpoint}`);
      console.log(`   Status: ${response.status}`);
      
      if (response.status === 400) {
        const text = await response.text();
        try {
          const json = JSON.parse(text);
          console.error(`   ❌ 400 Error: ${json.error}`);
          if (json.details) {
            console.error(`   ❌ Details:`, json.details);
          }
        } catch (e) {
          console.error(`   ❌ 400 Response (not JSON): ${text.substring(0, 100)}`);
        }
      } else if (response.status === 200) {
        console.log(`   ✅ Success`);
      } else {
        console.log(`   ⚠️  Other status: ${response.status}`);
      }
      
      // Small delay to avoid overwhelming the server
      await new Promise(resolve => setTimeout(resolve, 100));
      
    } catch (error) {
      console.error(`   ❌ Error testing ${endpoint}: ${error.message}`);
    }
  }
}

// Test authentication separately
async function testAuthentication() {
  console.log('\n🔐 Testing authentication separately...');
  
  try {
    // Check Clerk state
    if (window.Clerk && window.Clerk.user) {
      console.log('✅ Clerk user found:', {
        id: window.Clerk.user.id,
        email: window.Clerk.user.primaryEmailAddress?.emailAddress,
        hasOrg: !!window.Clerk.organization?.id,
        orgId: window.Clerk.organization?.id,
      });
    } else {
      console.error('❌ No Clerk user found');
      return;
    }
    
    // Test a simple authenticated endpoint first
    const authTestResponse = await fetch('/api/debug-todo');
    console.log(`Auth test status: ${authTestResponse.status}`);
    
    if (authTestResponse.status === 401) {
      console.error('❌ Authentication failed on debug endpoint');
    } else {
      console.log('✅ Authentication working on debug endpoint');
    }
    
  } catch (error) {
    console.error(`❌ Auth test error: ${error.message}`);
  }
}

// Test query parameter parsing manually
function testQueryParameterParsing() {
  console.log('\n🔍 Testing query parameter parsing logic...');
  
  const testUrl = 'http://localhost:3000/api/todos?page=1&limit=10&sortBy=createdAt&sortOrder=desc';
  const url = new URL(testUrl);
  const searchParams = url.searchParams;
  
  console.log('📊 Parsed parameters:');
  console.log('   page:', searchParams.get('page'));
  console.log('   limit:', searchParams.get('limit'));
  console.log('   search:', searchParams.get('search'));
  console.log('   sortBy:', searchParams.get('sortBy'));
  console.log('   sortOrder:', searchParams.get('sortOrder'));
  
  // Test what the validation would receive
  const queryParams = {
    page: searchParams.get('page'),
    limit: searchParams.get('limit'),
    search: searchParams.get('search'),
    sortBy: searchParams.get('sortBy'),
    sortOrder: searchParams.get('sortOrder'),
  };
  
  console.log('📊 Query params object:', queryParams);
  
  // Check for null values that might cause issues
  const nullValues = Object.entries(queryParams).filter(([key, value]) => value === null);
  if (nullValues.length > 0) {
    console.log('⚠️  Null values found:', nullValues);
  }
}

// Main debug function
async function debug400Issue() {
  console.log('🚀 STARTING 400 BAD REQUEST DIAGNOSIS');
  console.log('====================================');
  
  testQueryParameterParsing();
  await testAuthentication();
  await test400Issue();
  await testParameterCombinations();
  
  console.log('\n✅ 400 DIAGNOSIS COMPLETE');
  console.log('========================');
  console.log('📋 Summary:');
  console.log('   - Look for ❌ errors above');
  console.log('   - Check validation details if available');
  console.log('   - Note which parameter combinations work vs fail');
  console.log('\n💡 Common 400 causes:');
  console.log('   1. Invalid query parameters (page=0, limit=101, etc.)');
  console.log('   2. Validation schema too strict');
  console.log('   3. Type coercion not working (string to number)');
  console.log('   4. Required parameters missing');
  console.log('   5. Authentication issues');
}

// Auto-run
debug400Issue();

// Export for manual testing
window.debug400 = {
  test400Issue,
  testParameterCombinations,
  testAuthentication,
  testQueryParameterParsing,
  debug400Issue
};

console.log('\n🔧 Manual test functions available as window.debug400.*');
