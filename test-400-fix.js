/**
 * TEST SCRIPT: Verify 400 Fix
 * 
 * Script này test fix cho 400 Bad Request issue
 * 
 * Cách sử dụng:
 * 1. Apply fixes từ trên
 * 2. Restart development server: npm run dev
 * 3. Đăng nhập vào app
 * 4. Chạy script này trong Console
 */

console.log('🧪 TESTING 400 FIX...');

async function testFixedEndpoints() {
  console.log('\n📡 Testing previously failing request...');
  
  const originalFailingUrl = '/api/todos?page=1&limit=10&sortBy=createdAt&sortOrder=desc';
  
  try {
    console.log(`🔗 Testing: ${originalFailingUrl}`);
    
    const response = await fetch(originalFailingUrl);
    console.log(`📊 Status: ${response.status}`);
    
    if (response.status === 200) {
      console.log('✅ SUCCESS! 400 error fixed');
      
      const data = await response.json();
      console.log('📊 Response data:', data);
      
      if (data.success) {
        console.log(`✅ API returned success with ${data.data?.length || 0} todos`);
        console.log(`✅ Pagination:`, data.pagination);
      }
    } else if (response.status === 400) {
      console.error('❌ Still getting 400 error');
      const errorData = await response.json();
      console.error('❌ Error details:', errorData);
    } else {
      console.log(`⚠️  Different status: ${response.status}`);
      const text = await response.text();
      console.log('Response:', text.substring(0, 200));
    }
    
  } catch (error) {
    console.error(`❌ Test failed: ${error.message}`);
  }
}

async function testVariousParameterCombinations() {
  console.log('\n🧪 Testing various parameter combinations...');
  
  const testCases = [
    '/api/todos',
    '/api/todos?page=1',
    '/api/todos?limit=5',
    '/api/todos?search=test',
    '/api/todos?sortBy=title',
    '/api/todos?sortOrder=asc',
    '/api/todos?page=1&limit=10',
    '/api/todos?page=1&limit=10&sortBy=createdAt&sortOrder=desc',
    '/api/todos?page=2&limit=5&search=todo&sortBy=title&sortOrder=asc',
  ];
  
  let successCount = 0;
  let failCount = 0;
  
  for (const endpoint of testCases) {
    try {
      console.log(`\n🔗 Testing: ${endpoint}`);
      
      const response = await fetch(endpoint);
      console.log(`   Status: ${response.status}`);
      
      if (response.status === 200) {
        console.log('   ✅ Success');
        successCount++;
      } else {
        console.log(`   ❌ Failed with status ${response.status}`);
        failCount++;
        
        if (response.status === 400) {
          const errorData = await response.json();
          console.log('   Error:', errorData.error);
          if (errorData.details) {
            console.log('   Details:', errorData.details);
          }
        }
      }
      
      // Small delay
      await new Promise(resolve => setTimeout(resolve, 100));
      
    } catch (error) {
      console.error(`   ❌ Error: ${error.message}`);
      failCount++;
    }
  }
  
  console.log(`\n📊 Test Results: ${successCount} success, ${failCount} failed`);
  
  if (failCount === 0) {
    console.log('🎉 ALL TESTS PASSED! Fix is working correctly.');
  } else {
    console.log('⚠️  Some tests still failing. Check error details above.');
  }
}

async function testCreateTodo() {
  console.log('\n📝 Testing todo creation...');
  
  const testData = {
    title: 'Fix Test Todo',
    message: 'This todo was created after fixing the 400 error'
  };
  
  try {
    const response = await fetch('/api/todos', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testData)
    });
    
    console.log(`📊 Create Status: ${response.status}`);
    
    if (response.status === 201) {
      const data = await response.json();
      console.log('✅ Todo created successfully:', data);
    } else {
      const errorData = await response.json();
      console.error('❌ Create failed:', errorData);
    }
    
  } catch (error) {
    console.error(`❌ Create error: ${error.message}`);
  }
}

// Main test function
async function runFixTests() {
  console.log('🚀 RUNNING FIX VERIFICATION TESTS');
  console.log('=================================');
  
  await testFixedEndpoints();
  await testVariousParameterCombinations();
  await testCreateTodo();
  
  console.log('\n✅ FIX VERIFICATION COMPLETE');
  console.log('============================');
  console.log('\n💡 If all tests pass:');
  console.log('   - 400 error is fixed');
  console.log('   - You can now use the todo functionality');
  console.log('   - Check the actual UI to confirm');
  console.log('\n💡 If tests still fail:');
  console.log('   - Check server console for errors');
  console.log('   - Ensure server was restarted after fixes');
  console.log('   - Check authentication status');
}

// Auto-run
runFixTests();

// Export for manual testing
window.testFix = {
  testFixedEndpoints,
  testVariousParameterCombinations,
  testCreateTodo,
  runFixTests
};

console.log('\n🔧 Manual test functions available as window.testFix.*');
