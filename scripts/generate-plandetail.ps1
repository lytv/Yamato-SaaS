# Entity Generator V3 - PlanDetail Generator
# PowerShell version for modern Windows

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "   Entity Generator V3 - PlanDetail" -ForegroundColor Cyan  
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Check if in correct directory
if (-not (Test-Path "scripts\configs\plandetail-config.ts")) {
    Write-Host "❌ Error: Please run this script from the project root directory" -ForegroundColor Red
    Write-Host "Expected: D:\saas\AgentCoding\V3\Yamato-SaaS\" -ForegroundColor Yellow
    Read-Host "Press Enter to exit"
    exit 1
}

Write-Host "🔍 Found configuration file: scripts\configs\plandetail-config.ts" -ForegroundColor Green
Write-Host ""

Write-Host "🚀 Generating PlanDetail entity with relationships..." -ForegroundColor Blue
Write-Host ""

# Run the generator with config
try {
    & npx ts-node scripts/enhanced-generate-advanced-entity-V3-configurable.ts plandetail configs/plandetail-config.ts
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host ""
        Write-Host "========================================" -ForegroundColor Green
        Write-Host "           ✅ SUCCESS!" -ForegroundColor Green
        Write-Host "========================================" -ForegroundColor Green
        Write-Host ""
        Write-Host "PlanDetail entity has been generated successfully!" -ForegroundColor Green
        Write-Host ""
        Write-Host "📋 Generated files:" -ForegroundColor Cyan
        Write-Host "  ✅ src/types/plandetail.ts" -ForegroundColor Green
        Write-Host "  ✅ src/models/Schema/plandetail.ts" -ForegroundColor Green
        Write-Host "  ✅ src/libs/queries/plandetail.ts" -ForegroundColor Green
        Write-Host "  ✅ src/libs/validations/plandetail.ts" -ForegroundColor Green
        Write-Host "  ✅ src/app/api/plandetails/* (API routes)" -ForegroundColor Green
        Write-Host "  ✅ src/features/plandetail/* (React components)" -ForegroundColor Green
        Write-Host "  ✅ src/hooks/usePlanDetail* (React hooks)" -ForegroundColor Green
        Write-Host "  ✅ src/app/[locale]/(auth)/dashboard/plandetails/page.tsx" -ForegroundColor Green
        Write-Host ""
        Write-Host "📋 Next Steps:" -ForegroundColor Cyan
        Write-Host "  1. Update src/models/Schema.ts to export new schemas" -ForegroundColor Yellow
        Write-Host "  2. Run: npm run type-check" -ForegroundColor Yellow
        Write-Host "  3. Test at: /dashboard/plandetails" -ForegroundColor Yellow
        Write-Host ""
        
        # Ask if user wants to update Schema.ts automatically
        $updateSchema = Read-Host "Would you like to automatically update src/models/Schema.ts? (y/n)"
        if ($updateSchema -eq "y" -or $updateSchema -eq "Y") {
            Write-Host ""
            Write-Host "🔧 Updating src/models/Schema.ts..." -ForegroundColor Blue
            
            $schemaFile = "src\models\Schema.ts"
            if (Test-Path $schemaFile) {
                $content = Get-Content $schemaFile -Raw
                
                # Check if export already exists
                if ($content -notmatch "export \* from '\./Schema/plandetail';") {
                    # Add export at the end
                    $content += "`n`n// PlanDetail Schema Export (Auto-generated)`nexport * from './Schema/plandetail';"
                    Set-Content $schemaFile -Value $content
                    Write-Host "✅ Successfully updated Schema.ts" -ForegroundColor Green
                } else {
                    Write-Host "ℹ️  Schema.ts already includes PlanDetail export" -ForegroundColor Yellow
                }
            } else {
                Write-Host "❌ Schema.ts not found at expected location" -ForegroundColor Red
            }
        }
        
        Write-Host ""
        Write-Host "🎉 Generation completed successfully!" -ForegroundColor Green
    } else {
        Write-Host ""
        Write-Host "❌ Generation failed. Please check the error messages above." -ForegroundColor Red
    }
} catch {
    Write-Host ""
    Write-Host "❌ Error running generator: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""
Read-Host "Press Enter to exit"
