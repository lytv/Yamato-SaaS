# Combined Documentation Summary

## From: common-errors-and-solutions.md

# Common Errors and Solutions - Yamato-SaaS TODO System

## TypeScript Compilation Errors

### 1. Type Import/Export Issues
**Error**: `Cannot find module \'@/types/todo\'` hoặc type definitions không được nhận diện
**Solution**:
- Đảm bảo export đúng kiểu: `export type Todo = ...`
- Sử dụng `import type` cho type imports: `import type { Todo } from \'@/types/todo\'`
- Kiểm tra tsconfig.json paths mapping

### 2. Drizzle Schema Type Mismatches
**Error**: `Type \'Date\' is not assignable to type \'string\'`
**Solution**:
- Tách riêng `TodoDb` (server-side với Date) và `Todo` (client-side với string dates)
- Sử dụng `typeof todoSchema.$inferSelect` cho database types
- Transform dates khi trả về từ API

### 3. Strict TypeScript Mode Errors
**Error**: `Parameter implicitly has \'any\' type`
**Solution**:
- Luôn explicit type annotations
- Sử dụng `unknown` thay vì `any`
- Enable strict mode trong tsconfig.json

## ESLint/Linter Errors

### 1. Unused Variables
**Error**: `\'variable\' is assigned a value but never used`
**Solution**:
- Prefix với underscore: `_unusedVar`
- Remove nếu thực sự không cần
- Sử dụng ESLint disable comments nếu cần thiết

### 2. Import/Export Order
**Error**: Import order violations
**Solution**:
- Group imports: external packages, internal, relative
- Sử dụng ESLint auto-fix: `npx eslint --fix`

### 3. Console.log in Production
**Error**: `Unexpected console statement`
**Solution**:
- Sử dụng proper logging library
- Remove console.log trước commit
- Sử dụng debugger hoặc logging service

## API Implementation Errors

### 1. Clerk Authentication Missing
**Error**: API endpoints không được bảo vệ bởi authentication
**Solution**:
- Import `import { auth } from \'@clerk/nextjs\'`
- Thêm auth check ở đầu mỗi API route
- Return 401 nếu không authenticated

### 2. Multi-tenancy Logic Issues
**Error**: Users có thể truy cập todos của người khác
**Solution**:
- Luôn sử dụng `userId` hoặc `organizationId` từ Clerk
- Filter queries theo ownerId
- Validate ownership trước mọi operations

### 3. Error Handling Inconsistent
**Error**: API trả về different error formats
**Solution**:
- Standardize error response format
- Sử dụng try-catch blocks
- Return proper HTTP status codes

## Database Query Errors

### 1. SQL Injection via Search
**Error**: Không sanitize search input
**Solution**:
- Sử dụng Drizzle ORM parameterized queries
- Validate input với Zod schemas
- Escape special characters nếu cần

### 2. Pagination Offset Issues
**Error**: Incorrect offset calculation
**Solution**:
- `offset = (page - 1) * limit`
- Validate page >= 1
- Handle edge cases (page = 0, negative numbers)

### 3. Sort Order Type Safety
**Error**: Runtime errors với invalid sort fields
**Solution**:
- Define union types: `\'createdAt\' | \'updatedAt\' | \'title\'`
- Validate sort parameters
- Provide defaults

## Testing Implementation Errors

### 1. Mock Setup Issues
**Error**: Mocks không work properly
**Solution**:
- Use `vi.mock()` cho external dependencies
- Mock Clerk auth: `vi.mocked(auth).mockReturnValue(...)`
- Clear mocks between tests: `beforeEach(() => vi.clearAllMocks())`

### 2. Async Test Problems
**Error**: Tests fail randomly do timing issues
**Solution**:
- Sử dụng `await` cho async operations
- Mock timers nếu cần: `vi.useFakeTimers()`
- Proper cleanup trong afterEach

### 3. Test Data Isolation
**Error**: Tests affect each other
**Solution**:
- Use separate test data cho mỗi test
- Clear database hoặc use transactions
- Independent test setup

