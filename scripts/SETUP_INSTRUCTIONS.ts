/**
 * HƯỚNG DẪN SỬ DỤNG SCRIPT CHO OUTSOURCE_ORDER_DETAIL
 * 
 * Cách 1: Modify script gốc
 * Cách 2: Chạy với config riêng
 */

// =======================
// CÁCH 1: MODIFY SCRIPT GỐC
// =======================

/*
1. Mở file: enhanced-generate-advanced-entity-V3-with-relations.ts

2. Tìm dòng này (khoảng line 120):
   const planConfigWithRelations: EntityConfig = {

3. Sau planConfigWithRelations, thêm import:
   import { outsourceOrderDetailConfig } from './outsource-order-detail-config';

4. Tìm function main() (cuối file), modify phần này:

// OLD CODE:
if (entityName.toLowerCase() === 'plan' || entityName.toLowerCase() === 'plans') {
  config = planConfigWithRelations;
} else {
  // Use plan config as template for other entities
  config = {
    ...planConfigWithRelations,
    entityName: capitalizeFirst(entityName),
    entityNameLower: entityName.toLowerCase(),
    entityNamePlural: `${entityName.toLowerCase()}s`,
    tableName: entityName.toLowerCase(),
  };
}

// NEW CODE:
if (entityName.toLowerCase() === 'plan' || entityName.toLowerCase() === 'plans') {
  config = planConfigWithRelations;
} else if (entityName.toLowerCase() === 'outsourceorderdetail' || 
           entityName.toLowerCase() === 'outsource_order_detail' ||
           entityName.toLowerCase() === 'outsource-order-detail') {
  config = outsourceOrderDetailConfig;
} else {
  // Use plan config as template for other entities
  config = {
    ...planConfigWithRelations,
    entityName: capitalizeFirst(entityName),
    entityNameLower: entityName.toLowerCase(),
    entityNamePlural: `${entityName.toLowerCase()}s`,
    tableName: entityName.toLowerCase(),
  };
}

5. Chạy script:
   npx ts-node scripts/enhanced-generate-advanced-entity-V3-with-relations.ts outsourceOrderDetail
*/

// =======================
// CÁCH 2: COMMAND LINE TRỰC TIẾP
// =======================

/*
1. Copy toàn bộ nội dung từ enhanced-generate-advanced-entity-V3-with-relations.ts
2. Tạo file mới: generate-outsource-order-detail-complete.ts
3. Replace planConfigWithRelations bằng outsourceOrderDetailConfig
4. Chạy: npx ts-node scripts/generate-outsource-order-detail-complete.ts
*/

// =======================
// CÁCH 3: MANUAL INTEGRATION  
// =======================

/*
Nếu bạn muốn tự modify từng phần, đây là các file cần tạo:

1. src/models/Schema/outsourceOrderDetail.ts
2. src/types/outsourceOrderDetail.ts  
3. src/libs/queries/outsourceOrderDetail.ts
4. src/libs/validations/outsourceOrderDetail.ts
5. src/app/api/outsourceOrderDetails/route.ts
6. src/features/outsourceOrderDetail/OutsourceOrderDetailForm.tsx
7. src/hooks/useOutsourceOrderDetails.ts
8. src/app/[locale]/(auth)/dashboard/outsourceOrderDetails/page.tsx
*/

export const SETUP_INSTRUCTIONS = {
  step1: "Copy config from outsource-order-detail-config.ts",
  step2: "Modify main script to include outsourceOrderDetail case",  
  step3: "Run: npx ts-node scripts/enhanced-generate-advanced-entity-V3-with-relations.ts outsourceOrderDetail",
  step4: "Update src/models/Schema.ts to export new schema",
  step5: "Run type check: npm run type-check"
};
