@echo off
echo ========================================
echo    Entity Generator V3 - PlanDetail
echo ========================================
echo.

REM Check if in correct directory
if not exist "scripts\configs\plandetail-config.ts" (
    echo ❌ Error: Please run this script from the project root directory
    echo Expected: D:\saas\AgentCoding\V3\Yamato-SaaS\
    pause
    exit /b 1
)

echo 🔍 Found configuration file: scripts\configs\plandetail-config.ts
echo.

echo 🚀 Generating PlanDetail entity with relationships...
echo.

REM Run the generator with config
npx ts-node scripts/enhanced-generate-advanced-entity-V3-configurable.ts plandetail configs/plandetail-config.ts

if %errorlevel% neq 0 (
    echo.
    echo ❌ Generation failed. Please check the error messages above.
    pause
    exit /b 1
)

echo.
echo ========================================
echo           ✅ SUCCESS!
echo ========================================
echo.
echo PlanDetail entity has been generated successfully!
echo.
echo 📋 Generated files:
echo   ✅ src/types/plandetail.ts
echo   ✅ src/models/Schema/plandetail.ts
echo   ✅ src/libs/queries/plandetail.ts
echo   ✅ src/libs/validations/plandetail.ts
echo   ✅ src/app/api/plandetails/* (API routes)
echo   ✅ src/features/plandetail/* (React components)
echo   ✅ src/hooks/usePlanDetail* (React hooks)
echo   ✅ src/app/[locale]/(auth)/dashboard/plandetails/page.tsx
echo.
echo 📋 Next Steps:
echo   1. Update src/models/Schema.ts to export new schemas
echo   2. Run: npm run type-check
echo   3. Test at: /dashboard/plandetails
echo.
echo Press any key to continue...
pause > nul
