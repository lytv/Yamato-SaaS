# 📅 PLAN TABLE IMPLEMENTATION PLAN

## 🎯 **OBJECTIVE**
Implement complete CRUD functionality for Plan table (Monthly Production Plans: T.6, T.7, T.8, T.9) following Yamato-SaaS todos pattern. This table manages monthly production planning with approval workflows, target quantities, and status management.

## 📋 **OVERVIEW**
Plan table manages monthly production planning cycles:
- **planCode**: T.6, T.7, T.8, T.9 (monthly plan identifiers)
- **planName**: 06.2025, 07.2025, 08.2025, 09.2025 (display names)
- **Target management**: totalTargetQuantity vs totalActualQuantity
- **Approval workflow**: approvedBy, approvedAt timestamps
- **Status management**: draft → active → completed → cancelled
- **Date planning**: planStartDate, planEndDate for scheduling

## 🏗️ **IMPLEMENTATION LAYERS (8 Layers)**

### **LAYER 1: DATABASE SCHEMA** ✅ Already exists in schema_new.ts
- File: `src/models/schema_new.ts`
- Status: ✅ Complete - planSchema already defined
- Note: Schema includes approval workflow, quantity tracking, status management

---

### **LAYER 2: TYPE DEFINITIONS**
**File to create**: `src/types/plan.ts`

**Requirements**:
1. **Import schemas**: planSchema from schema_new.ts
2. **Server/Client types**: Handle Date vs string differences for multiple date fields
3. **Input types**: Create/Update input types with business validation
4. **API response types**: Consistent with todos pattern
5. **Form data types**: Planning form with date management
6. **Filter types**: Month/year filtering, status-based filtering
7. **Enum types**: Plan statuses, approval states
8. **Business types**: Quantity tracking, progress calculations

**Key features for Plan table**:
- **Multiple date fields**: planStartDate, planEndDate, approvedAt
- **Quantity tracking**: Target vs actual with progress calculations
- **Approval workflow**: Approval state management
- **Month/year organization**: Structured by year and month
- **Status lifecycle**: Draft → Active → Completed/Cancelled

**Example structure**:
```typescript
import type { planSchema } from '@/models/schema_new';

// Server-side type (with Date objects)
export type PlanDb = typeof planSchema.$inferSelect;

// Client-side type (dates as strings from API)
export type Plan = Omit<PlanDb, 'createdAt' | 'updatedAt' | 'planStartDate' | 'planEndDate' | 'approvedAt'> & {
  createdAt: string | Date;
  updatedAt: string | Date;
  planStartDate: string | Date | null;
  planEndDate: string | Date | null;
  approvedAt: string | Date | null;
};

// Input types
export type CreatePlanInput = typeof planSchema.$inferInsert;
export type UpdatePlanInput = Partial<Omit<CreatePlanInput, 'id' | 'ownerId' | 'createdAt' | 'updatedAt'>>;

// Enum types for dropdowns and validation
export type PlanStatus = 'draft' | 'active' | 'completed' | 'cancelled';
export type ApprovalStatus = 'pending' | 'approved' | 'rejected' | 'not_submitted';
export type PlanMonth = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12;

// API response types following todos pattern
export type PlansResponse = {
  success: true;
  data: Plan[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    hasMore: boolean;
  };
};

export type PlanResponse = {
  success: true;
  data: Plan;
  message?: string;
};

export type PlanErrorResponse = {
  success: false;
  error: string;
  code: string;
  details?: unknown;
};

// Form data type for planning forms
export type PlanFormData = {
  planCode: string;
  planName: string;
  planYear: number;
  planMonth: PlanMonth;
  totalTargetQuantity: number;
  totalActualQuantity: number;
  status: PlanStatus;
  planStartDate: string | null;
  planEndDate: string | null;
  note: string;
};

// List parameters with plan-specific filters
export type PlanListParams = {
  search?: string;
  ownerId: string;
  sortBy?: 'createdAt' | 'updatedAt' | 'planName' | 'planYear' | 'planMonth' | 'totalTargetQuantity';
  sortOrder?: 'asc' | 'desc';
  page: number;
  limit: number;
  // Plan-specific filters
  planYear?: number;
  planMonth?: PlanMonth;
  status?: PlanStatus;
  approvalStatus?: ApprovalStatus;
  // Date range filters
  startDateFrom?: string;
  startDateTo?: string;
  endDateFrom?: string;
  endDateTo?: string;
  // Quantity filters
  minTargetQuantity?: number;
  maxTargetQuantity?: number;
  // Progress filters
  completionPercentageMin?: number;
  completionPercentageMax?: number;
  behindSchedule?: boolean;
  aheadOfSchedule?: boolean;
};

// Filter state type for UI
export type PlanFilters = {
  search: string;
  sortBy: 'createdAt' | 'updatedAt' | 'planName' | 'planYear' | 'planMonth' | 'totalTargetQuantity';
  sortOrder: 'asc' | 'desc';
  planYear: number | 'all';
  planMonth: PlanMonth | 'all';
  status: PlanStatus | 'all';
  approvalStatus: ApprovalStatus | 'all';
  // Date range filters
  dateRange: {
    startDateFrom: string;
    startDateTo: string;
    endDateFrom: string;
    endDateTo: string;
  };
  // Quantity range filters
  targetQuantityRange: [number, number];
  completionPercentageRange: [number, number];
  // Progress filters
  behindSchedule: boolean;
  aheadOfSchedule: boolean;
};

// Business calculation types
export type PlanProgress = {
  planId: number;
  planCode: string;
  planName: string;
  totalTargetQuantity: number;
  totalActualQuantity: number;
  completionPercentage: number;
  isOnSchedule: boolean;
  isBehindSchedule: boolean;
  isAheadOfSchedule: boolean;
  daysRemaining: number | null;
  projectedCompletion: number;
  status: PlanStatus;
};

// Monthly planning summary
export type MonthlyPlanSummary = {
  planYear: number;
  planMonth: PlanMonth;
  totalPlans: number;
  draftPlans: number;
  activePlans: number;
  completedPlans: number;
  cancelledPlans: number;
  totalTargetQuantity: number;
  totalActualQuantity: number;
  overallCompletionPercentage: number;
  approvedPlans: number;
  pendingApprovalPlans: number;
};

// Approval workflow types
export type PlanApproval = {
  planId: number;
  planCode: string;
  planName: string;
  status: PlanStatus;
  approvedBy: string | null;
  approvedAt: string | Date | null;
  canApprove: boolean;
  canReject: boolean;
  canSubmitForApproval: boolean;
  approvalStatus: ApprovalStatus;
};

// Quantity tracking types
export type QuantityTracking = {
  planId: number;
  planCode: string;
  totalTargetQuantity: number;
  totalActualQuantity: number;
  completionPercentage: number;
  remainingQuantity: number;
  isTargetAchievable: boolean;
  projectedFinalQuantity: number;
  dailyAverageRequired: number | null;
  currentDailyAverage: number | null;
};

// Dashboard metrics for planning
export type PlanMetrics = {
  totalPlans: number;
  activePlans: number;
  completedPlans: number;
  totalTargetQuantity: number;
  totalActualQuantity: number;
  overallCompletionPercentage: number;
  plansOnSchedule: number;
  plansBehindSchedule: number;
  plansAheadOfSchedule: number;
  pendingApprovals: number;
  currentMonthPlans: number;
  nextMonthPlans: number;
};

// Year planning overview
export type YearPlanningOverview = {
  planYear: number;
  monthlyBreakdown: MonthlyPlanSummary[];
  yearlyTotals: {
    totalPlans: number;
    totalTargetQuantity: number;
    totalActualQuantity: number;
    overallCompletionPercentage: number;
  };
  quarterlyBreakdown: {
    Q1: { months: [1, 2, 3]; totalTargetQuantity: number; totalActualQuantity: number; };
    Q2: { months: [4, 5, 6]; totalTargetQuantity: number; totalActualQuantity: number; };
    Q3: { months: [7, 8, 9]; totalTargetQuantity: number; totalActualQuantity: number; };
    Q4: { months: [10, 11, 12]; totalTargetQuantity: number; totalActualQuantity: number; };
  };
};

// Plan status transition types
export type PlanStatusTransition = {
  fromStatus: PlanStatus;
  toStatus: PlanStatus;
  isValid: boolean;
  requiresApproval: boolean;
  requiredRole?: string;
  validationMessage?: string;
};
```

