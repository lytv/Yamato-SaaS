/**
 * DEBUG SCRIPT: Todo CRUD Issue Diagnosis
 * 
 * Lỗi: "Unexpected token '<', "<!DOCTYPE "... is not valid JSON"
 * Nguyên nhân: API endpoint trả về HTML thay vì JSON
 * 
 * Cách sử dụng:
 * 1. Mở browser và đăng nhập vào app
 * 2. Mở Developer Tools (F12)
 * 3. Vào tab Console
 * 4. Copy-paste script này vào console và chạy
 */

console.log('🔍 STARTING TODO DEBUG DIAGNOSIS...');

// Test 1: Check if API endpoints exist and return JSON
async function testApiEndpoints() {
  console.log('\n📡 Testing API Endpoints...');
  
  const endpoints = [
    '/api/todos',
    '/api/todos/stats'
  ];
  
  for (const endpoint of endpoints) {
    try {
      console.log(`\n🔗 Testing: ${endpoint}`);
      
      const response = await fetch(endpoint);
      console.log(`   Status: ${response.status}`);
      console.log(`   Headers: ${JSON.stringify(Object.fromEntries(response.headers))}`);
      
      const text = await response.text();
      console.log(`   Response length: ${text.length} characters`);
      console.log(`   Starts with: "${text.substring(0, 50)}..."`);
      
      // Check if it's HTML or JSON
      if (text.startsWith('<!DOCTYPE') || text.startsWith('<html>')) {
        console.error(`   ❌ ISSUE: ${endpoint} returns HTML instead of JSON`);
        console.log(`   Full response: ${text.substring(0, 500)}...`);
      } else {
        try {
          const json = JSON.parse(text);
          console.log(`   ✅ SUCCESS: Valid JSON response`);
          console.log(`   Data: ${JSON.stringify(json, null, 2)}`);
        } catch (e) {
          console.error(`   ❌ ISSUE: Invalid JSON - ${e.message}`);
        }
      }
    } catch (error) {
      console.error(`   ❌ FETCH ERROR: ${error.message}`);
    }
  }
}

// Test 2: Check authentication state
async function testAuthentication() {
  console.log('\n🔐 Testing Authentication...');
  
  // Check if window.Clerk is available
  if (typeof window !== 'undefined' && window.Clerk) {
    console.log('   ✅ Clerk object found');
    
    try {
      const user = window.Clerk.user;
      console.log(`   User: ${user ? 'Authenticated' : 'Not authenticated'}`);
      
      if (user) {
        console.log(`   User ID: ${user.id}`);
        console.log(`   Email: ${user.primaryEmailAddress?.emailAddress}`);
        console.log(`   Organization: ${window.Clerk.organization?.id || 'None'}`);
      }
    } catch (error) {
      console.error(`   ❌ Clerk error: ${error.message}`);
    }
  } else {
    console.error('   ❌ Clerk not found in window object');
  }
}

// Test 3: Check current page and routing
function testRouting() {
  console.log('\n🧭 Testing Routing...');
  console.log(`   Current URL: ${window.location.href}`);
  console.log(`   Pathname: ${window.location.pathname}`);
  console.log(`   Origin: ${window.location.origin}`);
  
  // Check if we're in the right locale/auth context
  const isInAuthRoute = window.location.pathname.includes('dashboard');
  const hasLocale = /^\/[a-z]{2}\//.test(window.location.pathname);
  
  console.log(`   Is in auth route: ${isInAuthRoute}`);
  console.log(`   Has locale prefix: ${hasLocale}`);
}

