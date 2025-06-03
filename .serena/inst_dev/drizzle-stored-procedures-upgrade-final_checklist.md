# Implementation Checklist: Drizzle Stored Procedures Upgrade (FINAL CORRECTED)

## Pre-Implementation Audit ✅ COMPLETED

### Code Review & Validation
- [x] Analyzed current API endpoints và function signatures
- [x] Verified TodoStats type structure (total, today, thisWeek, thisMonth)
- [x] Confirmed database schema fields (snake_case: owner_id, created_at, updated_at)
- [x] Identified missing todoExists function coverage
- [x] Validated current API response formats
- [x] Confirmed zero breaking changes requirement

## Phase 1: Database Stored Procedures Creation (8 Procedures)

### Setup & Structure
- [ ] Tạo folder structure `src/database/procedures/todos/`
- [ ] Setup SQL formatting và validation tools
- [ ] Create base procedure template với exact PostgreSQL syntax

### Core Stored Procedures - EXACT SIGNATURE MATCH

- [ ] **1. `todo_exists.sql`** - SIMPLEST - START HERE ⭐
  - [ ] Write PostgreSQL function: `todo_exists(p_todo_id INTEGER, p_owner_id TEXT) RETURNS BOOLEAN`
  - [ ] Implement simple EXISTS query với ownership check
  - [ ] Test với sample data
  - [ ] Verify exact boolean return
  
- [ ] **2. `get_todo_by_id.sql`** - Single record retrieval
  - [ ] Write function: `get_todo_by_id(p_todo_id INTEGER, p_owner_id TEXT)`
  - [ ] Return exact table structure: (id, owner_id, title, message, created_at, updated_at)
  - [ ] Add ownership security check
  - [ ] Test authorization scenarios (found/not found/unauthorized)
  - [ ] Verify NULL return for unauthorized access
  
- [ ] **3. `get_todos_count.sql`** - Count với search
  - [ ] Write function: `get_todos_count(p_owner_id TEXT, p_search TEXT DEFAULT NULL) RETURNS INTEGER`
  - [ ] Implement exact same search logic as current getTodosCount
  - [ ] Test với various search terms
  - [ ] Verify count accuracy với large datasets
  
- [ ] **4. `create_todo.sql`** - Todo creation
  - [ ] Write function: `create_todo(p_owner_id TEXT, p_title TEXT, p_message TEXT)`
  - [ ] Return newly created record với all fields
  - [ ] Handle auto-generated id, created_at, updated_at
  - [ ] Add input validation và sanitization
  - [ ] Test creation flow end-to-end
  
- [ ] **5. `update_todo.sql`** - Todo update với ownership
  - [ ] Write function: `update_todo(p_todo_id INTEGER, p_owner_id TEXT, p_title TEXT, p_message TEXT)`
  - [ ] Return updated record hoặc empty set if unauthorized
  - [ ] Update updated_at timestamp automatically
  - [ ] Test ownership verification
  - [ ] Test concurrent update scenarios
  
- [ ] **6. `delete_todo.sql`** - Todo deletion
  - [ ] Write function: `delete_todo(p_todo_id INTEGER, p_owner_id TEXT) RETURNS BOOLEAN`
  - [ ] Return boolean success status
  - [ ] Add ownership verification
  - [ ] Test deletion scenarios
  - [ ] Verify false return for unauthorized attempts
  
- [ ] **7. `get_todo_stats.sql`** - EXACT TYPE MATCH ⚠️
  - [ ] Write function: `get_todo_stats(p_owner_id TEXT)`
  - [ ] Return EXACT fields: (total, today, this_week, this_month) ← Note field names
  - [ ] Match current getTodoStats implementation exactly
  - [ ] Calculate statistics như current implementation
  - [ ] Test với different data volumes
  
- [ ] **8. `get_paginated_todos.sql`** - MOST COMPLEX - DO LAST
  - [ ] Write function: `get_paginated_todos(p_owner_id TEXT, p_page INTEGER, p_limit INTEGER, p_search TEXT, p_sort_by TEXT, p_sort_order TEXT)`
  - [ ] Return records với total_count field
  - [ ] Implement exact pagination logic
  - [ ] Support search (title + message ILIKE)
  - [ ] Support sorting (createdAt, updatedAt, title)
  - [ ] Match current getPaginatedTodos behavior exactly

### Database Migration & Testing
- [ ] Create migration script `001_create_todo_procedures.sql`
- [ ] Create rollback script `002_drop_todo_procedures.sql`  
- [ ] Test migration trên local database
- [ ] Verify all 8 procedures created successfully
- [ ] Test each procedure individually với psql
- [ ] Create performance indexes for optimization

