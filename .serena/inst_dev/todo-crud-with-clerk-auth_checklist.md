# ✅ CHECKLIST TRIỂN KHAI TODO CRUD (UPDATED) - Yamato-SaaS

## 🗄️ GIAI ĐOẠN 1: DATABASE LAYER VỚI DRIZZLE ORM

### Database Queries & Types
- [ ] Tạo `src/libs/queries/todo.ts` - Drizzle query functions
- [ ] Tạo `src/types/todo.ts` - TypeScript interfaces cho todo
- [ ] Implement createTodo function với Drizzle
- [ ] Implement getTodosByOwner function với pagination
- [ ] Implement getTodoById function với ownership check
- [ ] Implement updateTodo function với validation
- [ ] Implement deleteTodo function với authorization
- [ ] Implement getTodoStats function cho dashboard
- [ ] Add multi-tenancy support (userId vs organizationId)
- [ ] Test tất cả database functions với Drizzle Studio: `npm run db:studio`

### Schema Validation (nếu cần update)
- [ ] Review current schema trong `src/models/Schema.ts`
- [ ] Update schema nếu cần thêm fields
- [ ] Generate migration: `npm run db:generate`
- [ ] Test migration trong dev environment

## 🔌 GIAI ĐOẠN 2: API LAYER

### API Routes Structure
- [ ] Tạo `src/app/api/todos/route.ts` (GET list, POST create)
- [ ] Implement GET /api/todos với pagination và filters
- [ ] Implement POST /api/todos với validation
- [ ] Tạo `src/app/api/todos/[id]/route.ts` (GET, PUT, DELETE)
- [ ] Implement GET /api/todos/[id] với ownership check
- [ ] Implement PUT /api/todos/[id] với validation
- [ ] Implement DELETE /api/todos/[id] với confirmation
- [ ] Tạo `src/app/api/todos/stats/route.ts`
- [ ] Implement GET /api/todos/stats cho dashboard

### Authentication & Authorization
- [ ] Add Clerk authentication cho tất cả endpoints
- [ ] Extract userId và orgId từ auth()
- [ ] Implement multi-tenancy logic (personal vs org todos)
- [ ] Add proper error responses cho unauthorized access
- [ ] Test authentication flows với mock/real auth

### Validation Layer
- [ ] Tạo `src/libs/validations/todo.ts` với Zod schemas
- [ ] Implement CreateTodoSchema
- [ ] Implement UpdateTodoSchema
- [ ] Implement TodoListParamsSchema
- [ ] Implement TodoIdSchema
- [ ] Add validation middleware cho API routes

## 🎨 GIAI ĐOẠN 3: FRONTEND FEATURES

### Features Structure
- [ ] Tạo `src/features/todo/TodoList.tsx` với Shadcn UI
- [ ] Tạo `src/features/todo/TodoItem.tsx` với actions
- [ ] Tạo `src/features/todo/TodoForm.tsx` với React Hook Form
- [ ] Tạo `src/features/todo/TodoStats.tsx` cho dashboard
- [ ] Tạo `src/features/todo/TodoFilters.tsx` với search
- [ ] Tạo `src/features/todo/TodoDeleteDialog.tsx` với Shadcn Dialog
- [ ] Tạo `src/features/todo/TodoSkeleton.tsx` loading states

### Custom Hooks
- [ ] Tạo `src/hooks/useTodos.ts` cho state management
- [ ] Tạo `src/hooks/useTodoMutations.ts` cho CRUD operations
- [ ] Tạo `src/hooks/useTodoFilters.ts` cho search/filter logic
- [ ] Implement error handling trong hooks
- [ ] Add loading states và optimistic updates

### Pages với I18n
- [ ] Tạo `src/app/[locale]/(auth)/dashboard/todos/page.tsx`
- [ ] Tạo `src/app/[locale]/(auth)/dashboard/todos/create/page.tsx`
- [ ] Tạo `src/app/[locale]/(auth)/dashboard/todos/[id]/page.tsx`
- [ ] Tạo `src/app/[locale]/(auth)/dashboard/todos/[id]/edit/page.tsx`
- [ ] Add metadata và SEO cho tất cả pages
- [ ] Implement breadcrumb navigation

### Navigation Updates
- [ ] Cập nhật `src/app/[locale]/(auth)/dashboard/layout.tsx` - uncomment todos link
- [ ] Cập nhật `src/features/dashboard/DashboardHeader.tsx` - add todos nav
- [ ] Test navigation flow giữa các pages
- [ ] Add active link highlighting

## 🔧 GIAI ĐOẠN 4: INTEGRATION & UTILITIES

### API Client Layer
- [ ] Tạo `src/libs/api/todos.ts` - API client functions
- [ ] Tạo `src/libs/constants/todo.ts` - Constants và enums
- [ ] Implement fetchTodos với error handling
- [ ] Implement fetchTodo function
- [ ] Implement createTodo function
- [ ] Implement updateTodo function
- [ ] Implement deleteTodo function
- [ ] Implement fetchTodoStats function
- [ ] Add retry logic cho failed requests

### Error Handling & UX
- [ ] Setup error boundaries cho todo components
- [ ] Implement toast notifications cho user feedback
- [ ] Add loading skeletons theo Shadcn UI patterns
- [ ] Setup optimistic updates cho better UX
- [ ] Add form validation với error messages
- [ ] Test error scenarios và recovery

## 🌐 GIAI ĐOẠN 5: INTERNATIONALIZATION

### Translation Keys
- [ ] Add translation keys trong `src/locales/en.json`
- [ ] Add translation keys trong `src/locales/vi.json` (nếu có)
- [ ] Define todo-specific translations:
  - [ ] todo.title, todo.create, todo.edit, todo.delete
  - [ ] todo.form.title, todo.form.message placeholders
  - [ ] todo.confirmDelete, todo.noTodos
  - [ ] todo.stats.total, todo.stats.today
