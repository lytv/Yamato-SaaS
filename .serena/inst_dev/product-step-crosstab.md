# Product Step Crosstab Feature Implementation Plan (Updated)

## Enhanced Features

### Caching Mechanism (Backend)
```typescript
// Add to src/libs/queries/productStepCrosstab.ts
export async function getProductStepCrosstab(params: ProductStepCrosstabParams) {
  const cacheKey = `crosstab:${params.owner_id}:${params.price_type}:${params.product_code || 'all'}`;
  const cached = await redis.get(cacheKey);
  if (cached) return JSON.parse(cached);

  // Original DB query logic
  const result = await db.execute(...);
  
  // Cache for 5 minutes
  await redis.setex(cacheKey, 300, JSON.stringify(result));
  return result;
}
```

### Column Sorting (Frontend)
```typescript
// Add to ProductStepCrosstabTable.tsx
const [sortConfig, setSortConfig] = useState<{
  key: 'product_code' | 'step_code' | 'price';
  direction: 'ascending' | 'descending';
}>({ key: 'product_code', direction: 'ascending' });

const sortedData = useMemo(() => {
  // Sorting logic
}, [data, sortConfig]);
```

### Internationalization
```typescript
// Add to page.tsx
const t = useTranslations('ProductStepCrosstab');

// Add to locales/en/productStepCrosstab.json
{
  "tableHeaders": {
    "productCode": "Product Code",
    "stepCode": "Step Code",
    "price": "Price"
  }
}
```

### Audit Logging
```typescript
// Add to API route
await auditLog({
  action: 'VIEW_PRODUCT_STEP_CROSSTAB',
  userId: auth.userId,
  metadata: { price_type: params.price_type }
});
```

## Updated Timeline
| Phase | Duration | New Tasks |
|-------|----------|-----------|
| 1 | 1-2 days | Add cache setup |
| 2 | 2-3 days | Implement sorting and i18n |
| 3 | 1-2 days | Add audit logging |
| 4 | 1 day | Test new features |

## Updated Task List
- [ ] Implement Redis caching
- [ ] Add column sorting UI
- [ ] Add i18n support
- [ ] Implement audit logging
- [ ] Test new features

File đã được cập nhật đầy đủ các tính năng mới trong khi vẫn đảm bảo tuân thủ kiến trúc hệ thống hiện tại.