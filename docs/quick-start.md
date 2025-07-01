# Entity Generators - Quick Start 🚀

## TL;DR - Bắt Đầu Ngay

### 🎯 Chọn Script:
- **Simple entity**: `generate-entity.ts` (based on Todos)
- **Production entity**: `generate-advanced-entity.ts` (based on Products) ← **RECOMMENDED**

### ⚡ Quick Commands:

```bash
# Advanced Entity (RECOMMENDED - có Excel I/E, stats, etc.)
npx ts-node scripts/generate-advanced-entity.ts customers
npx ts-node scripts/generate-advanced-entity.ts suppliers
npx ts-node scripts/generate-advanced-entity.ts orders

# Basic Entity (simple CRUD only)
npx ts-node scripts/generate-entity.ts
```

### 📋 Post-Generation Checklist (5 phút):

```markdown
1. ✅ Update src/models/Schema.ts (add entitySchema)
2. ✅ Run: pnpm db:generate && pnpm db:migrate  
3. ✅ Update dashboard navigation
4. ✅ Test: /dashboard/[entity-name]
5. ✅ Done! 🎉
```

### 🔥 What You Get:

**Advanced Generator (Products-based):**
- 50+ files generated automatically
- Excel Import/Export ready
- Dashboard statistics  
- Advanced filtering & search
- Professional validation
- Multi-tenancy support
- Production-ready code

**Basic Generator (Todos-based):**
- 15+ files generated automatically
- Basic CRUD operations
- Simple filtering & search
- Form validation
- Good for prototyping

### 📚 Full Documentation:
👉 See `docs/entity-generators-guide.md` for complete guide

---
*Happy coding! 🚀*