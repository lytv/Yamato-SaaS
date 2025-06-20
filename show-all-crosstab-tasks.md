# Task List: Implement "Show All" for Product Step Crosstab

- [x] **Backend: Database Query** - Modify `getProductStepCrosstab` in `src/libs/queries/productStepCrosstab.ts` to handle a `showAll` parameter and conditionally remove pagination logic (`LIMIT`/`OFFSET`).
- [x] **Backend: API Endpoint** - Update the GET route in `src/app/api/product-step-crosstab/route.ts` to accept a `showAll` query parameter and pass it to the database query function.
- [x] **API Client: Data Fetching** - Update `fetchProductStepCrosstab` in `src/libs/api/productStepCrosstab.ts` to accept a `showAll` parameter and include it in the API request.
- [x] **Frontend: State Management Hook** - Update the `useProductStepCrosstab` hook in `src/hooks/useProductStepCrosstab.ts` to manage the `showAll` state and pass it to the data fetching function.
- [x] **Frontend: UI Filter Component** - Add a "Show All" checkbox to `src/features/product-step-crosstab/ProductStepCrosstabFilter.tsx`.
- [x] **Frontend: UI Container Component** - Modify `src/features/product-step-crosstab/ProductStepCrosstabContainer.tsx` to conditionally hide pagination controls based on the `showAll` state.
- [x] **Verification** - Run the application and confirm the "Show All" feature works as expected on the Product Step Crosstab page. 