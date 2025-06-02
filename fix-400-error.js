/**
 * FIX: 400 Bad Request Issue cho Todo API
 * 
 * VẤN ĐỀ: 
 * - searchParams.get() trả về null cho missing parameters
 * - Zod schema không handle null values đúng với .default()
 * - Validation thất bại cho các parameters không có trong URL
 * 
 * GIẢI PHÁP:
 * 1. Update validation logic trong API route
 * 2. Hoặc update validation schema để handle null values
 */

// ========================================
// SOLUTION 1: Fix API Route (KHUYẾN NGHỊ)
// ========================================

/**
 * REPLACE src/app/api/todos/route.ts GET function với code dưới đây:
 */

export async function GET(request: NextRequest): Promise<NextResponse<TodosResponse | TodoErrorResponse>> {
  try {
    const { userId, orgId } = await auth();

    if (!userId) {
      return NextResponse.json(
        {
          success: false,
          error: 'Unauthorized',
          code: 'UNAUTHORIZED',
        },
        { status: 401 },
      );
    }

    // Use orgId for organization todos, fallback to userId for personal todos
    const ownerId = orgId || userId;

    // FIX: Parse and validate query parameters with proper null handling
    const { searchParams } = new URL(request.url);
    
    // FIX: Convert null to undefined for optional parameters
    const queryParams = {
      page: searchParams.get('page') || undefined,
      limit: searchParams.get('limit') || undefined,  
      search: searchParams.get('search') || undefined,
      sortBy: searchParams.get('sortBy') || undefined,
      sortOrder: searchParams.get('sortOrder') || undefined,
    };

    console.log('🔍 Query params before validation:', queryParams);

    const validatedParams = { ...validateTodoListParams(queryParams), ownerId };
    
    console.log('✅ Validated params:', validatedParams);

    // Get paginated todos
    const result = await getPaginatedTodos(validatedParams);

    return NextResponse.json({
      success: true,
      data: result.todos,
      pagination: result.pagination,
    });
  } catch (error) {
    console.error('Error fetching todos:', error);

    if (error instanceof ZodError) {
      console.error('Validation errors:', error.errors);
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid request parameters',
          code: 'VALIDATION_ERROR',
          details: error.errors,
        },
        { status: 400 },
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
        code: 'INTERNAL_ERROR',
      },
      { status: 500 },
    );
  }
}

// ========================================
// SOLUTION 2: Fix Validation Schema
// ========================================

/**
 * HOẶC update src/libs/validations/todo.ts với schema này:
 */

export const TodoListParamsSchema = z.object({
  page: z.union([
    z.string().transform(val => parseInt(val, 10)),
    z.number(),
    z.undefined()
  ]).pipe(z.number().int().min(1, 'Page must be at least 1').default(1)),
  
  limit: z.union([
    z.string().transform(val => parseInt(val, 10)),
    z.number(), 
    z.undefined()
  ]).pipe(z.number().int().min(1, 'Limit must be at least 1').max(100, 'Limit cannot exceed 100').default(10)),
  
  search: z.union([z.string(), z.undefined()]).optional(),
  
  sortBy: z.union([
    z.enum(['createdAt', 'updatedAt', 'title']),
    z.undefined()
  ]).default('createdAt'),
  
  sortOrder: z.union([
    z.enum(['asc', 'desc']),
    z.undefined()  
  ]).default('desc'),
});

// ========================================
// SOLUTION 3: Alternative API Approach
// ========================================

/**
 * Hoặc dùng approach này trong API route:
 */

// Parse and validate query parameters with explicit defaults
const page = parseInt(searchParams.get('page') || '1', 10);
const limit = parseInt(searchParams.get('limit') || '10', 10);
const search = searchParams.get('search') || undefined;
const sortBy = searchParams.get('sortBy') || 'createdAt';
const sortOrder = searchParams.get('sortOrder') || 'desc';

const queryParams = {
  page: isNaN(page) ? 1 : page,
  limit: isNaN(limit) ? 10 : limit,
  search,
  sortBy: ['createdAt', 'updatedAt', 'title'].includes(sortBy) ? sortBy : 'createdAt',
  sortOrder: ['asc', 'desc'].includes(sortOrder) ? sortOrder : 'desc',
};

// Validate the cleaned params
const validatedParams = { ...validateTodoListParams(queryParams), ownerId };