// Test 4: Test specific todo creation
async function testCreateTodo() {
  console.log('\n📝 Testing Todo Creation...');
  
  const testData = {
    title: 'Debug Test Todo',
    message: 'This is a test todo created by debug script'
  };
  
  try {
    console.log(`   Sending POST to /api/todos with data:`, testData);
    
    const response = await fetch('/api/todos', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testData)
    });
    
    console.log(`   Response status: ${response.status}`);
    console.log(`   Response headers:`, Object.fromEntries(response.headers));
    
    const text = await response.text();
    console.log(`   Response text (first 200 chars): "${text.substring(0, 200)}"`);
    
    if (text.startsWith('<!DOCTYPE') || text.startsWith('<html>')) {
      console.error(`   ❌ ISSUE: POST /api/todos returns HTML instead of JSON`);
      console.log(`   Full HTML response:`, text);
    } else {
      try {
        const json = JSON.parse(text);
        console.log(`   ✅ SUCCESS: Todo creation response:`, json);
      } catch (e) {
        console.error(`   ❌ JSON Parse Error: ${e.message}`);
      }
    }
  } catch (error) {
    console.error(`   ❌ Request Error: ${error.message}`);
  }
}

// Test 5: Check environment and console errors
function testEnvironment() {
  console.log('\n🌍 Testing Environment...');
  console.log(`   Node ENV: ${process?.env?.NODE_ENV || 'Not available in browser'}`);
  console.log(`   User Agent: ${navigator.userAgent}`);
  console.log(`   Document ready state: ${document.readyState}`);
  
  // Check for any console errors
  console.log('\n📋 Checking for previous console errors...');
  // Note: We can't actually read past console errors, but we can monitor new ones
  console.log('   (Monitor browser console for any error messages)');
}

// Test 6: Test middleware and authentication headers
async function testMiddleware() {
  console.log('\n🛡️ Testing Middleware and Auth Headers...');
  
  try {
    // Test a simple fetch to see what headers are sent/received
    const response = await fetch('/api/todos', {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      }
    });
    
    console.log(`   Request headers sent: Accept: application/json`);
    console.log(`   Response status: ${response.status}`);
    console.log(`   Response Content-Type: ${response.headers.get('content-type')}`);
    console.log(`   Response headers:`, Object.fromEntries(response.headers));
    
    // Check if we're getting redirected (3xx status codes)
    if (response.status >= 300 && response.status < 400) {
      console.error(`   ❌ REDIRECT: API endpoint is redirecting (status ${response.status})`);
      console.log(`   Location header: ${response.headers.get('location')}`);
    }
    
    // Check if we're getting unauthorized (401/403)
    if (response.status === 401) {
      console.error(`   ❌ UNAUTHORIZED: Authentication failed`);
    }
    
    if (response.status === 403) {
      console.error(`   ❌ FORBIDDEN: Authorization failed`);
    }
    
  } catch (error) {
    console.error(`   ❌ Middleware test error: ${error.message}`);
  }
}

// Main debug function
async function runFullDiagnosis() {
  console.log('🚀 RUNNING FULL TODO DEBUG DIAGNOSIS');
  console.log('=====================================');
  
  // Run all tests
  testEnvironment();
  testRouting();
  await testAuthentication();
  await testMiddleware();
  await testApiEndpoints();
  await testCreateTodo();
  
  console.log('\n✅ DIAGNOSIS COMPLETE');
  console.log('==================');
  console.log('📊 Summary:');
  console.log('   - Check the console output above for any ❌ ISSUE markers');
  console.log('   - HTML responses instead of JSON indicate API routing issues');
  console.log('   - 401/403 errors indicate authentication/authorization problems');
  console.log('   - Check Network tab in DevTools for detailed request/response data');
  console.log('\n💡 Next steps:');
  console.log('   1. If you see HTML responses, check API route files');
  console.log('   2. If authentication issues, verify Clerk setup');
  console.log('   3. If routing issues, check middleware.ts');
  console.log('   4. Check browser Network tab for actual HTTP requests');
}

// Auto-run diagnosis
runFullDiagnosis();

// Export individual test functions for manual testing
window.todoDebug = {
  testApiEndpoints,
  testAuthentication,
  testRouting,
  testCreateTodo,
  testEnvironment,
  testMiddleware,
  runFullDiagnosis
};

console.log('\n🔧 Individual test functions available as window.todoDebug.*');
