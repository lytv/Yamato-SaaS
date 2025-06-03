# Hướng dẫn triển khai API CRUD cho Todos

## Tổng quan
Dự án Yamato-SaaS đã có sẵn một hệ thống API CRUD cho todos được triển khai theo chuẩn TypeScript Type Safety và Test-Driven Development. Hướng dẫn này sẽ giải thích chi tiết về cách thức triển khai và cấu trúc code.

## Cấu trúc thư mục API
```
src/app/api/todos/
├── route.ts                 # GET (list todos), POST (create todo)
├── [id]/
│   └── route.ts            # GET (single todo), PUT (update), DELETE
└── stats/
    └── route.ts            # GET (todo statistics)
```

## Kiến trúc và Patterns sử dụng

### 1. Authentication với Clerk
- Mọi API endpoint đều được bảo vệ bằng Clerk authentication
- Sử dụng `auth()` helper từ `@clerk/nextjs/server`
- Hỗ trợ cả personal todos (userId) và organization todos (orgId)

### 2. Type Safety với TypeScript
- Tất cả request/response đều có type annotations rõ ràng
- Sử dụng Zod cho validation
- Error responses có cấu trúc nhất quán

### 3. Error Handling Pattern
- Structured error responses với codes
- Proper HTTP status codes
- ZodError handling cho validation errors
- Generic error handling cho unexpected errors

## Chi tiết triển khai từng endpoint

### 1. GET /api/todos - Lấy danh sách todos
**Features:**
- Pagination support
- Search functionality
- Sorting options
- Query parameter validation
- Owner-based filtering (orgId/userId)

**Request Parameters:**
- `page`: số trang (optional)
- `limit`: số lượng items per page (optional)
- `search`: tìm kiếm theo title/description (optional)
- `sortBy`: field để sort (optional)
- `sortOrder`: asc/desc (optional)

**Response Structure:**
```typescript
{
  success: true,
  data: Todo[],
  pagination: {
    total: number,
    page: number,
    limit: number,
    totalPages: number
  }
}
```

### 2. POST /api/todos - Tạo todo mới
**Features:**
- Input validation với Zod
- Auto-assign owner (orgId hoặc userId)
- Return created todo with 201 status

**Request Body:**
```typescript
{
  title: string,
  description?: string,
  priority?: 'low' | 'medium' | 'high',
  dueDate?: string (ISO date)
}
```

### 3. GET /api/todos/[id] - Lấy todo theo ID
**Features:**
- ID validation
- Ownership check
- 404 handling khi không tìm thấy

### 4. PUT /api/todos/[id] - Cập nhật todo
**Features:**
- Partial update support
- Ownership verification
- Input validation
- Optimistic concurrency control

**Request Body:** Partial Todo object

### 5. DELETE /api/todos/[id] - Xóa todo
**Features:**
- Ownership verification
- Soft delete hoặc hard delete (tùy business logic)
- Return success message

### 6. GET /api/todos/stats - Thống kê todos
**Features:**
- Aggregated statistics
- Owner-based filtering
- Performance optimized queries

## Database Layer

### Todo Model Structure
```typescript
interface Todo {
  id: string;
  title: string;
  description?: string;
  completed: boolean;
  priority: 'low' | 'medium' | 'high';
  dueDate?: Date;
  ownerId: string;  // userId hoặc orgId
  createdAt: Date;
  updatedAt: Date;
}
```

### Service Layer Functions
- `getPaginatedTodos(params)`: Pagination và filtering
- `getTodoById(id, ownerId)`: Lấy single todo
- `createTodo(data)`: Tạo todo mới
- `updateTodo(id, ownerId, data)`: Update todo
- `deleteTodo(id, ownerId)`: Xóa todo
- `getTodoStats(ownerId)`: Thống kê

## Validation Schemas (Zod)