---

### **LAYER 3: VALIDATION SCHEMAS**
**File to create**: `src/libs/validations/plan.ts`

**Requirements**:
1. **Base schemas**: Create, Update, ID validation
2. **Business logic validation**: Status transitions, approval workflow, date logic
3. **Month/year validation**: Valid month (1-12), reasonable year range
4. **Quantity validation**: Positive integers, actual ≤ target constraints
5. **Date validation**: Start date ≤ end date, reasonable date ranges
6. **Code uniqueness**: planCode unique per owner per year/month
7. **Status workflow**: Valid status transitions
8. **Approval logic**: Approval requirements based on status

**Key validations needed**:
- **planCode**: Required, unique per owner, specific format (T.X pattern)
- **planMonth**: Integer 1-12
- **planYear**: Reasonable range (current year ± 5 years)
- **quantities**: Positive integers, logical relationships
- **date logic**: planStartDate ≤ planEndDate, reasonable ranges
- **status transitions**: Business rule enforcement
- **approval workflow**: Approval state validation

**Example structure**:
```typescript
import { z } from 'zod';

// Enum schemas
const PlanStatusSchema = z.enum(['draft', 'active', 'completed', 'cancelled']);
const PlanMonthSchema = z.number().int().min(1).max(12);
const PlanYearSchema = z.number().int().min(2020).max(2030); // Reasonable range

// Date schema for plan dates
const OptionalDateSchema = z.union([
  z.string().datetime(),
  z.string().regex(/^\d{4}-\d{2}-\d{2}$/), // YYYY-MM-DD format
  z.null(),
  z.undefined()
]).optional().nullable();

// Quantity schema
const QuantitySchema = z.number().int().min(0, 'Quantity cannot be negative');
const TargetQuantitySchema = z.number().int().min(1, 'Target quantity must be at least 1');

// Plan code validation (T.6, T.7, T.8, T.9 format)
const PlanCodeSchema = z.string()
  .min(1, 'Plan code is required')
  .max(10, 'Plan code must be less than 10 characters')
  .regex(/^T\.\d{1,2}$/, 'Plan code must follow format T.X (e.g., T.6, T.7, T.8, T.9)');

// Base plan validation
export const CreatePlanSchema = z.object({
  ownerId: z.string().min(1, 'Owner ID is required'),
  planCode: PlanCodeSchema,
  planName: z.string()
    .min(1, 'Plan name is required')
    .max(100, 'Plan name must be less than 100 characters'),
  planYear: PlanYearSchema,
  planMonth: PlanMonthSchema,
  totalTargetQuantity: TargetQuantitySchema.optional(),
  totalActualQuantity: QuantitySchema.default(0),
  status: PlanStatusSchema.default('draft'),
  planStartDate: OptionalDateSchema,
  planEndDate: OptionalDateSchema,
  approvedBy: z.string().max(100).optional().nullable(),
  approvedAt: OptionalDateSchema,
  note: z.string().max(1000, 'Note must be less than 1000 characters').optional(),
}).refine((data) => {
  // Business logic: actual quantity should not exceed target (unless target is not set)
  if (data.totalTargetQuantity && data.totalActualQuantity > data.totalTargetQuantity) {
    return false;
  }
  return true;
}, {
  message: 'Actual quantity cannot exceed target quantity',
  path: ['totalActualQuantity']
}).refine((data) => {
  // Date logic: start date should be before end date
  if (data.planStartDate && data.planEndDate) {
    const startDate = new Date(data.planStartDate);
    const endDate = new Date(data.planEndDate);
    if (startDate >= endDate) {
      return false;
    }
  }
  return true;
}, {
  message: 'Plan end date must be after start date',
  path: ['planEndDate']
}).refine((data) => {
  // Business logic: plan dates should be within the planned month/year
  if (data.planStartDate && data.planYear && data.planMonth) {
    const startDate = new Date(data.planStartDate);
    const planStartOfMonth = new Date(data.planYear, data.planMonth - 1, 1);
    const planEndOfMonth = new Date(data.planYear, data.planMonth, 0);
    
    if (startDate < planStartOfMonth || startDate > planEndOfMonth) {
      return false;
    }
  }
  return true;
}, {
  message: 'Plan start date should be within the planned month and year',
  path: ['planStartDate']
}).refine((data) => {
  // Approval logic: approved status requires approver information
  if (data.status !== 'draft' && data.status !== 'cancelled') {
    if (!data.approvedBy || !data.approvedAt) {
      return false;
    }
  }
  return true;
}, {
  message: 'Approved plans must have approver and approval date',
  path: ['approvedBy']
});

// Update schema with business logic for status transitions
export const UpdatePlanSchema = CreatePlanSchema.partial().omit(['ownerId']).refine(
  (data) => Object.keys(data).length > 0,
  { message: 'At least one field must be provided for update' }
).refine((data) => {
  // Status transition validation
  if (data.status) {
    // This would be implemented with database lookup for current status
    // For now, basic validation
    const validStatuses = ['draft', 'active', 'completed', 'cancelled'];
    if (!validStatuses.includes(data.status)) {
      return false;
    }
  }
  return true;
}, {
  message: 'Invalid status transition',
  path: ['status']
});

// Plan ID validation
export const PlanIdSchema = z.object({
  id: z.coerce.number().int().positive('Plan ID must be a positive integer'),
});

// List parameters with plan-specific filtering
export const PlanListParamsSchema = z.object({
  page: z.union([z.string(), z.number(), z.undefined(), z.null()])
    .transform((val) => {
      if (val === undefined || val === null) return 1;
      const num = typeof val === 'string' ? Number.parseInt(val, 10) : val;
      return Number.isNaN(num) ? 1 : num;
    })
    .pipe(z.number().int().min(1, 'Page must be at least 1')),

  limit: z.union([z.string(), z.number(), z.undefined(), z.null()])
    .transform((val) => {
      if (val === undefined || val === null) return 10;
      const num = typeof val === 'string' ? Number.parseInt(val, 10) : val;
      return Number.isNaN(num) ? 10 : num;
    })
    .pipe(z.number().int().min(1).max(100, 'Limit cannot exceed 100')),

  search: z.union([z.string(), z.undefined(), z.null()])
    .transform(val => val || undefined).optional(),

  sortBy: z.union([
    z.enum(['createdAt', 'updatedAt', 'planName', 'planYear', 'planMonth', 'totalTargetQuantity']), 
    z.undefined(), 
    z.null()
  ]).transform(val => 
    val && ['createdAt', 'updatedAt', 'planName', 'planYear', 'planMonth', 'totalTargetQuantity'].includes(val) 
      ? val : 'createdAt'
  ),

  sortOrder: z.union([z.enum(['asc', 'desc']), z.undefined(), z.null()])
    .transform(val => val && ['asc', 'desc'].includes(val) ? val : 'desc'),

  // Plan-specific filters
  planYear: z.union([z.string(), z.number(), z.undefined(), z.null()])
    .transform(val => {
      if (val === undefined || val === null) return undefined;
      const num = typeof val === 'string' ? Number.parseInt(val, 10) : val;
      return Number.isNaN(num) ? undefined : num;
    }).optional(),
  planMonth: z.union([z.string(), z.number(), z.undefined(), z.null()])
    .transform(val => {
      if (val === undefined || val === null) return undefined;
      const num = typeof val === 'string' ? Number.parseInt(val, 10) : val;
      return Number.isNaN(num) || num < 1 || num > 12 ? undefined : num;
    }).optional(),
  status: PlanStatusSchema.optional(),

  // Date range filters
  startDateFrom: z.string().optional(),
  startDateTo: z.string().optional(),
  endDateFrom: z.string().optional(),
  endDateTo: z.string().optional(),

  // Quantity filters
  minTargetQuantity: z.union([z.string(), z.number(), z.undefined(), z.null()])
    .transform(val => {
      if (val === undefined || val === null) return undefined;
      const num = typeof val === 'string' ? Number.parseInt(val, 10) : val;
      return Number.isNaN(num) ? undefined : num;
    }).optional(),
  maxTargetQuantity: z.union([z.string(), z.number(), z.undefined(), z.null()])
    .transform(val => {
      if (val === undefined || val === null) return undefined;
      const num = typeof val === 'string' ? Number.parseInt(val, 10) : val;
      return Number.isNaN(num) ? undefined : num;
    }).optional(),

  // Progress filters
  completionPercentageMin: z.union([z.string(), z.number(), z.undefined(), z.null()])
    .transform(val => {
      if (val === undefined || val === null) return undefined;
      const num = typeof val === 'string' ? Number.parseFloat(val) : val;
      return Number.isNaN(num) ? undefined : num;
    }).optional(),
  completionPercentageMax: z.union([z.string(), z.number(), z.undefined(), z.null()])
    .transform(val => {
      if (val === undefined || val === null) return undefined;
      const num = typeof val === 'string' ? Number.parseFloat(val) : val;
      return Number.isNaN(num) ? undefined : num;
    }).optional(),

  // Boolean filters
  behindSchedule: z.union([z.string(), z.boolean(), z.undefined(), z.null()])
    .transform(val => {
      if (val === undefined || val === null) return undefined;
      if (typeof val === 'boolean') return val;
      return val === 'true';
    }).optional(),
  aheadOfSchedule: z.union([z.string(), z.boolean(), z.undefined(), z.null()])
    .transform(val => {
      if (val === undefined || val === null) return undefined;
      if (typeof val === 'boolean') return val;
      return val === 'true';
    }).optional(),
});

// Form validation for React Hook Form
export const PlanFormSchema = z.object({
  planCode: PlanCodeSchema,
  planName: z.string().min(1, 'Plan name is required').max(100),
  planYear: PlanYearSchema,
  planMonth: PlanMonthSchema,
  totalTargetQuantity: TargetQuantitySchema,
  totalActualQuantity: QuantitySchema,
  status: PlanStatusSchema,
  planStartDate: z.string().optional().nullable(),
  planEndDate: z.string().optional().nullable(),
  note: z.string().max(1000),
}).refine((data) => {
  // Form-level validation: actual ≤ target
  if (data.totalActualQuantity > data.totalTargetQuantity) {
    return false;
  }
  return true;
}, {
  message: 'Actual quantity cannot exceed target quantity',
  path: ['totalActualQuantity']
}).refine((data) => {
  // Form-level validation: date logic
  if (data.planStartDate && data.planEndDate) {
    const startDate = new Date(data.planStartDate);
    const endDate = new Date(data.planEndDate);
    if (startDate >= endDate) {
      return false;
    }
  }
  return true;
}, {
  message: 'End date must be after start date',
  path: ['planEndDate']
});

// Status transition validation schema
export const PlanStatusTransitionSchema = z.object({
  fromStatus: PlanStatusSchema,
  toStatus: PlanStatusSchema,
  userId: z.string().min(1),
  userRole: z.string().optional(),
}).refine((data) => {
  // Define valid status transitions
  const validTransitions: Record<string, string[]> = {
    'draft': ['active', 'cancelled'],
    'active': ['completed', 'cancelled'],
    'completed': [], // Cannot transition from completed
    'cancelled': ['draft'], // Can restart from cancelled
  };

  const allowedTransitions = validTransitions[data.fromStatus] || [];
  return allowedTransitions.includes(data.toStatus);
}, {
  message: 'Invalid status transition',
  path: ['toStatus']
});

// Request schemas for API
export const CreatePlanRequestSchema = CreatePlanSchema.omit(['ownerId']);
export const UpdatePlanRequestSchema = UpdatePlanSchema;

// Type exports
export type CreatePlanRequest = z.infer<typeof CreatePlanRequestSchema>;
export type UpdatePlanRequest = z.infer<typeof UpdatePlanRequestSchema>;
export type PlanListParams = z.infer<typeof PlanListParamsSchema>;
export type PlanFormData = z.infer<typeof PlanFormSchema>;
export type PlanStatusTransitionData = z.infer<typeof PlanStatusTransitionSchema>;

// Validation helper functions
export function validateCreatePlan(data: unknown): CreatePlanRequest {
  return CreatePlanRequestSchema.parse(data);
}

export function validateUpdatePlan(data: unknown): UpdatePlanRequest {
  return UpdatePlanRequestSchema.parse(data);
}

export function validatePlanId(data: unknown): { id: number } {
  return PlanIdSchema.parse(data);
}

export function validatePlanListParams(data: unknown): PlanListParams {
  return PlanListParamsSchema.parse(data);
}

export function validatePlanForm(data: unknown): PlanFormData {
  return PlanFormSchema.parse(data);
}

export function validateStatusTransition(data: unknown): PlanStatusTransitionData {
  return PlanStatusTransitionSchema.parse(data);
}

// Business logic validation helpers
export function validatePlanCodeUniqueness(
  planCode: string, 
  ownerId: string, 
  excludeId?: number
): Promise<boolean> {
  // This would check database for code uniqueness
  return Promise.resolve(true);
}

export function validateStatusTransitionPermission(
  fromStatus: PlanStatus,
  toStatus: PlanStatus,
  userRole: string
): boolean {
  // Define role-based permissions for status transitions
  const rolePermissions: Record<string, { canApprove: boolean; canCancel: boolean; }> = {
    'admin': { canApprove: true, canCancel: true },
    'manager': { canApprove: true, canCancel: true },
    'planner': { canApprove: false, canCancel: false },
    'operator': { canApprove: false, canCancel: false },
  };

  const permissions = rolePermissions[userRole] || { canApprove: false, canCancel: false };

  // Check specific transition permissions
  if (fromStatus === 'draft' && toStatus === 'active') {
    return permissions.canApprove;
  }
  
  if (toStatus === 'cancelled') {
    return permissions.canCancel;
  }

  return true; // Other transitions allowed
}

// Date calculation helpers for planning
export function calculatePlanProgress(
  startDate: string | Date | null,
  endDate: string | Date | null,
  actualQuantity: number,
  targetQuantity: number
): { completionPercentage: number; isOnSchedule: boolean; projectedCompletion: number } {
  const today = new Date();
  
  // Calculate completion percentage
  const completionPercentage = targetQuantity > 0 ? (actualQuantity / targetQuantity) * 100 : 0;
  
  // Calculate schedule progress
  let scheduleProgress = 0;
  if (startDate && endDate) {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const totalDays = (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24);
    const daysElapsed = (today.getTime() - start.getTime()) / (1000 * 60 * 60 * 24);
    scheduleProgress = Math.max(0, Math.min(100, (daysElapsed / totalDays) * 100));
  }

  // Determine if on schedule (within 5% tolerance)
  const isOnSchedule = Math.abs(completionPercentage - scheduleProgress) <= 5;

  // Project final completion based on current rate
  const projectedCompletion = scheduleProgress > 0 ? (completionPercentage / scheduleProgress) * 100 : completionPercentage;

  return {
    completionPercentage: Math.round(completionPercentage * 100) / 100,
    isOnSchedule,
    projectedCompletion: Math.round(projectedCompletion * 100) / 100,
  };
}

export function getMonthName(month: number): string {
  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  return monthNames[month - 1] || 'Unknown';
}

export function generatePlanCode(month: number): string {
  return `T.${month}`;
}

export function generatePlanName(month: number, year: number): string {
  const monthStr = month.toString().padStart(2, '0');
  return `${monthStr}.${year}`;
}
```

