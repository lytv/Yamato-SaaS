#!/bin/bash

# OutsourceOrder Entity Generator - Quick Start Commands
# Copy và paste commands này để bắt đầu ngay

echo "🚀 OutsourceOrder Entity Generator - Quick Start"
echo "================================================="
echo ""

echo "📋 Generated config files:"
echo "   ✓ scripts/configs/outsource-order-config.ts"
echo "   ✓ scripts/generate-outsource-order.js"
echo "   ✓ scripts/README-outsource-order.md"
echo ""

echo "🎯 RECOMMENDED: Preview first (dry-run)"
echo "Command to copy:"
echo "npm run generate:entity:dry"
echo ""

echo "🚀 Generate actual files:"
echo "Command to copy:"
echo "npm run generate:entity"
echo ""

echo "💡 Alternative methods:"
echo "cd scripts && node generate-outsource-order.js --dry-run --verbose"
echo "cd scripts && node generate-outsource-order.js --backup --verbose"
echo "cd scripts && npx tsx enhanced-generate-advanced-entity-V4-improved.ts outsourceorder ./configs/outsource-order-config.ts --dry-run"
echo ""

echo "📁 Files that will be generated:"
echo "   📄 types/outsourceOrder.ts"
echo "   📄 libs/queries/outsourceOrder.ts" 
echo "   📄 libs/validations/outsourceOrder.ts"
echo "   📄 hooks/useOutsourceOrders.ts"
echo "   📄 hooks/useOutsourceOrderMutations.ts"
echo "   📄 hooks/useOutsourceOrderFilters.ts"
echo "   📄 hooks/useOutsourceOrderExport.ts"
echo "   📄 app/api/outsourceOrders/route.ts"
echo ""

echo "⚠️  Notes:"
echo "   • Schema file will be SKIPPED (already exists)"
echo "   • Make sure tsx is installed: npm install -D tsx"
echo "   • Relations to userSyncSchema configured"
echo "   • Business validation rules included"
echo ""

echo "🎉 Ready to generate! Start with: npm run generate:entity:dry"
