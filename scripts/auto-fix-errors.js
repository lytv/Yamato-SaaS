#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');

console.log('🔧 AUTO-FIX CÁC LỖI ĐƠN GIẢN...');
console.log('='.repeat(50));

// 1. Fix tự động ESLint errors
try {
  console.log('📝 Đang fix ESLint errors...');
  execSync('npm run lint:fix', { stdio: 'inherit' });
  console.log('✅ ESLint auto-fix hoàn thành!');
} catch (error) {
  console.log('⚠️ Một số lỗi ESLint cần fix thủ công');
}

// 2. Kiểm tra lại TypeScript
console.log('\n📝 Kiểm tra lại TypeScript...');
try {
  execSync('npm run check-types', { stdio: 'inherit' });
  console.log('✅ Không còn lỗi TypeScript!');
} catch (error) {
  console.log('⚠️ Vẫn còn một số lỗi TypeScript cần fix thủ công');
  
  // Show specific error counts
  try {
    const output = execSync('npm run check-types', { encoding: 'utf8' });
    const errorLines = output.split('\n').filter(line => line.includes('error'));
    console.log(`📊 Còn ${errorLines.length} lỗi TypeScript`);
  } catch (e) {
    // Ignore
  }
}

console.log('\n🎯 NEXT STEPS:');
console.log('1. Chạy: npm run check-all-errors (để xem lỗi còn lại)');
console.log('2. Fix thủ công các lỗi type assignment');
console.log('3. Chạy: npm run build (để test final build)');
