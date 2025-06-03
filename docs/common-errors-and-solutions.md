# Common Errors and Solutions - Yamato-SaaS TODO System

## TypeScript Compilation Errors

### 1. Type Import/Export Issues
**Error**: `Cannot find module '@/types/todo'` hoặc type definitions không được nhận diện
**Solution**:
- Đảm bảo export đúng kiểu: `export type Todo = ...`
- Sử dụng `import type` cho type imports: `import type { Todo } from '@/types/todo'`
- Kiểm tra tsconfig.json paths mapping

### 2. Drizzle Schema Type Mismatches
**Error**: `Type 'Date' is not assignable to type 'string'`
**Solution**:
- Tách riêng `TodoDb` (server-side với Date) và `Todo` (client-side với string dates)
- Sử dụng `typeof todoSchema.$inferSelect` cho database types
- Transform dates khi trả về từ API

### 3. Strict TypeScript Mode Errors
**Error**: `Parameter implicitly has 'any' type`
**Solution**:
- Luôn explicit type annotations
- Sử dụng `unknown` thay vì `any`
- Enable strict mode trong tsconfig.json

## ESLint/Linter Errors

### 1. Unused Variables
**Error**: `'variable' is assigned a value but never used`
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
- Import `import { auth } from '@clerk/nextjs'`
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
- Define union types: `'createdAt' | 'updatedAt' | 'title'`
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
