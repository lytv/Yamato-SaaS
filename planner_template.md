# Feature Implementation Planning Template

## 🎯 Context & Requirements

### Feature Information
- **Feature Name**: [FEATURE_NAME]
- **Target Audience**: [junior dev | senior dev | coding agent] có thể dựa vào để implement
- **Technical Context**: 
  [Đính kèm technical specs, database schemas, API documentation, UI mockups, etc.]

### Example:
```
Tôi muốn thiết kế và thực hiện tính năng [FEATURE_NAME] cho project hiện tại.

[Đính kèm files/context:]
- Database: [stored procedures, schemas, sample data]
- UI Design: [mockups, wireframes, design files]  
- Requirements: [functional specifications, business logic]

Plan phải giống một blueprint chi tiết để [TARGET_AUDIENCE] có thể dựa vào làm được, đủ context để một agent coding bình thường cũng làm được.
```

## 🧠 **MANDATORY THINKING PROCESS**

**CRITICAL**: Bạn PHẢI sử dụng `sequential-thinking` tool để suy nghĩ thật kỹ từng step một trước khi bắt đầu planning.

**Required Thinking Steps:**
1. Phân tích technical requirements và context
2. Xác định architecture patterns cần thiết
3. Định identify potential challenges và solutions
4. Plan implementation approach và phases
5. Determine testing strategy và quality assurance
6. Validate approach với existing codebase

## 🔍 **MANDATORY CODEBASE EXPLORATION**

**CRITICAL**: `serena:planner` tool KHÔNG tự động đọc memories. Bạn PHẢI manually explore project trước khi planning.

### Step 1: Check Project Context
```
1. serena:check_onboarding_performed
2. serena:read_memory [tech_stack.md, code_structure.md, project_purpose.md, etc.]
3. serena:list_memories (if needed)
```

### Step 2: Explore Actual Codebase
```
1. serena:list_dir (recursive) để hiểu project structure
2. serena:read_file [key files: Schema.ts, package.json, config files]
3. serena:get_symbols_overview [important directories]
4. serena:find_symbol [if needed for specific patterns]
```

### Step 3: Understand Existing Patterns
Examine existing features tương tự để understand:
- Database query patterns (Drizzle ORM, raw SQL, etc.)
- API route structures (REST, GraphQL, etc.)
- Component architecture (React, Vue, etc.)
- State management patterns
- Testing approaches
- File naming conventions

## 📝 **PLANNING REQUIREMENTS**

### Use serena:planner với detailed instructions:
```
serena:planner
feature_name: [FEATURE_NAME]-implementation
instructions: [COMPREHENSIVE_PLAN]
```

### Plan MUST Include:
1. **Architecture Analysis** - Current tech stack và patterns
2. **Implementation Phases** - Step-by-step breakdown (Day 1, Day 2, etc.)
3. **File Structure** - Exact file paths với code examples
4. **Database Layer** - Queries, schemas, validations
5. **API Layer** - Routes, controllers, error handling
6. **Frontend Layer** - Components, hooks, state management
7. **Testing Strategy** - Unit, integration, E2E tests
8. **Quality Assurance** - Code standards, performance, security

### Code Examples Required:
- TypeScript interfaces và types
- Database query examples
- API route implementations  
- Component code snippets
- Configuration files
- Test examples

## ✅ **VALIDATION & REVISION**

### Architecture Compatibility Check:
- Plan MUST match existing project architecture
- Use same patterns, libraries, và conventions
- File structure MUST follow existing organization
- Technology choices MUST align với current stack

### If Mismatch Detected:
1. Delete incorrect plan: `serena:planner feature_name: [OLD_NAME] instructions: DELETE_PLAN`
2. Re-explore codebase more thoroughly
3. Create new plan aligned với actual architecture
4. Validate again before finalizing

## 🎯 **SUCCESS CRITERIA**

### Plan Quality Requirements:
- [ ] Blueprint-level detail cho implementation
- [ ] Target audience có thể follow without confusion
- [ ] Architecture matches existing project 100%
- [ ] Includes comprehensive testing strategy
- [ ] Production-ready considerations
- [ ] Error handling và edge cases covered
- [ ] Performance optimization notes
- [ ] Security considerations included

### Deliverable Format:
- Detailed implementation plan via `serena:planner`
- Phase-by-phase breakdown với timelines
- Complete file structure với code examples
- Testing và deployment instructions
- Quality assurance checklist

## ⚠️ **CRITICAL REMINDERS**

1. **ALWAYS use sequential-thinking** để avoid rushed planning
2. **NEVER assume tech stack** - always verify với actual codebase
3. **ALWAYS explore existing patterns** before creating new ones
4. **PLAN REVISION is normal** - better to fix than deliver wrong plan
5. **TARGET AUDIENCE matters** - adjust detail level accordingly

---

**Example Usage:**
```
[Attach your specific context and files]

Bạy hãy sử dụng sequential-thinking tool để suy nghĩ từng step một, sau đó explore kỹ codebase hiện tại và sử dụng serena:planner tool để tạo một plan implementation chi tiết cho tôi.
```

## 🚀 **Cách sử dụng Template này:**

1. **Replace placeholders**: [FEATURE_NAME], [TARGET_AUDIENCE], technical context
2. **Attach relevant files**: schemas, mockups, specifications  
3. **Submit prompt**: Agent sẽ follow exact workflow này
4. **Result**: Blueprint-quality implementation plan

Template này đảm bảo:
- ✅ Consistent workflow across different agents
- ✅ Architecture compatibility validation  
- ✅ High-quality, detailed planning
- ✅ Error prevention mechanisms
- ✅ Reusable cho bất kỳ feature nào

Bạn có thể sử dụng template này cho bất kỳ agent nào để đảm bảo quality và consistency trong planning process!