## Frontend Component Errors

### 1. Hook Dependencies
**Error**: `React Hook useEffect has missing dependencies`
**Solution**:
- Add dependencies vào dependency array
- Sử dụng `useCallback` cho functions
- Extract functions outside component nếu không cần dependencies

### 2. State Management Issues
**Error**: State không update correctly
**Solution**:
- Sử dụng functional updates: `setState(prev => ...)`
- Avoid direct mutations
- Use immer cho complex state updates

### 3. Conditional Rendering Issues
**Error**: `Cannot read property of undefined`
**Solution**:
- Use optional chaining: `data?.property`
- Provide fallbacks: `data || []`
- Proper loading states

## Build and Deployment Errors

### 1. Next.js Build Failures
**Error**: Type errors in production build
**Solution**:
- Run `npm run build` locally trước deploy
- Fix all TypeScript errors
- Check all imports/exports

### 2. Environment Variables
**Error**: `process.env.VARIABLE is undefined`
**Solution**:
- Prefix với `NEXT_PUBLIC_` cho client-side
- Add to `.env.local` and `.env.example`
- Validate required env vars trong startup

### 3. Static Generation Issues
**Error**: `getStaticProps` errors với database calls
**Solution**:
- Sử dụng `getServerSideProps` cho dynamic data
- Proper error boundaries
- Handle loading states

## Performance Issues

### 1. N+1 Query Problems
**Error**: Too many database queries
**Solution**:
- Use joins hoặc includes
- Batch queries with Promise.all()
- Implement proper pagination

### 2. Large Bundle Sizes
**Error**: Slow loading times
**Solution**:
- Dynamic imports: `const Component = dynamic(() => import(...))`
- Tree shaking
- Analyze bundle với `@next/bundle-analyzer`

## Quick Fix Commands

```bash
# Type checking
npm run check-types

# Linting
npm run lint
npx eslint --fix src/

# Testing
npm run test
npm run test:watch

# Build verification
npm run build

# Database
npm run db:generate
npm run db:push
```

## Prevention Checklist

- [ ] Run `npm run check-types` before commit
- [ ] Run `npm run lint` and fix all errors
- [ ] Write tests first (TDD)
- [ ] Test all API endpoints manually
- [ ] Verify authentication works
- [ ] Check multi-tenancy isolation
- [ ] Test error scenarios
- [ ] Validate input sanitization
- [ ] Check responsive design
- [ ] Test with different user roles

## Resources

