# Show All Products Feature

Implement a feature to allow users to view all products in the list view, bypassing pagination.

## Task List

- [x] **Backend:** Modify the `/api/products` endpoint to accept a `showAll` query parameter.
- [x] **Backend:** Update the `getProducts` database query to fetch all records when `showAll` is true.
- [x] **Frontend:** Update the `useProducts` hook and `fetchProducts` API client to support the `showAll` flag.
- [x] **Frontend:** Add a UI toggle (Checkbox/Switch) to the `ProductList` component.
- [x] **Frontend:** Implement state management in `ProductList` to switch between paginated and "show all" modes.
- [x] **Frontend:** Conditionally hide pagination controls when "show all" is active.
- [x] **Cleanup:** Review and test the entire flow.

## Implementation Plan

### 1. Backend API (`src/app/api/products/route.ts`)

- The `GET` handler will parse `showAll` from `searchParams`.
- It will pass this boolean flag to the `getProducts` function.

### 2. Database Query (`src/libs/queries/product.ts`)

- The `getProducts` function will be updated to accept a `showAll: boolean` parameter.
- The `db.select().from(products)...` query chain will conditionally apply `.limit(limit).offset(offset)` only if `showAll` is false.
- The `pagination` object in the return value will be adjusted. If `showAll` is true, `totalPages` will be 1, and `total` will be the full count.

### 3. Frontend Data Fetching

- **`src/libs/api/products.ts`**: The `fetchProducts` function will append `showAll=true` to the request URL if the `showAll` parameter is passed.
- **`src/hooks/useProducts.ts`**: The `useProducts` hook will accept a `showAll` boolean in its parameters and pass it to `fetchProducts`.

### 4. Frontend UI (`src/features/product/ProductList.tsx`)

- A new state `const [showAll, setShowAll] = useState(false);` will be added.
- A `Switch` or `Checkbox` component will be added near the filter controls. It will be bound to the `showAll` state.
- The `useProducts` hook will be called with the `showAll` state value: `useProducts({ ..., showAll })`.
- The JSX for pagination controls will be wrapped in a conditional render: `{!showAll && pagination && ...}`.

### Relevant Files

- `src/app/api/products/route.ts` - Backend API endpoint.
- `src/libs/queries/product.ts` - Database query logic.
- `src/libs/api/products.ts` - Frontend API client.
- `src/hooks/useProducts.ts` - Custom hook for product data.
- `src/features/product/ProductList.tsx` - The main UI component for the product list. 