- [ ] Test translations trong different locales

### Component I18n Integration
- [ ] Add useTranslations hook trong todos components
- [ ] Replace hardcoded strings với translation keys
- [ ] Test language switching functionality
- [ ] Add pluralization cho counts (nếu cần)

## 🧪 GIAI ĐOẠN 6: TESTING

### Unit Testing với Vitest
- [ ] Tạo `tests/libs/queries/todo.test.ts`
- [ ] Test createTodo với valid/invalid data
- [ ] Test getTodosByOwner với pagination
- [ ] Test ownership checks trong queries
- [ ] Tạo `tests/features/todo/TodoList.test.tsx`
- [ ] Test component rendering và interactions
- [ ] Tạo `tests/features/todo/TodoForm.test.tsx`
- [ ] Test form validation và submission
- [ ] Tạo `tests/hooks/useTodos.test.ts`
- [ ] Test custom hooks logic

### API Testing
- [ ] Tạo `tests/api/todos.test.ts`
- [ ] Test CRUD operations với mock auth
- [ ] Test validation errors
- [ ] Test authorization failures
- [ ] Test pagination và filtering
- [ ] Mock Clerk authentication trong tests

### E2E Testing với Playwright
- [ ] Tạo `tests/e2e/todo-crud.spec.ts`
- [ ] Test complete todo creation flow
- [ ] Test todo editing và deletion
- [ ] Test search và filtering
- [ ] Tạo `tests/e2e/todo-permissions.spec.ts`
- [ ] Test multi-tenancy permissions
- [ ] Test authentication redirects

## 📊 GIAI ĐOẠN 7: PERFORMANCE & OPTIMIZATION

### Database Optimization
- [ ] Review và optimize Drizzle queries
- [ ] Add prepared statements cho repeated queries
- [ ] Test query performance với large datasets
- [ ] Monitor database connection pooling
- [ ] Add proper indexing cho owner_id

### Frontend Optimization
- [ ] Add React.memo cho TodoItem components
- [ ] Implement useCallback cho event handlers
- [ ] Add useMemo cho expensive calculations
- [ ] Implement code splitting với dynamic imports
- [ ] Test bundle size impact

### Data Loading Optimization
- [ ] Implement pagination với proper UX
- [ ] Add infinite scroll (optional enhancement)
- [ ] Optimize API response sizes
- [ ] Add client-side caching strategy
- [ ] Test loading performance

## 🚀 GIAI ĐOẠN 8: CODE QUALITY & DEPLOYMENT

### Code Quality Checks
- [ ] Run TypeScript checking: `npm run check-types`
- [ ] Run ESLint: `npm run lint`
- [ ] Fix ESLint issues: `npm run lint:fix`
- [ ] Test tất cả features: `npm run test`
- [ ] Run E2E tests: `npm run test:e2e`

### Database Migration
- [ ] Generate final migration nếu có schema changes: `npm run db:generate`
- [ ] Test migration trong staging environment
- [ ] Backup database trước khi deploy production

### Documentation & Handover
- [ ] Document API endpoints và usage
- [ ] Document component props và usage
- [ ] Update project README với todo features
- [ ] Create user guide cho todo functionality

### Commit & Deploy
- [ ] Use standardized commits: `npm run commit`
- [ ] Create feature branch và PR
- [ ] Code review checklist:
  - [ ] TypeScript types properly defined
  - [ ] Shadcn UI patterns followed
  - [ ] I18n keys properly used
  - [ ] Error handling implemented
  - [ ] Tests written cho new functionality
- [ ] Merge to main branch
- [ ] Deploy automatically qua GitHub Actions

## 🎯 VERIFICATION & ACCEPTANCE

### Functional Testing
- [ ] User có thể tạo todo mới
- [ ] User có thể view danh sách todos
- [ ] User có thể edit existing todos
- [ ] User có thể delete todos với confirmation
- [ ] Pagination hoạt động đúng
- [ ] Search và filtering work correctly
- [ ] Multi-tenancy permissions work (personal vs org)

### Technical Verification
- [ ] All API endpoints respond correctly
- [ ] Database queries optimized và secure
- [ ] Authentication flows work properly
- [ ] Authorization prevents unauthorized access
- [ ] Error handling provides good UX
- [ ] Loading states provide feedback
- [ ] Mobile responsive design
- [ ] Accessibility compliance

### Performance Verification
- [ ] Page load times acceptable
- [ ] API response times < 200ms
- [ ] Database queries efficient
- [ ] No memory leaks trong components
- [ ] Bundle size impact minimal

### I18n Verification
- [ ] All text properly translated
- [ ] Language switching works
- [ ] Date/time formatting correct
- [ ] Pluralization works (nếu có)

### Security Verification
- [ ] No unauthorized data access
- [ ] Proper input validation
- [ ] XSS prevention implemented
- [ ] CSRF protection in place
- [ ] SQL injection not possible (Drizzle ORM)

## 🏁 FINAL CHECKLIST

### Pre-Launch
- [ ] All tests passing
- [ ] Code review completed
- [ ] Documentation updated
- [ ] Performance benchmarks met
- [ ] Security review passed
- [ ] Accessibility tested
- [ ] Browser compatibility checked

### Launch
- [ ] Feature flag enabled (nếu có)
- [ ] Monitoring setup active
- [ ] Error tracking configured
- [ ] User feedback mechanism ready
- [ ] Rollback plan prepared

### Post-Launch
- [ ] Monitor error rates
- [ ] Track user adoption
- [ ] Gather user feedback
- [ ] Plan next iteration improvements