---

### **LAYER 4: DATABASE QUERIES**
**File to create**: `src/libs/queries/plan.ts`

**Requirements**:
1. **CRUD operations**: Create, Read, Update, Delete with ownership checks
2. **Business logic validation**: Plan code uniqueness, status transitions
3. **Date-based filtering**: Month/year filtering, date range queries
4. **Progress calculations**: Completion percentages, schedule tracking
5. **Approval workflow**: Approval state management and tracking
6. **Analytics queries**: Monthly summaries, yearly overviews, metrics
7. **Status management**: Valid status transitions with business rules

**Key query features**:
- **Month/year indexing**: Efficient queries by planning periods
- **Status workflow**: Enforce business rules for status transitions
- **Progress tracking**: Calculate completion percentages and projections
- **Approval management**: Track approval workflow and permissions
- **Period analytics**: Monthly and yearly planning summaries

**Example structure**:
```typescript
import { and, asc, count, desc, eq, gte, lte, ilike, or, sql, avg, sum } from 'drizzle-orm';
import { db } from '@/libs/DB';
import { planSchema } from '@/models/schema_new';
import type { 
  CreatePlanInput, 
  UpdatePlanInput, 
  PlanDb, 
  PlanListParams,
  PlanProgress,
  MonthlyPlanSummary,
  PlanMetrics,
  YearPlanningOverview
} from '@/types/plan';

/**
 * Create new plan with business validation
 */
export async function createPlan(data: CreatePlanInput): Promise<PlanDb> {
  // Check if planCode already exists for this owner
  const existingPlan = await getPlanByCode(data.planCode, data.ownerId);
  if (existingPlan) {
    throw new Error(`Plan code '${data.planCode}' already exists`);
  }

  // Check if plan for this month/year combination already exists
  const existingMonthPlan = await getPlanByMonthYear(data.planMonth, data.planYear, data.ownerId);
  if (existingMonthPlan) {
    throw new Error(`Plan for ${data.planMonth}/${data.planYear} already exists`);
  }

  const [plan] = await db
    .insert(planSchema)
    .values({
      ownerId: data.ownerId,
      planCode: data.planCode,
      planName: data.planName,
      planYear: data.planYear,
      planMonth: data.planMonth,
      totalTargetQuantity: data.totalTargetQuantity,
      totalActualQuantity: data.totalActualQuantity ?? 0,
      status: data.status ?? 'draft',
      planStartDate: data.planStartDate ? new Date(data.planStartDate) : null,
      planEndDate: data.planEndDate ? new Date(data.planEndDate) : null,
      approvedBy: data.approvedBy,
      approvedAt: data.approvedAt ? new Date(data.approvedAt) : null,
      note: data.note,
    })
    .returning();

  if (!plan) {
    throw new Error('Failed to create plan');
  }

  return plan;
}

/**
 * Get plans by owner with comprehensive filtering
 */
export async function getPlansByOwner(params: PlanListParams): Promise<PlanDb[]> {
  const { 
    ownerId, page, limit, search, sortBy = 'createdAt', sortOrder = 'desc',
    planYear, planMonth, status, startDateFrom, startDateTo, endDateFrom, endDateTo,
    minTargetQuantity, maxTargetQuantity, completionPercentageMin, completionPercentageMax,
    behindSchedule, aheadOfSchedule
  } = params;
  const offset = (page - 1) * limit;

  // Build where conditions
  let whereConditions = eq(planSchema.ownerId, ownerId);

  // Add search filter
  if (search && search.trim() !== '') {
    const searchTerm = `%${search.trim()}%`;
    const searchCondition = and(
      eq(planSchema.ownerId, ownerId),
      or(
        ilike(planSchema.planName, searchTerm),
        ilike(planSchema.planCode, searchTerm),
        ilike(planSchema.note, searchTerm),
        ilike(planSchema.approvedBy, searchTerm),
      ),
    );
    if (searchCondition) {
      whereConditions = searchCondition;
    }
  }

  // Add year filter
  if (planYear) {
    whereConditions = and(whereConditions, eq(planSchema.planYear, planYear));
  }

  // Add month filter
  if (planMonth) {
    whereConditions = and(whereConditions, eq(planSchema.planMonth, planMonth));
  }

  // Add status filter
  if (status) {
    whereConditions = and(whereConditions, eq(planSchema.status, status));
  }

  // Add date range filters
  if (startDateFrom) {
    whereConditions = and(whereConditions, gte(planSchema.planStartDate, new Date(startDateFrom)));
  }

  if (startDateTo) {
    whereConditions = and(whereConditions, lte(planSchema.planStartDate, new Date(startDateTo)));
  }

  if (endDateFrom) {
    whereConditions = and(whereConditions, gte(planSchema.planEndDate, new Date(endDateFrom)));
  }

  if (endDateTo) {
    whereConditions = and(whereConditions, lte(planSchema.planEndDate, new Date(endDateTo)));
  }

  // Add quantity filters
  if (minTargetQuantity) {
    whereConditions = and(whereConditions, gte(planSchema.totalTargetQuantity, minTargetQuantity));
  }

  if (maxTargetQuantity) {
    whereConditions = and(whereConditions, lte(planSchema.totalTargetQuantity, maxTargetQuantity));
  }

  // Note: Progress-based filters (behindSchedule, aheadOfSchedule, completionPercentage) 
  // would require calculated fields or post-processing due to their complexity

  // Build sort order
  const sortColumn = planSchema[sortBy];
  const orderBy = sortOrder === 'asc' ? asc(sortColumn) : desc(sortColumn);

  const plans = await db
    .select()
    .from(planSchema)
    .where(whereConditions)
    .orderBy(orderBy)
    .limit(limit)
    .offset(offset);

  // Post-process for completion percentage filters if needed
  if (completionPercentageMin !== undefined || completionPercentageMax !== undefined || 
      behindSchedule !== undefined || aheadOfSchedule !== undefined) {
    
    const today = new Date();
    return plans.filter(plan => {
      const completionPercentage = plan.totalTargetQuantity 
        ? (plan.totalActualQuantity / plan.totalTargetQuantity) * 100 
        : 0;

      // Check completion percentage range
      if (completionPercentageMin !== undefined && completionPercentage < completionPercentageMin) {
        return false;
      }
      if (completionPercentageMax !== undefined && completionPercentage > completionPercentageMax) {
        return false;
      }

      // Check schedule status
      if (behindSchedule !== undefined || aheadOfSchedule !== undefined) {
        const { isOnSchedule, projectedCompletion } = calculatePlanProgress(
          plan.planStartDate, plan.planEndDate, plan.totalActualQuantity, plan.totalTargetQuantity || 0
        );

        if (behindSchedule && (isOnSchedule || projectedCompletion >= 100)) {
          return false;
        }
        if (aheadOfSchedule && (!isOnSchedule || projectedCompletion <= 100)) {
          return false;
        }
      }

      return true;
    });
  }

  return plans;
}

/**
 * Get plan by code (for uniqueness validation)
 */
export async function getPlanByCode(planCode: string, ownerId: string): Promise<PlanDb | null> {
  const [plan] = await db
    .select()
    .from(planSchema)
    .where(
      and(
        eq(planSchema.planCode, planCode),
        eq(planSchema.ownerId, ownerId),
      ),
    )
    .limit(1);

  return plan ?? null;
}

/**
 * Get plan by month/year combination (for uniqueness validation)
 */
export async function getPlanByMonthYear(
  planMonth: number, 
  planYear: number, 
  ownerId: string
): Promise<PlanDb | null> {
  const [plan] = await db
    .select()
    .from(planSchema)
    .where(
      and(
        eq(planSchema.planMonth, planMonth),
        eq(planSchema.planYear, planYear),
        eq(planSchema.ownerId, ownerId),
      ),
    )
    .limit(1);

  return plan ?? null;
}

/**
 * Get plan by ID with ownership check
 */
export async function getPlanById(id: number, ownerId: string): Promise<PlanDb | null> {
  const [plan] = await db
    .select()
    .from(planSchema)
    .where(
      and(
        eq(planSchema.id, id),
        eq(planSchema.ownerId, ownerId),
      ),
    )
    .limit(1);

  return plan ?? null;
}

/**
 * Update plan with business validation and status transition checks
 */
export async function updatePlan(
  id: number,
  ownerId: string,
  data: UpdatePlanInput,
): Promise<PlanDb> {
  // Check ownership first
  const existingPlan = await getPlanById(id, ownerId);
  if (!existingPlan) {
    throw new Error('Plan not found or access denied');
  }

  // Check planCode uniqueness if changed
  if (data.planCode && data.planCode !== existingPlan.planCode) {
    const existingCodePlan = await getPlanByCode(data.planCode, ownerId);
    if (existingCodePlan) {
      throw new Error(`Plan code '${data.planCode}' already exists`);
    }
  }

  // Check month/year uniqueness if changed
  if ((data.planMonth && data.planMonth !== existingPlan.planMonth) || 
      (data.planYear && data.planYear !== existingPlan.planYear)) {
    const month = data.planMonth ?? existingPlan.planMonth;
    const year = data.planYear ?? existingPlan.planYear;
    const existingMonthPlan = await getPlanByMonthYear(month, year, ownerId);
    if (existingMonthPlan && existingMonthPlan.id !== id) {
      throw new Error(`Plan for ${month}/${year} already exists`);
    }
  }

  // Validate status transition if status is being changed
  if (data.status && data.status !== existingPlan.status) {
    const isValidTransition = validateStatusTransition(existingPlan.status, data.status);
    if (!isValidTransition) {
      throw new Error(`Invalid status transition from '${existingPlan.status}' to '${data.status}'`);
    }

    // If transitioning to active, require approval information
    if (data.status === 'active' && !data.approvedBy) {
      throw new Error('Approval information required for activating plan');
    }
  }

  const [updatedPlan] = await db
    .update(planSchema)
    .set({
      planCode: data.planCode ?? existingPlan.planCode,
      planName: data.planName ?? existingPlan.planName,
      planYear: data.planYear ?? existingPlan.planYear,
      planMonth: data.planMonth ?? existingPlan.planMonth,
      totalTargetQuantity: data.totalTargetQuantity ?? existingPlan.totalTargetQuantity,
      totalActualQuantity: data.totalActualQuantity ?? existingPlan.totalActualQuantity,
      status: data.status ?? existingPlan.status,
      planStartDate: data.planStartDate ? new Date(data.planStartDate) : existingPlan.planStartDate,
      planEndDate: data.planEndDate ? new Date(data.planEndDate) : existingPlan.planEndDate,
      approvedBy: data.approvedBy ?? existingPlan.approvedBy,
      approvedAt: data.approvedAt ? new Date(data.approvedAt) : existingPlan.approvedAt,
      note: data.note ?? existingPlan.note,
      updatedAt: new Date(),
    })
    .where(
      and(
        eq(planSchema.id, id),
        eq(planSchema.ownerId, ownerId),
      ),
    )
    .returning();

  if (!updatedPlan) {
    throw new Error('Failed to update plan');
  }

  return updatedPlan;
}

/**
 * Delete plan with status check
 */
export async function deletePlan(id: number, ownerId: string): Promise<boolean> {
  // Check ownership first
  const existingPlan = await getPlanById(id, ownerId);
  if (!existingPlan) {
    throw new Error('Plan not found or access denied');
  }

  // Business rule: Cannot delete active or completed plans
  if (existingPlan.status === 'active' || existingPlan.status === 'completed') {
    throw new Error(`Cannot delete plan with status '${existingPlan.status}'. Cancel the plan first.`);
  }

  await db
    .delete(planSchema)
    .where(
      and(
        eq(planSchema.id, id),
        eq(planSchema.ownerId, ownerId),
      ),
    );

  return true;
}

/**
 * Get plan metrics for dashboard
 */
export async function getPlanMetrics(ownerId: string): Promise<PlanMetrics> {
  const currentDate = new Date();
  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth() + 1;
  const nextMonth = currentMonth === 12 ? 1 : currentMonth + 1;
  const nextMonthYear = currentMonth === 12 ? currentYear + 1 : currentYear;

  // Get overall statistics
  const [totalResult] = await db
    .select({
      totalPlans: count(),
      totalTargetQuantity: sum(planSchema.totalTargetQuantity),
      totalActualQuantity: sum(planSchema.totalActualQuantity),
    })
    .from(planSchema)
    .where(eq(planSchema.ownerId, ownerId));

  // Get status-based counts
  const [activeResult] = await db
    .select({ count: count() })
    .from(planSchema)
    .where(
      and(
        eq(planSchema.ownerId, ownerId),
        eq(planSchema.status, 'active')
      )
    );

  const [completedResult] = await db
    .select({ count: count() })
    .from(planSchema)
    .where(
      and(
        eq(planSchema.ownerId, ownerId),
        eq(planSchema.status, 'completed')
      )
    );

  // Get pending approvals (draft plans)
  const [pendingResult] = await db
    .select({ count: count() })
    .from(planSchema)
    .where(
      and(
        eq(planSchema.ownerId, ownerId),
        eq(planSchema.status, 'draft')
      )
    );

  // Get current month plans
  const [currentMonthResult] = await db
    .select({ count: count() })
    .from(planSchema)
    .where(
      and(
        eq(planSchema.ownerId, ownerId),
        eq(planSchema.planYear, currentYear),
        eq(planSchema.planMonth, currentMonth)
      )
    );

  // Get next month plans
  const [nextMonthResult] = await db
    .select({ count: count() })
    .from(planSchema)
    .where(
      and(
        eq(planSchema.ownerId, ownerId),
        eq(planSchema.planYear, nextMonthYear),
        eq(planSchema.planMonth, nextMonth)
      )
    );

  // Calculate overall completion percentage
  const totalTarget = Number(totalResult?.totalTargetQuantity ?? 0);
  const totalActual = Number(totalResult?.totalActualQuantity ?? 0);
  const overallCompletionPercentage = totalTarget > 0 ? (totalActual / totalTarget) * 100 : 0;

  return {
    totalPlans: totalResult?.totalPlans ?? 0,
    activePlans: activeResult?.count ?? 0,
    completedPlans: completedResult?.count ?? 0,
    totalTargetQuantity: totalTarget,
    totalActualQuantity: totalActual,
    overallCompletionPercentage: Math.round(overallCompletionPercentage * 100) / 100,
    plansOnSchedule: 0, // Would require calculation
    plansBehindSchedule: 0, // Would require calculation
    plansAheadOfSchedule: 0, // Would require calculation
    pendingApprovals: pendingResult?.count ?? 0,
    currentMonthPlans: currentMonthResult?.count ?? 0,
    nextMonthPlans: nextMonthResult?.count ?? 0,
  };
}

/**
 * Get monthly plan summary
 */
export async function getMonthlyPlanSummary(
  planYear: number, 
  planMonth: number, 
  ownerId: string
): Promise<MonthlyPlanSummary> {
  // Get all plans for the month
  const plans = await db
    .select()
    .from(planSchema)
    .where(
      and(
        eq(planSchema.ownerId, ownerId),
        eq(planSchema.planYear, planYear),
        eq(planSchema.planMonth, planMonth)
      )
    );

  // Calculate summary statistics
  const totalPlans = plans.length;
  const draftPlans = plans.filter(p => p.status === 'draft').length;
  const activePlans = plans.filter(p => p.status === 'active').length;
  const completedPlans = plans.filter(p => p.status === 'completed').length;
  const cancelledPlans = plans.filter(p => p.status === 'cancelled').length;
  const approvedPlans = plans.filter(p => p.approvedBy && p.approvedAt).length;
  const pendingApprovalPlans = plans.filter(p => !p.approvedBy && p.status === 'draft').length;

  const totalTargetQuantity = plans.reduce((sum, p) => sum + (p.totalTargetQuantity || 0), 0);
  const totalActualQuantity = plans.reduce((sum, p) => sum + (p.totalActualQuantity || 0), 0);
  const overallCompletionPercentage = totalTargetQuantity > 0 
    ? (totalActualQuantity / totalTargetQuantity) * 100 
    : 0;

  return {
    planYear,
    planMonth: planMonth as any, // Type assertion for PlanMonth
    totalPlans,
    draftPlans,
    activePlans,
    completedPlans,
    cancelledPlans,
    totalTargetQuantity,
    totalActualQuantity,
    overallCompletionPercentage: Math.round(overallCompletionPercentage * 100) / 100,
    approvedPlans,
    pendingApprovalPlans,
  };
}

// Helper functions
function validateStatusTransition(fromStatus: string, toStatus: string): boolean {
  const validTransitions: Record<string, string[]> = {
    'draft': ['active', 'cancelled'],
    'active': ['completed', 'cancelled'],
    'completed': [], // Cannot transition from completed
    'cancelled': ['draft'], // Can restart from cancelled
  };

  const allowedTransitions = validTransitions[fromStatus] || [];
  return allowedTransitions.includes(toStatus);
}

function calculatePlanProgress(
  startDate: Date | null,
  endDate: Date | null,
  actualQuantity: number,
  targetQuantity: number
): { isOnSchedule: boolean; projectedCompletion: number } {
  // Implementation would calculate schedule progress vs completion progress
  // This is a simplified version
  const completionPercentage = targetQuantity > 0 ? (actualQuantity / targetQuantity) * 100 : 0;
  return {
    isOnSchedule: true, // Simplified
    projectedCompletion: completionPercentage,
  };
}

// Additional utility functions for pagination, year overview, etc.
export async function getPlansCount(
  ownerId: string, 
  filters: Partial<PlanListParams> = {}
): Promise<number> {
  // Implementation similar to getPlansByOwner but for count only
  const [result] = await db
    .select({ count: count() })
    .from(planSchema)
    .where(eq(planSchema.ownerId, ownerId));

  return result?.count ?? 0;
}

export async function getPaginatedPlans(params: PlanListParams): Promise<{
  plans: PlanDb[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    hasMore: boolean;
  };
}> {
  const [plans, total] = await Promise.all([
    getPlansByOwner(params),
    getPlansCount(params.ownerId, params),
  ]);

  const hasMore = params.page * params.limit < total;

  return {
    plans,
    pagination: {
      page: params.page,
      limit: params.limit,
      total,
      hasMore,
    },
  };
}
```

