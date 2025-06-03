# Common Issues & Solutions Reference

> Ghi lại các lỗi thường gặp và cách sửa trong quá trình phát triển Todo CRUD feature

## 🔧 TypeScript Type Issues

### 1. NextRequest vs Request Type Mismatch
**Lỗi:** `Argument of type 'Request' is not assignable to parameter of type 'NextRequest'`

**Nguyên nhân:** Test mock sử dụng standard `Request` object nhưng API routes expect `NextRequest`

**Giải pháp:**
```typescript
// Trong test files
const mockRequest = new Request('http://localhost/api/todos') as any;
```

### 2. Missing Required Properties in Types
**Lỗi:** `Property 'ownerId' is missing in type`

**Nguyên nhân:** TodoListParams type yêu cầu ownerId nhưng test không provide

**Giải pháp:**
```typescript
const params: TodoListParams = {
  page: 1,
  limit: 10,
  sortBy: 'createdAt',
  sortOrder: 'desc',
  ownerId: 'test-owner-id', // Thêm property bắt buộc
};
```

### 3. TSConfig Include Pattern Issues
**Lỗi:** `File '.next/types/**/*.ts' not found`

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
**Lỗi:** `A 'require()' style import is forbidden`

**Nguyên nhân:** Test files sử dụng CommonJS require() thay vì ES6 imports

**Giải pháp:**
```typescript
// ❌ Sai
const { useTodos } = require('@/hooks/useTodos');

// ✅ Đúng
import { useTodos } from '@/hooks/useTodos';
const mockUseTodos = vi.mocked(useTodos);
```

### 2. Unused Variables
**Lỗi:** `'variable' is declared but its value is never read`

**Giải pháp:**
```typescript
// ❌ Sai
const mockUseTodos = vi.mocked(useTodos);

// ✅ Đúng - Thêm underscore prefix
const _mockUseTodos = vi.mocked(useTodos);

// ✅ Hoặc xóa hẳn nếu không dùng
```

### 3. isNaN vs Number.isNaN
**Lỗi:** `Prefer 'Number.isNaN' over 'isNaN'`

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
  'migrations/**/*',
  'next-env.d.ts',
  'debug-*.js',
  'fix-*.js',
  'test-*.js',
  '*.md',
  '.serena/**/*',
  'src/features/**/__tests__/**',
  'tests/features/**',
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
**Lỗi:** `Type 'false' is not assignable to type 'true'`

**Nguyên nhân:** Mock error response có `success: false` nhưng TypeScript expect `success: true`

**Giải pháp:**
```typescript
// ❌ Sai
mockFetchTodos.mockResolvedValue({
  success: false,
  error: 'Unauthorized access',
  code: 'UNAUTHORIZED',
});

// ✅ Đúng - Cast to any
mockFetchTodos.mockResolvedValue({
  success: false,
  error: 'Unauthorized access',
  code: 'UNAUTHORIZED',
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
import { render, screen } from '@testing-library/react';
import { vi } from 'vitest';

// Import hooks to be mocked
import { useHook } from '@/hooks/useHook';

// Mock declarations
vi.mock('@/hooks/useHook', () => ({
  useHook: vi.fn(),
}));

// Create typed mock
const mockUseHook = vi.mocked(useHook);

describe('Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });
  
  it('should work', () => {
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
  page: searchParams.get('page'),
  limit: searchParams.get('limit'),
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
const fetchData = useCallback(async () => {
  // implementation  
}, [objectValue]); // ❌ - Can cause infinite loops
```

## 🎯 Checklist Before Commit

- [ ] `npm run check-types` passes
- [ ] `npx eslint --fix .` passes  
- [ ] No infinite loops in React hooks
- [ ] All test files use proper ES6 imports
- [ ] Unused variables/imports removed
- [ ] ESLint ignore patterns updated if needed
- [ ] TypeScript strict mode compliance

---
*Cập nhật lần cuối: Khi implement Todo CRUD feature* 