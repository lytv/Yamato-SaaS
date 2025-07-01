# 🎯 TODOS PATTERN - QUICK REFERENCE

## 📁 **Architecture Layers (Bottom-up)**

1. **Database Schema** → Drizzle schema với `ownerId`, timestamps
2. **Types** → Separate `Db` và client types, API response types  
3. **Validation** → Zod schemas với robust null/undefined handling
4. **Database Queries** → CRUD với ownership checks, pagination
5. **API Routes** → Authentication, validation, error handling
6. **API Client** → Frontend functions để call APIs
7. **React Hooks** → Data fetching, mutations, filters
8. **React Components** → Form, List, Page components
9. **Page Integration** → Modal pattern, refresh mechanism

## 🔑 **Key Patterns**

### **Multi-tenancy**
```typescript
const ownerId = orgId || userId; // Organization > Personal
```

### **Ownership Check** (Database)
```typescript
and(eq(schema.id, id), eq(schema.ownerId, ownerId))
```

### **API Error Handling**
```typescript
{ success: boolean, error?: string, code?: string, data?: T }
```

### **Query Parameter Handling**
```typescript
// Convert null → undefined, parse numbers safely
const queryParams = {
  page: searchParams.get('page') || undefined,
  // Handle trong Zod với transform functions
};
```

### **Hook Dependencies** (Critical!)
```typescript
// ❌ Wrong - object reference changes
const params = { page, limit, search };
useCallback(() => fetch(params), [params]);

// ✅ Correct - primitive values
useCallback(() => fetch({page, limit, search}), [page, limit, search]);
```

## 📋 **Implementation Checklist**

1. **Database**: Schema với `ownerId` + timestamps
2. **Types**: Server/client types + API responses  
3. **Validation**: Zod schemas + helper functions
4. **Queries**: CRUD + ownership checks + pagination
5. **API Routes**: Auth + validation + error handling
6. **Client**: API functions với proper error handling
7. **Hooks**: Separate data/mutations/filters hooks
8. **Components**: Form (React Hook Form) + List + Page
9. **Testing**: Unit + integration + component tests

## 🛡️ **Security Essentials**

- Always authenticate với `auth()` trong API routes
- Use `orgId || userId` cho multi-tenancy
- Validate ownership trong all CRUD operations  
- Never trust client để provide `ownerId`
- Use Zod validation cho all inputs

## 📊 **File Naming Convention**

- `[feature]Schema` (database)
- `[Feature]` (client type), `[Feature]Db` (server type)
- `validate[Feature]ListParams` (validation functions)
- `get[Feature]sByOwner` (query functions)
- `fetch[Feature]s` (API client functions)
- `use[Feature]s` (data hook), `use[Feature]Mutations` (mutations hook)
- `[Feature]Form`, `[Feature]List` (components)

This pattern đảm bảo consistency, type safety, security, và maintainability across toàn bộ codebase.
