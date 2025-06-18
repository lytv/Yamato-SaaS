# Production Step Schema Design

## Analysis of Current Product Schema Pattern

Based on the existing `productSchema` in the project, I can see the following design patterns:
- Uses `serial('id').primaryKey()` for auto-incrementing STT
- Uses `text('owner_id').notNull()` for ownership/tenant isolation
- Uses descriptive field names with snake_case convention
- Includes `updatedAt` and `createdAt` timestamps
- Uses unique indexes for business logic constraints

## Proposed Production Step Schema

Based on the UI screenshot showing fields for production step management, here's the recommended table design:

```typescript
export const productionStepSchema = pgTable('production_step', {
  id: serial('id').primaryKey(), // STT - Số thứ tự tự động tăng
  ownerId: text('owner_id').notNull(), // Chủ sở hữu/Tenant isolation
  stepCode: text('step_code').notNull(), // Mã Công Đoạn (ví dụ: CD61)
  stepName: text('step_name').notNull(), // Tên Công Đoạn (ví dụ: "Ủi túi lớn")
  filmSequence: text('film_sequence'), // Phim Tát (ví dụ: 61) - có thể để trống
  stepGroup: text('step_group'), // Phân Nhóm/Nhóm Công Đoạn (có thể để trống)
  notes: text('notes'), // Ghi chú bổ sung (nếu cần)
  isActive: boolean('is_active').default(true), // Trạng thái hoạt động
  updatedAt: timestamp('updated_at', { mode: 'date' })
    .defaultNow()
    .$onUpdate(() => new Date())
    .notNull(),
  createdAt: timestamp('created_at', { mode: 'date' }).defaultNow().notNull(),
}, (table) => {
  return {
    // Index để tìm kiếm nhanh theo mã công đoạn và owner
    stepCodeOwnerIdx: uniqueIndex('step_code_owner_idx').on(
      table.stepCode,
      table.ownerId,
    ),
    // Index để tìm kiếm theo nhóm công đoạn
    stepGroupIdx: index('step_group_idx').on(table.stepGroup),
    // Index để tìm kiếm theo film sequence
    filmSequenceIdx: index('film_sequence_idx').on(table.filmSequence),
  };
});
```

## Field Explanations

1. **id (serial)**: Auto-incrementing primary key, serves as STT (số thứ tự)
2. **ownerId (text)**: For multi-tenant isolation, following the existing pattern
3. **stepCode (text)**: Mã Công Đoạn - unique identifier for each production step
4. **stepName (text)**: Tên Công Đoạn - descriptive name of the production step
5. **filmSequence (text)**: Phim Tát - sequence number or identifier for filming/process order
6. **stepGroup (text)**: Phân Nhóm/Nhóm Công Đoạn - categorization of production steps
7. **notes (text)**: Optional field for additional notes
8. **isActive (boolean)**: To soft-delete or deactivate steps without removing them
9. **updatedAt/createdAt**: Standard audit fields following the existing pattern

## Indexes

- **stepCodeOwnerIdx**: Unique index ensuring no duplicate step codes per owner
- **stepGroupIdx**: For efficient filtering by step group
- **filmSequenceIdx**: For efficient sorting/filtering by film sequence

## Integration Notes

This schema follows the same patterns as the existing `productSchema`:
- Same naming conventions (snake_case)
- Same ownership model with `ownerId`
- Same timestamp pattern
- Same indexing approach for business logic constraints

The table can be added to the existing `src/models/Schema.ts` file alongside the current schemas.