---

### **LAYER 5-8: REMAINING LAYERS**
Following the same pattern as previous tables:

**LAYER 5**: API Routes with approval workflow endpoints
**LAYER 6**: API Client with planning-specific functions
**LAYER 7**: React Hooks with month/year filtering and status management
**LAYER 8**: React Components with planning calendar, approval workflow UI

---

## 🔥 **CRITICAL IMPLEMENTATION NOTES**

### **1. Month/Year Management**
- **Month validation**: 1-12 integer range
- **Year validation**: Reasonable range (2020-2030)
- **Unique constraint**: One plan per month/year/owner combination
- **Code generation**: T.6, T.7, T.8, T.9 format

### **2. Status Workflow Management**
- **Valid transitions**: draft → active → completed/cancelled
- **Approval requirements**: Active status requires approval info
- **Permission checking**: Role-based approval permissions
- **Audit trail**: Track who approved when

### **3. Quantity Tracking**
- **Business rule**: Actual ≤ Target (with warnings for over-achievement)
- **Progress calculation**: Real-time completion percentages
- **Schedule tracking**: Compare progress vs timeline
- **Projection**: Forecast final completion based on current rate

### **4. Date Management**
- **Start ≤ End**: Basic date logic validation
- **Month alignment**: Plan dates should align with plan month/year
- **Schedule analysis**: Calculate if plans are on/behind/ahead of schedule
- **Calendar integration**: Planning calendar views

### **5. Approval Workflow**
- **Draft → Active**: Requires approval (approvedBy + approvedAt)
- **Role permissions**: Different roles have different approval rights
- **Audit trail**: Complete approval history
- **Notification**: Alert for pending approvals

---

## 🎯 **SUCCESS CRITERIA**

✅ **Monthly planning cycles** with proper month/year management
✅ **Status workflow** with approval processes
✅ **Quantity tracking** with progress monitoring
✅ **Schedule analysis** with timeline projections
✅ **Business rule enforcement** for planning constraints
✅ **Calendar integration** for planning visualization
✅ **Approval workflow** with role-based permissions
✅ **Analytics dashboard** with planning metrics

---

This plan establishes the foundation for monthly production planning with sophisticated workflow management, approval processes, and progress tracking while maintaining the established todos pattern.