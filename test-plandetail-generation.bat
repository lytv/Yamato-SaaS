@echo off
echo Current directory: %cd%
echo.
echo Running PlanDetail generator...
npx tsx scripts/enhanced-generate-advanced-entity-V3-configurable.ts plandetail configs/plandetail-config.ts
pause