## Phase 2: TypeScript Wrapper Functions - EXACT SIGNATURE MATCH

### Types & Interfaces - NO CHANGES TO EXISTING TYPES
- [ ] Create `src/libs/procedures/types.ts`
- [ ] Import existing types: `TodoDb`, `TodoListParams`, `TodoStats`, `CreateTodoInput`, `UpdateTodoInput`
- [ ] ⚠️ DO NOT modify existing types - must maintain exact compatibility
- [ ] Add internal transformation types for database mapping

### Wrapper Functions - CALL PROCEDURES ONLY
- [ ] Create `src/libs/procedures/todos.ts`

#### Individual Wrapper Functions
- [ ] **`callTodoExists(id: number, ownerId: string): Promise<boolean>`**
  ```typescript
  const result = await db.execute(sql`SELECT todo_exists(${id}, ${ownerId}) as exists`);
  return result[0]?.exists || false;
  ```
  
- [ ] **`callGetTodoById(id: number, ownerId: string): Promise<TodoDb | null>`**
  ```typescript
  const result = await db.execute(sql`SELECT * FROM get_todo_by_id(${id}, ${ownerId})`);
  return rows.length > 0 ? transformTodoRow(rows[0]) : null;
  ```
  
- [ ] **`callGetTodosCount(ownerId: string, search?: string): Promise<number>`**
  ```typescript
  const result = await db.execute(sql`SELECT get_todos_count(${ownerId}, ${search || null}) as count`);
  return result[0]?.count || 0;
  ```
  
- [ ] **`callCreateTodo(data: CreateTodoInput): Promise<TodoDb>`**
  ```typescript
  const result = await db.execute(sql`SELECT * FROM create_todo(${data.ownerId}, ${data.title}, ${data.message})`);
  return transformTodoRow(result[0]);
  ```
  
- [ ] **`callUpdateTodo(id: number, ownerId: string, data: UpdateTodoInput): Promise<TodoDb>`**
  ```typescript
  const result = await db.execute(sql`SELECT * FROM update_todo(${id}, ${ownerId}, ${data.title}, ${data.message})`);
  if (rows.length === 0) throw new Error('Todo not found or access denied');
  return transformTodoRow(rows[0]);
  ```
  
- [ ] **`callDeleteTodo(id: number, ownerId: string): Promise<boolean>`**
  ```typescript
  const result = await db.execute(sql`SELECT delete_todo(${id}, ${ownerId}) as success`);
  return result[0]?.success || false;
  ```
  
- [ ] **`callGetTodoStats(ownerId: string): Promise<TodoStats>`** ⚠️ CRITICAL TYPE MATCH
  ```typescript
  const result = await db.execute(sql`SELECT * FROM get_todo_stats(${ownerId})`);
  return {
    total: stats.total,
    today: stats.today,
    thisWeek: stats.this_week,    // ← Note: DB snake_case to camelCase
    thisMonth: stats.this_month,  // ← Note: DB snake_case to camelCase
  };
  ```
  
- [ ] **`callGetPaginatedTodos(params: TodoListParams): Promise<{todos: TodoDb[]; pagination: {...}}>`**
  ```typescript
  const result = await db.execute(sql`SELECT * FROM get_paginated_todos(...)`);
  return transformPaginatedResult(result, params);
  ```

### Data Transformation & Error Handling
- [ ] Implement `transformTodoRow(row: any): TodoDb` function
  ```typescript
  // Convert snake_case to camelCase
  return {
    id: row.id,
    ownerId: row.owner_id,      // ← snake_case to camelCase
    title: row.title,
    message: row.message,
    createdAt: row.created_at,  // ← snake_case to camelCase
    updatedAt: row.updated_at,  // ← snake_case to camelCase
  };
  ```
- [ ] Add comprehensive error handling cho procedure calls
- [ ] Handle database connection errors
- [ ] Add logging và debugging support
- [ ] Create `src/libs/procedures/index.ts` exports

### Testing Wrapper Functions
- [ ] Unit tests cho each wrapper function
- [ ] Test error scenarios (invalid parameters, database errors)
- [ ] Integration tests với actual database và procedures
- [ ] Performance baseline measurements
- [ ] Test type safety và parameter validation

## Phase 3: Query Layer Update với Feature Flags - ZERO API CHANGES

### Feature Flag Implementation
- [ ] Add environment variable `USE_STORED_PROCEDURES=false` to `.env`
- [ ] Create feature flag utility function
- [ ] Add fallback mechanism to original query builder

### Update src/libs/queries/todo.ts - MAINTAIN EXACT SIGNATURES
- [ ] **NO CHANGES to function signatures** - API compatibility required
- [ ] Import stored procedure wrapper functions
- [ ] Add feature flag checks trong each function

