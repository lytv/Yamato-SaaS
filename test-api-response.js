// Quick test to verify API response format
console.log('Testing API response format...');

// Simulate API response structure that backend should return
const mockEmployeeSalaryEntry = {
  id: 1,
  createdAt: "2025-07-07T10:00:00Z",
  updatedAt: "2025-07-07T10:00:00Z",
  workDate: "2025-07-07",
  entryDate: "2025-07-07",
  actualQuantity: 45,          // ✅ camelCase 
  plannedQuantity: 50,         // ✅ camelCase
  limitQuantity: 60,           // ✅ camelCase
  previousEnteredQuantity: 40, // ✅ camelCase
  unitPrice: 50000,            // ✅ camelCase
  totalAmount: 2250000,        // ✅ camelCase
  salaryNote: "Test note",     // ✅ camelCase
  status: "approved",
  approvedBy: "admin",         // ✅ camelCase
  approvedAt: "2025-07-07T10:00:00Z", // ✅ camelCase
  startTime: "2025-07-07T08:00:00Z",  // ✅ camelCase
  endTime: "2025-07-07T16:00:00Z",    // ✅ camelCase
  workDurationMinutes: 480,    // ✅ camelCase
  userId: "user_123",          // ✅ camelCase
  productionStepDetailId: 1,   // ✅ camelCase
  planId: 1,                   // ✅ camelCase
  productId: 1,                // ✅ camelCase
  userSync: {
    userId: "user_123",
    fullName: "Nguyen Van A",
    shortcut: "NVA"
  },
  product: {
    id: 1,
    productCode: "PRD001",
    productName: "iPhone 15 Pro"
  },
  productionStepDetail: {
    id: 1
  },
  plan: {
    id: 1,
    planName: "Monthly Plan"
  }
};

// Test frontend access patterns
console.log('=== Frontend Access Test ===');
console.log('Actual Quantity (camelCase):', mockEmployeeSalaryEntry.actualQuantity);
console.log('Planned Quantity (camelCase):', mockEmployeeSalaryEntry.plannedQuantity);
console.log('Unit Price (camelCase):', mockEmployeeSalaryEntry.unitPrice);
console.log('Total Amount (camelCase):', mockEmployeeSalaryEntry.totalAmount);
console.log('Employee Name:', mockEmployeeSalaryEntry.userSync?.fullName);
console.log('Product Name:', mockEmployeeSalaryEntry.product?.productName);

// Test old snake_case access (should be undefined)
console.log('\n=== Old Snake Case Test (Should be undefined) ===');
console.log('actual_quantity (snake_case):', mockEmployeeSalaryEntry.actual_quantity);
console.log('planned_quantity (snake_case):', mockEmployeeSalaryEntry.planned_quantity);

// Verify data format
console.log('\n=== Data Validation ===');
console.log('actualQuantity type:', typeof mockEmployeeSalaryEntry.actualQuantity);
console.log('actualQuantity value:', mockEmployeeSalaryEntry.actualQuantity);
console.log('Is actualQuantity a number?', typeof mockEmployeeSalaryEntry.actualQuantity === 'number');
console.log('Display value:', mockEmployeeSalaryEntry.actualQuantity ?? 'N/A');

console.log('\n✅ Test completed. Check above values for correct format.');