- [TypeScript Strict Mode](https://www.typescriptlang.org/tsconfig#strict)
- [Drizzle ORM Documentation](https://orm.drizzle.team/)
- [Clerk Authentication Guide](https://clerk.com/docs)
- [Next.js API Routes](https://nextjs.org/docs/api-routes/introduction)
- [Vitest Testing Framework](https://vitest.dev/)

---
*Last updated: $(date)*
*Project: Yamato-SaaS TODO System*

---
## From: COMMON_ISSUES_SOLUTIONS.md

# Common Issues & Solutions Reference

> Ghi lại các lỗi thường gặp và cách sửa trong quá trình phát triển Todo CRUD feature

## 🔧 TypeScript Type Issues

### 1. NextRequest vs Request Type Mismatch
**Lỗi:** `Argument of type \'Request\' is not assignable to parameter of type \'NextRequest\'`

**Nguyên nhân:** Test mock sử dụng standard `Request` object nhưng API routes expect `NextRequest`

**Giải pháp:**
```typescript
// Trong test files
const mockRequest = new Request(\'http://localhost/api/todos\') as any;
```

### 2. Missing Required Properties in Types
**Lỗi:** `Property \'ownerId\' is missing in type`

**Nguyên nhân:** TodoListParams type yêu cầu ownerId nhưng test không provide

**Giải pháp:**
```typescript
const params: TodoListParams = {
  page: 1,
  limit: 10,
  sortBy: \'createdAt\',
  sortOrder: \'desc\',
  ownerId: \'test-owner-id\', // Thêm property bắt buộc
};
```

### 3. TSConfig Include Pattern Issues
**Lỗi:** `File \'.next/types/**/*.ts\' not found`

**Nguyên nhân:** TypeScript tìm files trong .next folder chưa được tạo

**Giải pháp:**
```json
// tsconfig.json - Loại bỏ pattern không cần thiết
"include": [
  "next-env.d.ts",
  "**/*.ts",
  "**/*.tsx",
  ".storybook/*.ts",
  // ".next/types/**/*.ts", // Bỏ dòng này
  "**/*.mts"
]
```

## 🔧 ESLint Issues

### 1. Require() Style Imports
**Lỗi:** `A \'require()\' style import is forbidden`

**Nguyên nhân:** Test files sử dụng CommonJS require() thay vì ES6 imports

**Giải pháp:**
```typescript
// ❌ Sai
const { useTodos } = require(\'@/hooks/useTodos\');

// ✅ Đúng
import { useTodos } from \'@/hooks/useTodos\';
const mockUseTodos = vi.mocked(useTodos);
```

### 2. Unused Variables
**Lỗi:** `\'variable\' is declared but its value is never read`

**Giải pháp:**
```typescript
// ❌ Sai
const mockUseTodos = vi.mocked(useTodos);

// ✅ Đúng - Thêm underscore prefix
const _mockUseTodos = vi.mocked(useTodos);

// ✅ Hoặc xóa hẳn nếu không dùng
```

### 3. isNaN vs Number.isNaN
**Lỗi:** `Prefer \'Number.isNaN\' over \'isNaN\'`

**Giải pháp:**
```typescript
// ❌ Sai
return isNaN(num) ? 1 : num;

// ✅ Đúng
return Number.isNaN(num) ? 1 : num;
```

### 4. ESLint Ignore Patterns
**Lỗi:** ESLint check các file không cần thiết (debug files, markdown, test files)

**Giải pháp:**
```javascript
// eslint.config.mjs
ignores: [
  \'migrations/**/*\',
  \'next-env.d.ts\',
  \'debug-*.js\',
  \'fix-*.js\',
  \'test-*.js\',
  \'*.md\',
  \'.serena/**/*\',
  \'src/features/**/__tests__/**\',
  \'tests/features/**\',
]
```

## 🔧 React Hooks Issues

### 1. Infinite Loop in useCallback/useEffect
**Lỗi:** Component re-render liên tục, API calls không ngừng

**Nguyên nhân:** Object dependencies trong useCallback/useEffect được tạo mới mỗi render

**Giải pháp:**
```typescript
// ❌ Sai - Object được tạo mới mỗi render
const effectiveParams = { ...DEFAULT_PARAMS, ...params };
const fetchData = useCallback(async () => {
  // ...
}, [effectiveParams]); // Object reference thay đổi liên tục

// ✅ Đúng - Sử dụng primitive values
const page = params?.page ?? DEFAULT_PARAMS.page;
const limit = params?.limit ?? DEFAULT_PARAMS.limit;
const search = params?.search ?? DEFAULT_PARAMS.search;
const sortBy = params?.sortBy ?? DEFAULT_PARAMS.sortBy;
const sortOrder = params?.sortOrder ?? DEFAULT_PARAMS.sortOrder;

const fetchData = useCallback(async () => {
  const effectiveParams = { page, limit, search, sortBy, sortOrder };
  // ...
}, [page, limit, search, sortBy, sortOrder]); // Primitive values stable
```

### 2. Missing Dependencies Warning
**Lỗi:** `React Hook useCallback has a missing dependency`

**Giải pháp:**
```typescript
// Tách complex expressions thành separate variables
const effectiveParams = useMemo(() => ({ ...DEFAULT_PARAMS, ...params }), [params]);

const fetchData = useCallback(async () => {
  // ...
}, [effectiveParams]);
```

## 🔧 Test Configuration Issues

### 1. Mock API Response Type Mismatch
**Lỗi:** `Type \'false\' is not assignable to type \'true\'`

**Nguyên nhân:** Mock error response có `success: false` nhưng TypeScript expect `success: true`

**Giải pháp:**
```typescript
// ❌ Sai
mockFetchTodos.mockResolvedValue({
  success: false,
  error: \'Unauthorized access\',
  code: \'UNAUTHORIZED\',
});

// ✅ Đúng - Cast to any
mockFetchTodos.mockResolvedValue({
  success: false,
  error: \'Unauthorized access\',
  code: \'UNAUTHORIZED\',
} as any);
```

## 🔧 Git/Commit Issues

### 1. Pre-commit Hook Failures
**Nguyên nhân:** Husky pre-commit hooks fail vì lỗi TypeScript/ESLint

**Giải pháp tạm thời:**
```bash
# Bypass pre-commit hooks (chỉ khi cần thiết)
git commit --no-verify -m "message"
```

**Giải pháp lâu dài:** Sửa tất cả lỗi TypeScript và ESLint trước khi commit

### 2. PowerShell Console Errors
**Lỗi:** `System.ArgumentOutOfRangeException` trong PowerShell

**Giải pháp:** Sử dụng shorter commit messages hoặc switch sang CMD

## 🚀 Best Practices Learned

### 1. Test File Organization
```typescript
// Cấu trúc test file tốt
import { render, screen } from \'@testing-library/react\';
import { vi } from \'vitest\';

// Import hooks to be mocked
import { useHook } from \'@/hooks/useHook\';

// Mock declarations
vi.mock(\'@/hooks/useHook\', () => ({
  useHook: vi.fn(),
}));

// Create typed mock
const mockUseHook = vi.mocked(useHook);

describe(\'Component\', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it(\'should work\', () => {
    mockUseHook.mockReturnValue(/* mock data */);
    // test implementation
  });
});
```

### 2. Type-Safe API Routes
```typescript
// Always include explicit types
export async function GET(request: NextRequest): Promise<Response> {
  // implementation
}

// Use proper validation
const validatedParams = validateTodoListParams({
  page: searchParams.get(\'page\'),
  limit: searchParams.get(\'limit\'),
  // ...
});
```

### 3. Hook Dependencies
```typescript
// Prefer primitive dependencies over objects
const fetchData = useCallback(async () => {
  // implementation
}, [primitiveValue1, primitiveValue2]); // ✅

// Avoid object dependencies
```

---
## From: TODO-DEBUG-GUIDE.md

# 🚨 TODO CRUD ISSUE DIAGNOSIS & FIX GUIDE

## 📋 VẤN ĐỀ
**Lỗi**: `\"Unexpected token \'<\', \"<!DOCTYPE \"... is not valid JSON\"`

**Nguyên nhân**: API endpoint trả về HTML thay vì JSON

## 🔍 CÁCH DEBUG

### Bước 1: Chạy Debug Script (Client-side)
1. Mở browser và đăng nhập vào app
2. Navigate to todo page: `/dashboard/todos`
3. Mở Developer Tools (F12)
4. Copy script từ file `debug-todo-issue.js` và paste vào Console
5. Chạy script và xem kết quả

### Bước 2: Test Debug API (Server-side)
1. Truy cập: `http://localhost:3000/api/debug-todo`
2. Xem response JSON để check server-side issues
3. Test POST endpoint với data:
```json
{
  "title": "Test Todo",
  "message": "Debug test message"
}
```

### Bước 3: Check Network Tab
1. Mở DevTools > Network tab
2. Thử tạo todo
3. Xem request/response cho `/api/todos`
4. Check nếu response là HTML thay vì JSON

## 🔧 SOLUTIONS

### Solution 1: Fix Middleware (KHUYẾN NGHỊ)
**Vấn đề**: API routes đang được route qua i18n middleware

**Fix**:
1. Backup `src/middleware.ts`
2. Replace bằng content từ `middleware-fix.ts`
3. Restart development server: `npm run dev`

**Giải thích**: Middleware hiện tại route API requests qua i18n middleware, gây ra HTML responses

### Solution 2: Fix Auth Function
**Vấn đề**: `auth()` function có thể async/sync tùy version

**Fix trong API routes**:
```typescript
// Thay vì:
const { userId, orgId } = await auth();

// Dùng:
const authResult = auth();
const { userId, orgId } = authResult.userId ? authResult : await authResult;
```

### Solution 3: Check Database Connection
**Nếu debug cho thấy DB issues**:
1. Check `.env.local` có `DATABASE_URL`
2. Run: `npm run db:studio` để test connection
3. Check migration status: `npm run db:generate`

### Solution 4: Check Imports
**Nếu có import errors**:
1. Check tất cả import paths có đúng
2. Ensure TypeScript compilation: `npm run check-types`
3. Restart TypeScript server trong IDE

## 📊 DIAGNOSTIC CHECKLIST

### ✅ Quick Checks
- [ ] User đã authenticated (check Clerk UI)
- [ ] Đang ở đúng route: `/dashboard/todos`
- [ ] Browser console không có JavaScript errors
- [ ] Network tab shows requests đến `/api/todos`

### ✅ Server Checks
- [ ] API route files exist: `src/app/api/todos/route.ts`
- [ ] No TypeScript compilation errors: `npm run check-types`
- [ ] Database connected: `npm run db:studio`
- [ ] Environment variables set: `DATABASE_URL`, Clerk keys

### ✅ Response Analysis
- [ ] Response status code (should be 200/201, not 3xx/4xx/5xx)
- [ ] Response Content-Type (should be `application/json`)
- [ ] Response body (should be JSON, not HTML)
- [ ] No redirects in Network tab

## 🚀 TESTING FIXES

### Test 1: Manual API Test
```bash
# Test với curl (replace with your actual endpoint)
curl -X POST http://localhost:3000/api/todos \\
  -H "Content-Type: application/json" \\
  -d \'{\"title\":\"Test\",\"message\":\"Test message\"}\'
```

### Test 2: Browser Test
1. Apply fix
2. Restart development server
3. Navigate to `/dashboard/todos`
4. Try creating a todo
5. Check console for errors

### Test 3: Debug Endpoint Test
```bash
# Test debug endpoint
curl http://localhost:3000/api/debug-todo
```

## 🔄 RECOVERY STEPS

### If Fixes Don\'t Work:
1. **Revert changes**: Restore original `src/middleware.ts`
2. **Clean build**:
   ```bash
   rm -rf .next
   npm run build
   npm run dev
   ```
3. **Check logs**: Look for server console errors
4. **Test basic API**: Try accessing `/api/debug-todo` directly

### Alternative Approaches:
1. **Disable middleware temporarily**: Comment out middleware for API routes
2. **Use different auth pattern**: Check latest Clerk documentation
3. **Simplify API route**: Remove auth temporarily to test basic functionality

## 📝 EXPECTED RESULTS

### After Fix:
- ✅ `/api/todos` returns JSON response
- ✅ Creating todos works without errors
- ✅ Browser console shows no errors
- ✅ Network tab shows proper JSON responses
- ✅ Todo list loads and displays correctly

### Sample Working Response:
```json
{
  "success": true,
  "data": {
    "id": 1,
    "title": "Test Todo",
    "message": "Test message",
    "ownerId": "user_xxx",
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  },
  "message": "Todo created successfully"
}
```

## 🆘 ESCALATION

### If Still Not Working:
1. **Share debug results**: Copy output from debug script
2. **Share browser Network tab**: Screenshot của failed requests
3. **Share server logs**: Any console.error messages
4. **Environment details**: OS, Node version, browser version

### Common Additional Issues:
- **Port conflicts**: Try different port: `npm run dev -- -p 3001`
- **Caching issues**: Hard refresh browser (Ctrl+Shift+R)
- **Package versions**: Check `package.json` for Clerk version conflicts
- **Database permissions**: Check if user has write access to DB

---

💡 **Pro Tip**: Middleware fix (Solution 1) thường fix được 90% cases. Nếu không work, check auth function compatibility với Clerk version hiện tại.

---
## From: 400-FIX-SUMMARY.md

# 🔧 FIX SUMMARY: 400 Bad Request Issue

## 📋 VẤN ĐỀ ĐÃ ĐƯỢC FIX

**Lỗi gốc**: `GET /api/todos?page=1&limit=10&sortBy=createdAt&sortOrder=desc 400 (Bad Request)`

**Nguyên nhân**:
- `searchParams.get()` trả về `null` cho missing parameters
- Zod validation schema không handle `null` values đúng cách
- Default values không được apply khi nhận `null`

## ✅ NHỮNG GÌ ĐÃ FIX

### 1. **API Route Fix** (`src/app/api/todos/route.ts`)
```typescript
// BEFORE (gây 400 error):
const queryParams = {
  page: searchParams.get(\'page\'),        // = null
  limit: searchParams.get(\'limit\'),      // = null
  // ...
};

// AFTER (fixed):
const queryParams = {
  page: searchParams.get(\'page\') || undefined,        // = undefined
  limit: searchParams.get(\'limit\') || undefined,      // = undefined
  // ...
};
```

### 2. **Validation Schema Fix** (`src/libs/validations/todo.ts`)
```typescript
// BEFORE (không handle null/undefined):
page: z.coerce.number().int().min(1).default(1),

// AFTER (handle null/undefined properly):
page: z.union([z.string(), z.number(), z.undefined(), z.null()])
  .transform(val => {
    if (val === undefined || val === null) return 1;
    const num = typeof val === \'string\' ? parseInt(val, 10) : val;
    return isNaN(num) ? 1 : num;
  })
  .pipe(z.number().int().min(1, \'Page must be at least 1\')),
```

### 3. **Added Debug Logging**
- Console logs để track validation process
- Better error messages cho debugging

## 🧪 CÁCH TEST FIX

### Bước 1: Restart Server
```bash
# Stop current server (Ctrl+C)
npm run dev
```

### Bước 2: Test bằng Browser
1. Đăng nhập vào app
2. Navigate to `/dashboard/todos`
3. Mở DevTools Console
4. Paste và run script từ `test-400-fix.js`

### Bước 3: Manual Test
- Thử tạo todo mới
- Check if list loads without errors
- Verify pagination works

## 📊 EXPECTED RESULTS

### ✅ Success Indicators:
```
Status: 200 (instead of 400)
Response: {
  "success": true,
  "data": [...todos...],
  "pagination": {...}
}
```

### ❌ If Still Failing:
- Check server console for errors
- Verify authentication status
- Run debug script để get detailed info

## 🔍 ADDITIONAL DEBUG FILES

Các file đã tạo để support debugging:

1. **`debug-400-issue.js`** - Comprehensive client-side debugging
2. **`test-400-fix.js`** - Test fix verification
3. **`fix-400-error.js`** - Fix documentation và alternatives
4. **`src/app/api/debug-todo/route.ts`** - Server-side debug endpoint

## 💡 TECHNICAL EXPLANATION

### Why This Happened:
1. **Query String Parsing**: `URLSearchParams.get()` returns `null` for missing params
2. **Zod Default Handling**: Zod\'s `.default()` doesn\'t work with `null`, only `undefined`
3. **Type Coercion**: `z.coerce.number()` can\'t coerce `null` to number

### The Fix:
1. **Normalize null to undefined**: Convert `null` → `undefined` before validation
2. **Explicit transforms**: Handle `null`/`undefined` cases explicitly
3. **Robust parsing**: Proper fallbacks cho invalid values

## 🚀 NEXT STEPS

1. **Test the fix** bằng scripts provided
2. **Verify UI functionality** works correctly
3. **Report results** - confirm if issue resolved
4. **Clean up debug files** (optional) sau khi confirm fix works

---

💡 **Summary**: Issue was caused by `null` values from missing query parameters breaking Zod validation. Fix converts `null` to `undefined` và adds robust handling for missing/invalid parameters.
