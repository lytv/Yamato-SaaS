#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🔍 KIỂM TRA TẤT CẢ LỖI TRONG DỰ ÁN...');
console.log('='.repeat(50));

const logFile = path.join(process.cwd(), 'all-errors.log');

// Xóa file log cũ
if (fs.existsSync(logFile)) {
  fs.unlinkSync(logFile);
}

let hasErrors = false;

// Function để chạy command và ghi log
function runCheck(command, description) {
  console.log(`\n📝 ${description}...`);
  
  try {
    const output = execSync(command, { 
      encoding: 'utf8', 
      stdio: 'pipe',
      cwd: process.cwd()
    });
    
    fs.appendFileSync(logFile, `\n=== ${description} ===\n${output}\n`);
    console.log(`✅ ${description} OK!`);
    return false;
  } catch (error) {
    const errorOutput = error.stdout + error.stderr;
    fs.appendFileSync(logFile, `\n=== ${description} ERRORS ===\n${errorOutput}\n`);
    console.log(`❌ Có lỗi ${description}!`);
    
    // Hiển thị một vài lỗi đầu tiên
    const errorLines = errorOutput.split('\n').filter(line => 
      line.includes('error') || line.includes('Error') || line.includes('✖')
    ).slice(0, 5);
    
    errorLines.forEach(line => console.log(`   ${line}`));
    if (errorLines.length === 5) {
      console.log('   ... (xem thêm trong all-errors.log)');
    }
    
    return true;
  }
}

// 1. Kiểm tra TypeScript
hasErrors |= runCheck('npm run check-types:all', 'TypeScript');

// 2. Kiểm tra ESLint
hasErrors |= runCheck('npm run lint:all', 'ESLint');

// 3. Tóm tắt
console.log('\n📊 TÓM TẮT:');
console.log('- Tất cả lỗi đã được ghi vào file: all-errors.log');
console.log('- Bạn có thể xem chi tiết: cat all-errors.log (Linux/Mac) hoặc type all-errors.log (Windows)');
console.log('- Hoặc mở file all-errors.log trong VS Code');

// Đếm số lỗi
if (fs.existsSync(logFile)) {
  const logContent = fs.readFileSync(logFile, 'utf8');
  const errorCount = (logContent.match(/error|Error|✖/g) || []).length;
  
  console.log(`- Tổng số lỗi tìm thấy: ${errorCount}`);
  
  if (errorCount === 0) {
    console.log('\n🎉 Không có lỗi! Bạn có thể chạy: npm run build');
  } else {
    console.log('\n🔧 Hãy fix các lỗi trên rồi chạy lại script này');
  }
}

console.log('\n🚀 Sau khi fix hết lỗi, chạy: npm run build');

process.exit(hasErrors ? 1 : 0);
