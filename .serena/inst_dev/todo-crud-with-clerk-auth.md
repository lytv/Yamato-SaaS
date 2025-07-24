# PLAN CHI TIẾT (UPDATED): Triển khai CRUD cho Todo trong Yamato-SaaS

## 📋 TỔNG QUAN DỰ ÁN (UPDATED)

### Mục tiêu
Xây dựng hệ thống CRUD hoàn chỉnh cho bảng `todo` trong Yamato-SaaS với:
- Xác thực người dùng thông qua Clerk (đã có sẵn)
- Sử dụng **Drizzle ORM** thay vì stored procedures
- API endpoints được bảo vệ và tuân thủ RESTful principles
- Frontend components theo **Shadcn UI** patterns
- **Multi-tenancy** support với organizations
- **Internationalization** với next-intl

### Cấu trúc bảng todo hiện tại (ĐÃ CÓ)
```typescript
// src/models/Schema.ts - ĐÃ TỒN TẠI
export const todoSchema = pgTable('todo', {
  id: serial('id').primaryKey(),
  ownerId: text('owner_id').notNull(), // Clerk userId hoặc organizationId
  title: text('title').notNull(),
  message: text('message').notNull(),
  updatedAt: timestamp('updated_at', { mode: 'date' })
    .defaultNow()
    .$onUpdate(() => new Date())
    .notNull(),
  createdAt: timestamp('created_at', { mode: 'date' }).defaultNow().notNull(),
});
```

## 🗄️ GIAI ĐOẠN 1: DATABASE LAYER VỚI DRIZZLE ORM

### 1.1 Database Operations với Drizzle

#### Files cần tạo:
- `src/libs/queries/todo.ts` - Drizzle queries cho todo operations
- `src/types/todo.ts` - TypeScript interfaces cho todo

#### Drizzle Query Functions:
```typescript
// Các functions sẽ implement trong src/libs/queries/todo.ts:
- createTodo(data: CreateTodoInput): Promise<Todo>
- getTodosByOwner(ownerId: string, pagination?: PaginationOptions): Promise<Todo[]>
- getTodoById(id: number, ownerId: string): Promise<Todo | null>
- updateTodo(id: number, ownerId: string, data: UpdateTodoInput): Promise<Todo>
- deleteTodo(id: number, ownerId: string): Promise<boolean>
- getTodoStats(ownerId: string): Promise<TodoStats>
```

#### Multi-tenancy Support:
- `ownerId` có thể là **userId** (personal todos) hoặc **organizationId** (team todos)
- Implement logic để xử lý cả 2 cases

### 1.2 Database Migrations (Nếu cần)
- Schema đã có sẵn, chỉ cần update nếu có thay đổi
- Sử dụng `npm run db:generate` để tạo migration mới
- Migration tự động apply khi có DB interaction

## 🔌 GIAI ĐOẠN 2: API LAYER

### 2.1 API Routes Structure (Next.js App Router)

#### Files cần tạo:
- `src/app/api/todos/route.ts` - GET (list), POST (create)
- `src/app/api/todos/[id]/route.ts` - GET (single), PUT (update), DELETE
- `src/app/api/todos/stats/route.ts` - GET statistics

#### API Authentication Pattern với Clerk:
```typescript
// Pattern cho mỗi API route:
import { auth } from '@clerk/nextjs/server';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const { userId, orgId } = auth();

  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Use userId for personal todos, orgId for organization todos
  const ownerId = orgId || userId;

  // Drizzle query here...
}
```

#### Response Format theo Yamato-SaaS Convention:
```typescript
// Success Response
{
  success: true,
  data: any,
  message?: string,
  pagination?: {
    page: number,
    limit: number,
    total: number,
    hasMore: boolean
  }
}

// Error Response
{
  success: false,
  error: string,
  code: string,
  details?: any
}
```

### 2.2 Validation Layer với Zod

#### Files cần tạo:
- `src/libs/validations/todo.ts` - Zod schemas cho validation

#### Zod Schemas:
```typescript
// Schemas sẽ implement:
-CreateTodoSchema
- UpdateTodoSchema
- TodoListParamsSchema
- TodoIdSchema;
```

## 🎨 GIAI ĐOẠN 3: FRONTEND FEATURES

### 3.1 Features Structure (theo Yamato-SaaS pattern)

#### Files cần tạo trong `src/features/todo/`:
- `TodoList.tsx` - Hiển thị danh sách todos với pagination
- `TodoItem.tsx` - Individual todo item với actions
- `TodoForm.tsx` - Form tạo/sửa todo với React Hook Form
- `TodoStats.tsx` - Dashboard stats component
- `TodoFilters.tsx` - Search và filter functionality
- `TodoDeleteDialog.tsx` - Confirmation dialog với Shadcn UI
- `TodoSkeleton.tsx` - Loading skeleton components