#### Update Individual Functions
- [ ] **`todoExists(id: number, ownerId: string): Promise<boolean>`**
  ```typescript
  if (useStoredProcedures()) return await callTodoExists(id, ownerId);
  // Fallback to original implementation
  ```
  
- [ ] **`getTodoById(id: number, ownerId: string): Promise<TodoDb | null>`**
  ```typescript
  if (useStoredProcedures()) return await callGetTodoById(id, ownerId);
  // Fallback to original implementation  
  ```
  
- [ ] **`getTodosCount(ownerId: string, search?: string): Promise<number>`**
  ```typescript
  if (useStoredProcedures()) return await callGetTodosCount(ownerId, search);
  // Fallback to original implementation
  ```
  
- [ ] **`createTodo(data: CreateTodoInput): Promise<TodoDb>`**
  ```typescript
  if (useStoredProcedures()) return await callCreateTodo(data);
  // Fallback to original implementation
  ```
  
- [ ] **`updateTodo(id: number, ownerId: string, data: UpdateTodoInput): Promise<TodoDb>`**
  ```typescript
  if (useStoredProcedures()) return await callUpdateTodo(id, ownerId, data);
  // Fallback to original implementation
  ```
  
- [ ] **`deleteTodo(id: number, ownerId: string): Promise<boolean>`**
  ```typescript
  if (useStoredProcedures()) return await callDeleteTodo(id, ownerId);
  // Fallback to original implementation
  ```
  
- [ ] **`getTodoStats(ownerId: string): Promise<TodoStats>`**
  ```typescript
  if (useStoredProcedures()) return await callGetTodoStats(ownerId);
  // Fallback to original implementation
  ```
  
- [ ] **`getPaginatedTodos(params: TodoListParams): Promise<{...}>`**
  ```typescript
  if (useStoredProcedures()) return await callGetPaginatedTodos(params);
  // Fallback to original implementation (getTodosByOwner + getTodosCount)
  ```

### Backward Compatibility Verification
- [ ] Maintain original query builder implementation as fallback
- [ ] Test both implementations work correctly
- [ ] Add logging để track which implementation is used
- [ ] Performance comparison between both approaches
- [ ] Verify EXACT same return types và values

## Phase 4: API Endpoints - NO CHANGES REQUIRED ✅

### IMPORTANT: NO API ENDPOINT CHANGES NEEDED
- [ ] ✅ **`src/app/api/todos/route.ts`** - NO CHANGES (uses getPaginatedTodos, createTodo)
- [ ] ✅ **`src/app/api/todos/[id]/route.ts`** - NO CHANGES (uses getTodoById, updateTodo, deleteTodo)
- [ ] ✅ **`src/app/api/todos/stats/route.ts`** - NO CHANGES (uses getTodoStats)

### Verification Only
- [ ] Verify API endpoints work với stored procedures enabled
- [ ] Test all HTTP methods (GET, POST, PUT, DELETE)
- [ ] Verify exact same response formats
- [ ] Test error handling remains unchanged
- [ ] Confirm authentication flows unchanged

## Phase 5: Testing & Validation

### Database Testing
- [ ] Test stored procedures directly trong PostgreSQL
- [ ] Performance testing với large datasets (>10k records)
- [ ] Concurrent access testing (multiple users)
- [ ] Data integrity verification
- [ ] Error handling testing

### Integration Testing  
- [ ] End-to-end API testing với stored procedures enabled
- [ ] Test complete Todo CRUD flow
- [ ] Test pagination với different parameters
- [ ] Test search functionality
- [ ] Test sorting functionality
- [ ] Test error scenarios và edge cases

### Feature Flag Testing
- [ ] Test với `USE_STORED_PROCEDURES=false` (fallback mode)
- [ ] Test với `USE_STORED_PROCEDURES=true` (stored procedures mode)
- [ ] Verify identical behavior between both modes
- [ ] Test switching between modes dynamically

### Performance Testing
- [ ] Benchmark current implementation (baseline)
- [ ] Benchmark stored procedures implementation
- [ ] Compare query execution times
- [ ] Measure database CPU usage
- [ ] Test concurrent user load
- [ ] Memory usage analysis

### Security Testing
- [ ] SQL injection testing (should be prevented by stored procedures)
- [ ] Authorization testing (ownership checks)
- [ ] Input validation testing
- [ ] Data sanitization verification

### Compatibility Testing
- [ ] Test với existing frontend applications
- [ ] Verify API contracts unchanged
- [ ] Test error response formats match exactly
- [ ] Verify pagination behavior identical
- [ ] Test TodoStats type compatibility

## Phase 6: Environment & Configuration

