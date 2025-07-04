@echo off
echo 🔍 KIỂM TRA TẤT CẢ LỖI TRONG DỰ ÁN...
echo ==================================================

REM Xóa file log cũ
if exist all-errors.log del all-errors.log

echo.
echo 📝 Kiểm tra TypeScript...
npm run check-types:all > all-errors.log 2>&1
if %errorlevel% neq 0 (
    echo ❌ Có lỗi TypeScript!
) else (
    echo ✅ TypeScript OK!
)

echo.
echo 🔧 Kiểm tra ESLint...
npm run lint:all >> all-errors.log 2>&1
if %errorlevel% neq 0 (
    echo ❌ Có lỗi ESLint!
) else (
    echo ✅ ESLint OK!
)

echo.
echo 📊 TÓM TẮT:
echo - Tất cả lỗi đã được ghi vào file: all-errors.log
echo - Bạn có thể xem chi tiết: type all-errors.log
echo - Hoặc mở file all-errors.log trong VS Code

echo.
echo 🚀 Sau khi fix hết lỗi, chạy: npm run build
pause
