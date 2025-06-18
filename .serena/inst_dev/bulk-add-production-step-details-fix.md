## Fix Bulk Add Production Step Details Data Loading Issue

### Problem
The Bulk Add Production Step Details page is not loading data because:
1. `useProducts` hook requires `ownerId` parameter but it's not being passed
2. `useProductionSteps` hook requires `ownerId` parameter but it's not being passed

### Solution Plan (TDD Approach)

1. **Write failing tests** that describe the expected behavior:
   - Test that products are loaded when ownerId is available
   - Test that production steps are loaded when ownerId is available
   - Test that the component handles the case when user/org context is not available

2. **Identify how to get ownerId**:
   - Check if there's a user context hook
   - Check if there's an organization context hook
   - Look at other dashboard pages to see how they get ownerId

3. **Implement the fix**:
   - Add proper context/hook to get ownerId
   - Pass ownerId to both useProducts and useProductionSteps hooks
   - Handle loading states and error cases

4. **Verify the fix**:
   - Run tests to ensure they pass
   - Test the functionality manually

### Files to examine:
- `src/app/[locale]/(auth)/dashboard/production-step-details/multi-assign/page.tsx`
- `src/hooks/useProducts.ts`
- `src/hooks/useProductionSteps.ts`
- Look for user/organization context hooks
- Check other dashboard pages for patterns

### Files to modify:
- `src/app/[locale]/(auth)/dashboard/production-step-details/multi-assign/page.tsx`
- Create/update tests for the component