#### Custom Hooks (theo pattern hiện tại):
- `src/hooks/useTodos.ts` - Todo state management
- `src/hooks/useTodoMutations.ts` - CRUD operations
- `src/hooks/useTodoFilters.ts` - Filter và search logic

### 3.2 Pages Structure với I18n

#### Files cần tạo:
- `src/app/[locale]/(auth)/dashboard/todos/page.tsx` - Main todos page
- `src/app/[locale]/(auth)/dashboard/todos/create/page.tsx` - Create todo
- `src/app/[locale]/(auth)/dashboard/todos/[id]/page.tsx` - Todo detail
- `src/app/[locale]/(auth)/dashboard/todos/[id]/edit/page.tsx` - Edit todo

#### Cập nhật files hiện có:
- `src/app/[locale]/(auth)/dashboard/layout.tsx` - Uncomment todos link
- `src/features/dashboard/DashboardHeader.tsx` - Thêm todos navigation

### 3.3 UI Components với Shadcn UI

#### Sử dụng các Shadcn components có sẵn:
- **Form components**: Form, FormField, FormItem, FormLabel, FormMessage
- **UI components**: Button, Input, Textarea, Badge, Card
- **Data display**: Table, Pagination, Skeleton
- **Feedback**: Toast, Dialog, Alert
- **Navigation**: Tabs, Dropdown Menu

#### Style theo Tailwind + Shadcn pattern:
- Sử dụng `cn()` utility từ `src/utils/Helpers.ts`
- Follow existing component patterns trong project

## 🔧 GIAI ĐOẠN 4: INTEGRATION & UTILITIES

### 4.1 API Client Layer

#### Files cần tạo:
- `src/libs/api/todos.ts` - API client functions
- `src/libs/constants/todo.ts` - Constants và enums

#### API Client với Error Handling:
```typescript
// Functions sẽ implement:
- fetchTodos(params: TodoListParams): Promise<TodosResponse>
- fetchTodo(id: number): Promise<Todo>
- createTodo(data: CreateTodoInput): Promise<Todo>
- updateTodo(id: number, data: UpdateTodoInput): Promise<Todo>
- deleteTodo(id: number): Promise<void>
- fetchTodoStats(): Promise<TodoStats>
```

### 4.2 State Management Strategy

#### Approach theo Yamato-SaaS:
- **Local state** với React hooks cho forms
- **Server state** caching nếu cần (có thể dùng SWR/React Query)
- **Context** cho global settings/filters
- **URL state** cho pagination và filters

### 4.3 Error Handling theo Project Pattern

#### Error Strategy:
- **Error boundaries** trong components
- **Toast notifications** cho user feedback
- **Loading states** với Skeleton components
- **Optimistic updates** cho better UX

## 🌐 GIAI ĐOẠN 5: INTERNATIONALIZATION

### 5.1 Translation Keys

#### Files cần cập nhật trong `src/locales/`:
- `en.json` - English translations
- `vi.json` - Vietnamese translations (nếu có)

#### Translation Keys Structure:
```json
{
  "todo": {
    "title": "Todos",
    "create": "Create Todo",
    "edit": "Edit Todo",
    "delete": "Delete Todo",
    "confirmDelete": "Are you sure you want to delete this todo?",
    "noTodos": "No todos found",
    "form": {
      "title": "Title",
      "titlePlaceholder": "Enter todo title",
      "message": "Description",
      "messagePlaceholder": "Enter todo description"
    }
  }
}
```

### 5.2 Component I18n Integration

#### Sử dụng useTranslations hook:
```typescript
import { useTranslations } from 'next-intl';

export function TodoComponent() {
  const t = useTranslations('todo');

  return <h1>{t('title')}</h1>;
}
```

## 🧪 GIAI ĐOẠN 6: TESTING STRATEGY

### 6.1 Unit Testing với Vitest

#### Files cần tạo trong `tests/`:
- `tests/libs/queries/todo.test.ts` - Database queries testing
- `tests/features/todo/TodoList.test.tsx` - Component testing
- `tests/features/todo/TodoForm.test.tsx` - Form testing
- `tests/hooks/useTodos.test.ts` - Custom hooks testing

#### Test Patterns theo Yamato-SaaS:
- Mock Clerk authentication
- Test database operations với test DB
- Component testing với React Testing Library
- Mock API responses

### 6.2 E2E Testing với Playwright

#### Files cần tạo:
- `tests/e2e/todo-crud.spec.ts` - End-to-end todo CRUD flow
- `tests/e2e/todo-permissions.spec.ts` - Permission testing

#### E2E Test Scenarios:
- Complete todo creation flow
- Todo editing và deletion
- Multi-tenancy permissions
- Authentication redirects

### 6.3 API Testing

#### Files cần tạo:
- `tests/api/todos.test.ts` - API endpoints testing

#### API Test Cases:
- CRUD operations với valid/invalid data
- Authentication và authorization
- Validation errors
- Database constraints

## 📊 GIAI ĐOẠN 7: PERFORMANCE & OPTIMIZATION