### Environment Variables
- [ ] Add `USE_STORED_PROCEDURES=false` to `.env` (development)
- [ ] Add `USE_STORED_PROCEDURES=false` to `.env.production` (initially)
- [ ] Document environment variable trong README
- [ ] Add validation for environment variable values

### Database Configuration
- [ ] Verify stored procedures permissions
- [ ] Set up monitoring for procedure execution
- [ ] Configure logging for procedure calls
- [ ] Set up alerting for procedure errors

## Phase 7: Deployment Strategy

### Staging Deployment
- [ ] Deploy stored procedures to staging database
- [ ] Deploy application code với feature flag OFF
- [ ] Test end-to-end functionality trong staging
- [ ] Enable feature flag trong staging
- [ ] Performance testing trong staging environment
- [ ] Load testing với realistic data volumes

### Production Deployment - Gradual Rollout
- [ ] **Step 1**: Deploy stored procedures to production database
- [ ] **Step 2**: Deploy application code với `USE_STORED_PROCEDURES=false`
- [ ] **Step 3**: Monitor system stability for 24-48 hours
- [ ] **Step 4**: Enable stored procedures for 10% of requests
- [ ] **Step 5**: Monitor performance và error rates
- [ ] **Step 6**: Gradually increase to 50%, then 100%
- [ ] **Step 7**: Full rollout after validation

### Monitoring & Alerting
- [ ] Set up procedure execution time monitoring
- [ ] Monitor error rates và patterns
- [ ] Track query performance metrics
- [ ] Set up alerting cho performance degradation
- [ ] Monitor database resource usage

## Phase 8: Documentation & Maintenance

### Technical Documentation
- [ ] Document each stored procedure với examples
- [ ] Update API documentation (no changes but mention performance improvements)
- [ ] Create troubleshooting guide for stored procedures
- [ ] Document feature flag usage
- [ ] Performance improvement documentation

### Operational Documentation
- [ ] Create deployment checklist
- [ ] Document rollback procedures
- [ ] Create monitoring runbook
- [ ] Train support team on new architecture
- [ ] Document debugging procedures

## Final Validation Checklist

### Functional Validation
- [ ] All Todo functionality works exactly as before
- [ ] Performance meets hoặc exceeds expectations (target: 20-30% improvement)
- [ ] No data corruption hoặc loss
- [ ] Security requirements maintained
- [ ] Error handling works correctly
- [ ] API response formats unchanged

### Technical Validation
- [ ] All 8 stored procedures execute correctly
- [ ] All 8 wrapper functions handle scenarios properly
- [ ] Feature flags work correctly
- [ ] Fallback mechanism works properly
- [ ] Type safety maintained throughout

### Business Validation
- [ ] User experience unchanged
- [ ] Performance improvements measurable
- [ ] System reliability maintained hoặc improved
- [ ] Support team can troubleshoot issues
- [ ] Zero customer-facing disruptions

## Post-Implementation Cleanup

### Code Cleanup (After Successful Rollout)
- [ ] Remove fallback code after 30 days of stable operation
- [ ] Clean up unused query builder functions
- [ ] Update dependencies nếu needed
- [ ] Remove feature flag environment variables
- [ ] Update documentation to reflect stored procedures as primary

### Performance Optimization
- [ ] Analyze stored procedure performance trong production
- [ ] Optimize slow procedures based on real usage
- [ ] Add additional indexes nếu needed
- [ ] Plan future stored procedures for other features

### Continuous Monitoring
- [ ] Set up long-term performance tracking
- [ ] Monitor error rates và patterns ongoing
- [ ] Track database resource usage trends
- [ ] Plan future optimizations

## Success Metrics

### Performance Metrics
- [ ] Average API response time improved by 20-30%
- [ ] Database CPU usage reduced by 15-25%
- [ ] Query execution time improved by 20-30%
- [ ] No increase trong error rates
- [ ] System uptime maintained at 99.9%+

### Quality Metrics
- [ ] Zero breaking changes to APIs
- [ ] 100% test coverage for stored procedures
- [ ] Zero data integrity issues
- [ ] Successful rollback capability demonstrated
- [ ] Documentation completeness achieved

---

**Implementation Priority Order:**
1. ⭐ **Start với `todo_exists`** (simplest)
2. **Then `get_todo_by_id`** (single record)
3. **Then `get_todos_count`** (simple aggregation)
4. **Then `create_todo`** (basic insert)
5. **Then `update_todo`** (basic update)
6. **Then `delete_todo`** (basic delete)
7. **Then `get_todo_stats`** (multiple aggregations)
8. **Finally `get_paginated_todos`** (most complex)

**Critical Success Factor:** Maintain EXACT compatibility với existing API contracts và types.