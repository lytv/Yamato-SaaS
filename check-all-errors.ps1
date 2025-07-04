# Script kiểm tra tất cả lỗi trong dự án
# Chạy: .\check-all-errors.ps1

Write-Host "🔍 KIỂM TRA TẤT CẢ LỖI TRONG DỰ ÁN..." -ForegroundColor Cyan
Write-Host "=" * 50

# Xóa file log cũ
if (Test-Path "all-errors.log") { Remove-Item "all-errors.log" }

# 1. Kiểm tra TypeScript errors
Write-Host "📝 Kiểm tra TypeScript..." -ForegroundColor Yellow
$tsOutput = npm run check-types:all 2>&1
$tsOutput | Out-File -FilePath "all-errors.log" -Append
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Có lỗi TypeScript!" -ForegroundColor Red
    $tsOutput | Where-Object { $_ -match "error|Error" }
} else {
    Write-Host "✅ TypeScript OK!" -ForegroundColor Green
}

Write-Host ""

# 2. Kiểm tra ESLint errors
Write-Host "🔧 Kiểm tra ESLint..." -ForegroundColor Yellow
$lintOutput = npm run lint:all 2>&1
$lintOutput | Out-File -FilePath "all-errors.log" -Append
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Có lỗi ESLint!" -ForegroundColor Red
    $lintOutput | Where-Object { $_ -match "error|Error|✖" }
} else {
    Write-Host "✅ ESLint OK!" -ForegroundColor Green
}

Write-Host ""

# 3. Tóm tắt
Write-Host "📊 TÓM TẮT:" -ForegroundColor Cyan
Write-Host "- Tất cả lỗi đã được ghi vào file: all-errors.log"
Write-Host "- Bạn có thể xem chi tiết bằng: Get-Content all-errors.log"
Write-Host "- Hoặc mở file all-errors.log trong VS Code"

# 4. Hiển thị số lượng lỗi
$errorCount = (Get-Content "all-errors.log" | Select-String "error|Error|✖").Count
Write-Host "- Tổng số lỗi tìm thấy: $errorCount" -ForegroundColor $(if ($errorCount -eq 0) { "Green" } else { "Red" })

Write-Host ""
Write-Host "🚀 Sau khi fix hết lỗi, chạy: npm run build" -ForegroundColor Green