### 7.1 Database Optimization

#### Drizzle ORM Best Practices:
- **Prepared statements** cho repeated queries
- **Proper indexing** trên owner_id column
- **Query optimization** với select specific fields
- **Connection pooling** configuration

### 7.2 Frontend Optimization

#### React Optimization:
- **Component memoization** với React.memo
- **Callback memoization** với useCallback
- **Value memoization** với useMemo
- **Code splitting** với dynamic imports

#### Data Loading:
- **Pagination** implementation
- **Infinite scroll** nếu cần
- **Skeleton loading** states
- **Error boundary** fallbacks

## 🚀 GIAI ĐOẠN 8: DEPLOYMENT & MONITORING

### 8.1 Environment Configuration

#### Environment Variables (đã có sẵn):
```
DATABASE_URL=
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=
CLERK_SECRET_KEY=
```

### 8.2 Database Migrations

#### Migration Workflow:
```bash
# Sau khi update schema
npm run db:generate  # Generate migration
# Migration tự động apply khi có DB interaction
```

### 8.3 Code Quality Checks

#### Pre-commit Workflow:
```bash
npm run check-types    # TypeScript checking
npm run lint          # ESLint checking
npm run lint:fix      # Auto-fix issues
npm run test          # Run unit tests
npm run commit        # Standardized commit
```

## 🎯 IMPLEMENTATION ORDER & TIMELINE

### Week 1: Foundation & Database
1. **Day 1-2**: Database queries với Drizzle ORM
2. **Day 3-4**: API routes với Clerk authentication
3. **Day 5**: Validation schemas và error handling

### Week 2: Core Frontend Features
1. **Day 1-2**: Basic todo components với Shadcn UI
2. **Day 3-4**: Forms với React Hook Form
3. **Day 5**: State management và API integration

### Week 3: Advanced Features & I18n
1. **Day 1-2**: Pagination, filtering, search
2. **Day 3-4**: Multi-tenancy support
3. **Day 5**: Internationalization integration

### Week 4: Testing & Polish
1. **Day 1-2**: Unit tests với Vitest
2. **Day 3**: E2E tests với Playwright
3. **Day 4**: Performance optimization
4. **Day 5**: Documentation và deployment prep

## 🔍 SUCCESS CRITERIA

### Functional Requirements:
- ✅ Users có thể CRUD todos trong personal/org context
- ✅ Multi-tenancy hoạt động đúng (personal vs organization todos)
- ✅ All operations được protect bằng Clerk auth
- ✅ UI responsive và accessible
- ✅ I18n support cho multiple languages

### Technical Requirements:
- ✅ Follow Yamato-SaaS code conventions
- ✅ Sử dụng Drizzle ORM cho tất cả DB operations
- ✅ Shadcn UI components và patterns
- ✅ TypeScript strict mode compliance
- ✅ Test coverage > 80% cho critical paths

### User Experience Requirements:
- ✅ Smooth loading states với skeletons
- ✅ Optimistic updates cho instant feedback
- ✅ Error handling với user-friendly messages
- ✅ Mobile-responsive design
- ✅ Keyboard navigation support

## 🚨 RISK MITIGATION

### Technical Risks:
- **Drizzle ORM learning curve**: Use existing patterns từ project
- **Multi-tenancy complexity**: Start với simple approach, iterate
- **Performance với large datasets**: Implement pagination từ đầu

### Integration Risks:
- **Clerk auth edge cases**: Thorough testing với mock/real auth
- **I18n integration**: Follow existing patterns trong project
- **Shadcn UI customization**: Stick to existing component patterns

### Timeline Risks:
- **Scope creep**: Focus on MVP first, enhance later
- **Testing overhead**: Parallel development và testing
- **Migration issues**: Test migrations trong staging environment

## 📋 DEPENDENCIES & PREREQUISITES

### Required Tools (đã có sẵn):
- ✅ Drizzle ORM setup
- ✅ Clerk authentication
- ✅ Shadcn UI components
- ✅ Next.js App Router
- ✅ TypeScript configuration
- ✅ Testing infrastructure (Vitest, Playwright)

### External Dependencies cần thêm:
- Có thể cần thêm libraries cho enhanced UX (SWR, React Query) - optional

## 🎭 DEVELOPMENT WORKFLOW

### Daily Workflow:
1. **Code changes** theo feature branch
2. **Type checking**: `npm run check-types`
3. **Linting**: `npm run lint:fix`
4. **Testing**: `npm run test`
5. **Migration** (nếu có schema changes): `npm run db:generate`
6. **Commit**: `npm run commit` với conventional commits
7. **Push** và create PR

### Code Review Checklist:
- ✅ TypeScript types properly defined
- ✅ Components follow Shadcn UI patterns
- ✅ I18n keys properly used
- ✅ Error handling implemented
- ✅ Tests written cho new functionality
- ✅ Performance considerations addressed