### Input Validation
```typescript
const createTodoSchema = z.object({
  title: z.string().min(1).max(255),
  description: z.string().optional(),
  priority: z.enum(['low', 'medium', 'high']).optional(),
  dueDate: z.string().datetime().optional()
});

const updateTodoSchema = createTodoSchema.partial();

const todoListParamsSchema = z.object({
  page: z.coerce.number().min(1).optional(),
  limit: z.coerce.number().min(1).max(100).optional(),
  search: z.string().optional(),
  sortBy: z.enum(['title', 'createdAt', 'dueDate', 'priority']).optional(),
  sortOrder: z.enum(['asc', 'desc']).optional()
});
```

## Response Type Definitions
```typescript
interface TodoResponse {
  success: true;
  data: Todo;
  message?: string;
}

interface TodosResponse {
  success: true;
  data: Todo[];
  pagination: PaginationInfo;
}

interface TodoErrorResponse {
  success: false;
  error: string;
  code: string;
  details?: any;
}
```

## Testing Strategy (TDD)

### Test Structure
```
tests/
├── api/
│   └── todos/
│       ├── route.test.ts
│       ├── [id]/
│       │   └── route.test.ts
│       └── stats/
│           └── route.test.ts
└── services/
    └── todo.service.test.ts
```

### Test Categories
1. **Unit Tests**: Service layer functions
2. **Integration Tests**: API endpoints with database
3. **Authentication Tests**: Clerk integration
4. **Validation Tests**: Zod schema validation
5. **Error Handling Tests**: Different error scenarios

### Example Test Case
```typescript
describe('POST /api/todos', () => {
  it('should create a new todo with valid data', async () => {
    // Arrange
    const todoData = {
      title: 'Test Todo',
      description: 'Test Description',
      priority: 'high' as const
    };

    // Act
    const response = await request(app)
      .post('/api/todos')
      .set('Authorization', `Bearer ${validToken}`)
      .send(todoData);

    // Assert
    expect(response.status).toBe(201);
    expect(response.body.success).toBe(true);
    expect(response.body.data.title).toBe(todoData.title);
  });
});
```

## Security Considerations

### 1. Authentication
- Tất cả endpoints require authentication
- Token validation với Clerk
- Session management

### 2. Authorization
- Owner-based access control
- Organization-level permissions
- Resource-level security

### 3. Input Validation
- SQL injection prevention
- XSS protection
- Rate limiting (có thể implement)

## Performance Optimizations

### 1. Database Queries
- Indexing trên ownerId, createdAt
- Pagination để tránh large datasets
- Selective field loading

### 2. Caching Strategy
- Response caching cho stats endpoint
- Database query result caching
- Cache invalidation on updates

### 3. API Response
- Consistent response structure
- Minimal data transfer
- Compression support

## Error Codes Reference
- `UNAUTHORIZED`: 401 - Không có quyền truy cập
- `VALIDATION_ERROR`: 400 - Dữ liệu đầu vào không hợp lệ
- `NOT_FOUND`: 404 - Todo không tồn tại
- `CREATE_ERROR`: 400 - Lỗi khi tạo todo
- `UPDATE_ERROR`: 400 - Lỗi khi update todo
- `DELETE_ERROR`: 400 - Lỗi khi xóa todo
- `INTERNAL_ERROR`: 500 - Lỗi server

## Best Practices được áp dụng

### 1. Code Organization
- Separation of concerns
- Service layer pattern
- Consistent naming conventions

### 2. Type Safety
- Strict TypeScript configuration
- No `any` types
- Comprehensive type definitions

### 3. Error Handling
- Structured error responses
- Appropriate HTTP status codes
- Detailed error messages for debugging

### 4. Testing
- Test-first development
- High code coverage (>80%)
- Multiple test scenarios

## Deployment Considerations

### Environment Variables
```env
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=
CLERK_SECRET_KEY=
DATABASE_URL=
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
```

### Production Setup
- Database connection pooling
- Proper logging setup
- Monitoring và alerting
- Performance metrics

## Mở rộng tương lai

### Potential Enhancements
1. Bulk operations (create/update/delete multiple todos)
2. Todo categories/tags
3. Due date reminders
4. File attachments
5. Todo sharing/collaboration
6. Advanced filtering options
7. Export functionality
8. Mobile API optimizations

Hướng dẫn này cung cấp foundation vững chắc cho việc triển khai và maintain API CRUD cho todos trong dự án Yamato-SaaS.