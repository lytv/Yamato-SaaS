# Process Feature Implementation Plan

## 🎯 **OVERVIEW & CONTEXT**

Process represents the main production processes (CAT, MAY, THEU, DONG_GOI) that form the backbone of production workflow. It manages process definitions, sequencing, capacity planning, quality standards, and operational procedures including SOP and training requirements.

**Key Characteristics:**
- Core production process management (CAT = Cutting, MAY = Sewing, THEU = Embroidery)
- Workflow sequencing and dependency management
- Capacity planning with time standards and setup requirements
- Quality control integration with standards and tolerances
- SOP (Standard Operating Procedure) management
- Outsourcing capability configuration

**Based on Todos Pattern:** Yamato-SaaS architecture with moderate complexity

**Medium Complexity:** More features than Product, simpler than ProcessExecution

---

## 🔧 **PREREQUISITES & DEPENDENCIES**

**Required Dependencies:**
- Existing todos feature (as reference pattern)
- Product implementation (for process integration patterns)
- Drizzle ORM setup
- Clerk authentication
- Shadcn UI components
- Next.js App Router

**No Hard Dependencies:** Process is a foundation table that will be referenced by ProcessSub

**Future Integrations:**
- ProcessSub table (will reference Process)
- ProcessExecution integration
- Capacity planning features

**Mock Data Strategy:**
Basic production processes:
```typescript
const mockProcesses = [
  { processCode: 'CAT', processName: 'Cắt', processCategory: 'production', sequenceOrder: 1 },
  { processCode: 'MAY', processName: 'May', processCategory: 'production', sequenceOrder: 2 },
  { processCode: 'THEU', processName: 'Thêu', processCategory: 'production', sequenceOrder: 3 },
  { processCode: 'DONG_GOI', processName: 'Đóng gói', processCategory: 'packaging', sequenceOrder: 4 },
];
```

---

## 📁 **FILE STRUCTURE TO CREATE**

```
src/
├── types/
│   └── process.ts                           # TypeScript types
├── libs/
│   ├── validations/
│   │   └── process.ts                      # Zod validation schemas
│   ├── queries/
│   │   └── process.ts                      # Database queries
│   └── api/
│       └── process.ts                      # Client API functions
├── hooks/
│   ├── useProcesses.ts                     # Data fetching hook
│   ├── useProcessMutations.ts              # CRUD mutations hook
│   └── useProcessFilters.ts                # Filter state management
├── features/
│   └── process/
│       ├── ProcessList.tsx                 # List component
│       ├── ProcessForm.tsx                 # Create/Edit form
│       ├── ProcessSkeleton.tsx             # Loading skeleton
│       ├── ProcessWorkflow.tsx             # Workflow visualization
│       ├── ProcessCapacity.tsx             # Capacity management
│       ├── ProcessQuality.tsx              # Quality standards
│       ├── ProcessSOP.tsx                  # SOP management
│       └── __tests__/                      # Component tests
├── app/
│   ├── api/
│   │   └── processes/
│   │       ├── route.ts                    # GET /api/processes, POST
│   │       ├── workflow/
│   │       │   └── route.ts                # GET /api/processes/workflow
│   │       ├── capacity/
│   │       │   └── route.ts                # GET /api/processes/capacity
│   │       ├── stats/
│   │       │   └── route.ts                # GET /api/processes/stats
│   │       └── [id]/
│   │           └── route.ts                # GET, PUT, DELETE /api/processes/[id]
│   └── [locale]/
│       └── (auth)/
│           └── dashboard/
│               └── processes/
│                   └── page.tsx            # Main dashboard page
```

---

## 🚀 **IMPLEMENTATION PHASES**

### **PHASE 1: Foundation Layer (Types, Validation, Database)**

#### Step 1.1: Create TypeScript Types
**File:** `src/types/process.ts`

```typescript
import type { processSchema } from '@/models/schema_new';

// Base types from schema
export type ProcessDb = typeof processSchema.$inferSelect;

export type Process = Omit<ProcessDb, 'createdAt' | 'updatedAt'> & {
  createdAt: string | Date;
  updatedAt: string | Date;
};

export type CreateProcessInput = typeof processSchema.$inferInsert;

export type UpdateProcessInput = Partial<Omit<CreateProcessInput, 'id' | 'ownerId' | 'createdAt' | 'updatedAt'>>;

// Process enums
export type ProcessCategory = 'production' | 'quality' | 'packaging' | 'maintenance' | 'support';

export type ProcessType = 'manual' | 'machine' | 'hybrid' | 'automated';

export type ProcessStatus = 'active' | 'inactive' | 'deprecated' | 'development';

// Process workflow types
export type ProcessDependency = {
  processCode: string;
  dependsOn: string[];
  isOptional: boolean;
  parallelWith?: string[];
};

export type ProcessSequence = {
  processCode: string;
  sequenceOrder: number;
  isParallelAllowed: boolean;
  estimatedDuration: number;
  prerequisites: string[];
};

// Capacity management types
export type ProcessCapacity = {
  processCode: string;
  standardTimePerUnit: number; // minutes
  setupTime: number; // minutes
  defaultCapacityPerDay: number; // units
  maxCapacityPerDay: number; // units
  capacityUtilization: number; // percentage
  bottleneckRisk: 'low' | 'medium' | 'high';
};

// Quality control types
export type QualityStandards = {
  processCode: string;
  qualityCheckRequired: boolean;
  checkpoints: Array<{
    name: string;
    description: string;
    tolerance: number;
    unit: string;
  }>;
  defectTolerancePercent: number;
  qualityScore: number;
};

// SOP (Standard Operating Procedure) types
export type ProcessSOP = {
  processCode: string;
  sopDocumentUrl?: string;
  trainingRequired: string;
  skillLevelRequired: number; // 1-5
  certificationRequired: boolean;
  lastUpdated: Date;
  version: string;
};

// Outsourcing types
export type OutsourcingCapability = {
  processCode: string;
  isOutsourceable: boolean;
  outsourcingCost: number;
  qualityImpact: number;
  leadTimeImpact: number;
  recommendedVendors: string[];
};

// Filter types
export type ProcessFilters = {
  search: string;
  processCategory?: ProcessCategory;
  processType?: ProcessType;
  status?: ProcessStatus;
  department?: string;
  isOutsourceable?: boolean;
  qualityCheckRequired?: boolean;
  skillLevelRange?: {
    min: number;
    max: number;
  };
  sortBy: 'createdAt' | 'sequenceOrder' | 'processCode' | 'standardTimePerUnit' | 'defaultCapacityPerDay';
  sortOrder: 'asc' | 'desc';
};

// List parameters
export type ProcessListParams = {
  ownerId: string;
  page: number;
  limit: number;
} & Omit<ProcessFilters, 'search'> & {
  search?: string;
};

// Workflow analysis
export type WorkflowAnalysis = {
  totalProcesses: number;
  criticalPath: ProcessSequence[];
  bottlenecks: ProcessCapacity[];
  parallelOpportunities: Array<{
    processes: string[];
    timeSaving: number;
  }>;
  totalProductionTime: number;
  totalSetupTime: number;
};

// Statistics
export type ProcessStats = {
  total: number;
  byCategory: Record<ProcessCategory, number>;
  byType: Record<ProcessType, number>;
  byStatus: Record<ProcessStatus, number>;
  averageTimePerUnit: number;
  totalDailyCapacity: number;
  qualityProcesses: number;
  outsourceableProcesses: number;
  automatedProcesses: number;
  skillLevelDistribution: Record<number, number>;
};

// API Response types
export type ProcessesResponse = {
  success: true;
  data: Process[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    hasMore: boolean;
  };
};

export type ProcessResponse = {
  success: true;
  data: Process;
  message?: string;
};

export type ProcessStatsResponse = {
  success: true;
  data: ProcessStats;
};

export type ProcessWorkflowResponse = {
  success: true;
  data: WorkflowAnalysis;
};

export type ProcessErrorResponse = {
  success: false;
  error: string;
  code: string;
  details?: unknown;
};

// Form data
export type ProcessFormData = {
  processCode: string;
  processName: string;
  processCategory: ProcessCategory;
  processType: ProcessType;
  department?: string;
  sequenceOrder: number;
  isParallelAllowed: boolean;
  prerequisiteProcesses: string[];
  
  // Capacity
  standardTimePerUnit?: number;
  setupTime?: number;
  defaultCapacityPerDay?: number;
  
  // Quality
  qualityCheckRequired: boolean;
  qualityStandards?: string;
  defectTolerancePercent?: number;
  
  // Status & Configuration
  status: ProcessStatus;
  isOutsourceable: boolean;
  
  // Documentation
  description?: string;
  sopDocumentUrl?: string;
  trainingRequired?: string;
};

// Bulk operations
export type BulkProcessInput = {
  processes: Array<{
    processCode: string;
    processName: string;
    processCategory: ProcessCategory;
    sequenceOrder: number;
  }>;
  templateData: {
    processType: ProcessType;
    department?: string;
    status?: ProcessStatus;
  };
};
```

#### Step 1.2: Create Validation Schemas
**File:** `src/libs/validations/process.ts`

```typescript
import { z } from 'zod';

// Enum definitions
const ProcessCategory = z.enum(['production', 'quality', 'packaging', 'maintenance', 'support']);
const ProcessType = z.enum(['manual', 'machine', 'hybrid', 'automated']);
const ProcessStatus = z.enum(['active', 'inactive', 'deprecated', 'development']);

// Process code validation (CAT, MAY, THEU, DONG_GOI format)
const processCodeSchema = z.string().regex(
  /^[A-Z_]+$/,
  'Process code must contain only uppercase letters and underscores'
).min(2, 'Process code must be at least 2 characters').max(20, 'Process code must not exceed 20 characters');

// Time validation (minutes)
const timeSchema = z.number().int().min(1, 'Time must be at least 1 minute').max(1440, 'Time cannot exceed 24 hours');

// Capacity validation
const capacitySchema = z.number().int().min(1, 'Capacity must be at least 1 unit per day').max(10000, 'Capacity seems unreasonably high');

// Sequence order validation
const sequenceOrderSchema = z.number().int().min(1, 'Sequence order must start from 1').max(100, 'Sequence order cannot exceed 100');

// Quality tolerance validation
const qualityToleranceSchema = z.number().min(0, 'Quality tolerance must be non-negative').max(100, 'Quality tolerance cannot exceed 100%');

// Skill level validation
const skillLevelSchema = z.number().int().min(1, 'Skill level must be at least 1').max(5, 'Skill level cannot exceed 5');

// Main form schema
export const processFormSchema = z.object({
  processCode: processCodeSchema,
  processName: z.string().min(2, 'Process name must be at least 2 characters').max(100, 'Process name must not exceed 100 characters'),
  
  // Classification
  processCategory: ProcessCategory,
  processType: ProcessType,
  department: z.string().max(50, 'Department name must not exceed 50 characters').optional(),
  
  // Workflow & Sequencing
  sequenceOrder: sequenceOrderSchema,
  isParallelAllowed: z.boolean().default(false),
  prerequisiteProcesses: z.array(z.string()).default([]),
  
  // Time & Capacity Management
  standardTimePerUnit: timeSchema.optional(),
  setupTime: timeSchema.optional(),
  defaultCapacityPerDay: capacitySchema.optional(),
  
  // Quality & Standards
  qualityCheckRequired: z.boolean().default(true),
  qualityStandards: z.string().max(500, 'Quality standards must not exceed 500 characters').optional(),
  defectTolerancePercent: qualityToleranceSchema.optional(),
  
  // Status & Configuration
  status: ProcessStatus.default('active'),
  isOutsourceable: z.boolean().default(false),
  
  // Documentation
  description: z.string().max(1000, 'Description must not exceed 1000 characters').optional(),
  sopDocumentUrl: z.string().url('SOP document must be a valid URL').optional().or(z.literal('')),
  trainingRequired: z.string().max(500, 'Training requirements must not exceed 500 characters').optional(),
}).refine((data) => {
  // Validate setup time is reasonable compared to standard time
  if (data.setupTime && data.standardTimePerUnit && data.setupTime > data.standardTimePerUnit * 10) {
    return false;
  }
  return true;
}, {
  message: "Setup time seems unreasonably high compared to standard time per unit",
  path: ["setupTime"]
}).refine((data) => {
  // Validate capacity makes sense with time standards
  if (data.defaultCapacityPerDay && data.standardTimePerUnit) {
    const totalMinutesRequired = data.defaultCapacityPerDay * data.standardTimePerUnit;
    const workingMinutesPerDay = 8 * 60; // 8 hours
    if (totalMinutesRequired > workingMinutesPerDay * 2) { // Allow for some overtime
      return false;
    }
  }
  return true;
}, {
  message: "Daily capacity seems unrealistic based on standard time per unit",
  path: ["defaultCapacityPerDay"]
}).refine((data) => {
  // Validate quality standards are provided if quality check is required
  if (data.qualityCheckRequired && !data.qualityStandards) {
    return false;
  }
  return true;
}, {
  message: "Quality standards must be specified when quality check is required",
  path: ["qualityStandards"]
});

// CRUD schemas
export const createProcessSchema = processFormSchema;
export const updateProcessSchema = processFormSchema.partial();

// List parameters schema
export const processListParamsSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
  search: z.string().optional(),
  processCategory: ProcessCategory.optional(),
  processType: ProcessType.optional(),
  status: ProcessStatus.optional(),
  department: z.string().optional(),
  isOutsourceable: z.coerce.boolean().optional(),
  qualityCheckRequired: z.coerce.boolean().optional(),
  skillLevelMin: skillLevelSchema.optional(),
  skillLevelMax: skillLevelSchema.optional(),
  sortBy: z.enum(['createdAt', 'sequenceOrder', 'processCode', 'standardTimePerUnit', 'defaultCapacityPerDay']).default('sequenceOrder'),
  sortOrder: z.enum(['asc', 'desc']).default('asc'),
});

// Bulk creation schema
export const bulkProcessSchema = z.object({
  processes: z.array(z.object({
    processCode: processCodeSchema,
    processName: z.string().min(2).max(100),
    processCategory: ProcessCategory,
    sequenceOrder: sequenceOrderSchema,
  })).min(1, 'At least one process is required').max(20, 'Cannot create more than 20 processes at once'),
  templateData: z.object({
    processType: ProcessType,
    department: z.string().max(50).optional(),
    status: ProcessStatus.optional().default('active'),
  }),
});

// Workflow dependency schema
export const workflowDependencySchema = z.object({
  processes: z.array(z.object({
    processCode: z.string(),
    dependsOn: z.array(z.string()),
    isOptional: z.boolean().default(false),
  })),
});

// Validation functions
export function validateCreateProcess(data: unknown) {
  return createProcessSchema.parse(data);
}

export function validateUpdateProcess(data: unknown) {
  return updateProcessSchema.parse(data);
}

export function validateProcessListParams(data: unknown) {
  return processListParamsSchema.parse(data);
}

export function validateBulkProcess(data: unknown) {
  return bulkProcessSchema.parse(data);
}

export function validateWorkflowDependency(data: unknown) {
  return workflowDependencySchema.parse(data);
}

// Helper validation functions
export function validateProcessCode(code: string): {
  isValid: boolean;
  suggestions: string[];
  error?: string;
} {
  const pattern = /^[A-Z_]+$/;
  
  if (pattern.test(code) && code.length >= 2 && code.length <= 20) {
    return {
      isValid: true,
      suggestions: [],
    };
  }
  
  const suggestions = [
    'CAT', 'MAY', 'THEU', 'DONG_GOI', 'KIEM_TRA', 'BAO_QUAN',
    'CHAT_LUONG', 'DONG_GOI_DIEU', 'VAN_CHUYEN',
  ];
  
  return {
    isValid: false,
    suggestions: suggestions.filter(s => !s.includes(code.toUpperCase())),
    error: 'Process code must contain only uppercase letters and underscores, 2-20 characters',
  };
}

export function calculateProcessEfficiency(
  standardTime: number,
  actualTime: number,
  setupTime: number = 0
): {
  efficiency: number;
  rating: 'excellent' | 'good' | 'fair' | 'poor';
  recommendation: string;
} {
  const totalStandardTime = standardTime + setupTime;
  const efficiency = (totalStandardTime / actualTime) * 100;
  
  let rating: 'excellent' | 'good' | 'fair' | 'poor';
  let recommendation: string;
  
  if (efficiency >= 95) {
    rating = 'excellent';
    recommendation = 'Process is performing excellently';
  } else if (efficiency >= 85) {
    rating = 'good';
    recommendation = 'Process is performing well with minor room for improvement';
  } else if (efficiency >= 75) {
    rating = 'fair';
    recommendation = 'Process needs optimization to improve efficiency';
  } else {
    rating = 'poor';
    recommendation = 'Process requires immediate attention and optimization';
  }
  
  return {
    efficiency: Math.round(efficiency),
    rating,
    recommendation,
  };
}

export function validateWorkflowSequence(processes: Array<{ processCode: string; sequenceOrder: number; prerequisiteProcesses: string[] }>): {
  isValid: boolean;
  errors: string[];
  suggestions: string[];
} {
  const errors: string[] = [];
  const suggestions: string[] = [];
  
  // Check for duplicate sequence orders
  const sequences = processes.map(p => p.sequenceOrder);
  const duplicates = sequences.filter((seq, index) => sequences.indexOf(seq) !== index);
  if (duplicates.length > 0) {
    errors.push(`Duplicate sequence orders found: ${duplicates.join(', ')}`);
  }
  
  // Check for circular dependencies
  const processCodes = processes.map(p => p.processCode);
  for (const process of processes) {
    for (const prerequisite of process.prerequisiteProcesses) {
      if (!processCodes.includes(prerequisite)) {
        errors.push(`Process ${process.processCode} depends on non-existent process ${prerequisite}`);
      }
    }
  }
  
  // Check sequence order logic
  for (const process of processes) {
    const prerequisites = processes.filter(p => process.prerequisiteProcesses.includes(p.processCode));
    const invalidPrereqs = prerequisites.filter(p => p.sequenceOrder >= process.sequenceOrder);
    if (invalidPrereqs.length > 0) {
      errors.push(`Process ${process.processCode} has prerequisites with higher or equal sequence order`);
      suggestions.push(`Consider adjusting sequence order for ${process.processCode} or its prerequisites`);
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors,
    suggestions,
  };
}

export function generateProcessCapacityReport(processes: Array<{
  processCode: string;
  standardTimePerUnit: number;
  defaultCapacityPerDay: number;
  setupTime: number;
}>): {
  totalDailyCapacity: number;
  bottlenecks: string[];
  utilizationReport: Array<{
    processCode: string;
    utilization: number;
    isBottleneck: boolean;
  }>;
} {
  const workingMinutesPerDay = 8 * 60; // 8 hours
  
  const utilizationReport = processes.map(process => {
    const totalTimeRequired = (process.standardTimePerUnit * process.defaultCapacityPerDay) + process.setupTime;
    const utilization = (totalTimeRequired / workingMinutesPerDay) * 100;
    const isBottleneck = utilization > 90;
    
    return {
      processCode: process.processCode,
      utilization: Math.round(utilization),
      isBottleneck,
    };
  });
  
  const bottlenecks = utilizationReport.filter(r => r.isBottleneck).map(r => r.processCode);
  const totalDailyCapacity = Math.min(...processes.map(p => p.defaultCapacityPerDay));
  
  return {
    totalDailyCapacity,
    bottlenecks,
    utilizationReport,
  };
}
```

#### Step 1.3: Create Database Queries
**File:** `src/libs/queries/process.ts`

```typescript
import { and, asc, count, desc, eq, gte, ilike, lte, or } from 'drizzle-orm';
import { db } from '@/libs/DB';
import { processSchema } from '@/models/schema_new';
import type {
  CreateProcessInput,
  ProcessDb,
  ProcessListParams,
  UpdateProcessInput,
  BulkProcessInput,
  ProcessStats,
  WorkflowAnalysis,
} from '@/types/process';

// CREATE operations
export async function createProcess(data: CreateProcessInput): Promise<ProcessDb> {
  // Check for duplicate process code
  const existing = await db
    .select()
    .from(processSchema)
    .where(and(
      eq(processSchema.ownerId, data.ownerId),
      eq(processSchema.processCode, data.processCode)
    ))
    .limit(1);

  if (existing.length > 0) {
    throw new Error('Process code already exists');
  }

  // Validate sequence order uniqueness
  if (data.sequenceOrder) {
    const sameSequence = await db
      .select()
      .from(processSchema)
      .where(and(
        eq(processSchema.ownerId, data.ownerId),
        eq(processSchema.sequenceOrder, data.sequenceOrder)
      ))
      .limit(1);

    if (sameSequence.length > 0) {
      throw new Error(`Sequence order ${data.sequenceOrder} is already taken`);
    }
  }

  const [process] = await db
    .insert(processSchema)
    .values(data)
    .returning();

  if (!process) {
    throw new Error('Failed to create process');
  }

  return process;
}

// Bulk create for standard processes
export async function createBulkProcesses(
  data: BulkProcessInput,
  ownerId: string
): Promise<ProcessDb[]> {
  // Check for existing process codes
  const existingCodes = await db
    .select({ processCode: processSchema.processCode })
    .from(processSchema)
    .where(eq(processSchema.ownerId, ownerId));

  const existingCodesSet = new Set(existingCodes.map(p => p.processCode));
  const newProcesses = data.processes.filter(p => !existingCodesSet.has(p.processCode));

  if (newProcesses.length === 0) {
    throw new Error('All process codes already exist');
  }

  // Prepare bulk insert data
  const insertData = newProcesses.map(process => ({
    ownerId,
    processCode: process.processCode,
    processName: process.processName,
    processCategory: process.processCategory,
    sequenceOrder: process.sequenceOrder,
    processType: data.templateData.processType,
    department: data.templateData.department,
    status: data.templateData.status || 'active',
    isParallelAllowed: false,
    qualityCheckRequired: true,
    isOutsourceable: false,
  }));

  const processes = await db
    .insert(processSchema)
    .values(insertData)
    .returning();

  return processes;
}

// READ operations
export async function getProcessById(id: number, ownerId: string): Promise<ProcessDb | null> {
  const [process] = await db
    .select()
    .from(processSchema)
    .where(and(
      eq(processSchema.id, id),
      eq(processSchema.ownerId, ownerId)
    ))
    .limit(1);

  return process || null;
}

export async function getProcessByCode(processCode: string, ownerId: string): Promise<ProcessDb | null> {
  const [process] = await db
    .select()
    .from(processSchema)
    .where(and(
      eq(processSchema.ownerId, ownerId),
      eq(processSchema.processCode, processCode)
    ))
    .limit(1);

  return process || null;
}

// List with pagination and filtering
export async function getPaginatedProcesses(params: ProcessListParams) {
  const { 
    ownerId, page, limit, search, processCategory, processType, status, 
    department, isOutsourceable, qualityCheckRequired, skillLevelMin, skillLevelMax,
    sortBy, sortOrder 
  } = params;
  const offset = (page - 1) * limit;

  // Build where conditions
  const whereConditions = [eq(processSchema.ownerId, ownerId)];

  if (search) {
    whereConditions.push(
      or(
        ilike(processSchema.processCode, `%${search}%`),
        ilike(processSchema.processName, `%${search}%`),
        ilike(processSchema.description, `%${search}%`)
      )
    );
  }

  if (processCategory) {
    whereConditions.push(eq(processSchema.processCategory, processCategory));
  }

  if (processType) {
    whereConditions.push(eq(processSchema.processType, processType));
  }

  if (status) {
    whereConditions.push(eq(processSchema.status, status));
  }

  if (department) {
    whereConditions.push(eq(processSchema.department, department));
  }

  if (isOutsourceable !== undefined) {
    whereConditions.push(eq(processSchema.isOutsourceable, isOutsourceable));
  }

  if (qualityCheckRequired !== undefined) {
    whereConditions.push(eq(processSchema.qualityCheckRequired, qualityCheckRequired));
  }

  // Order by clause - default to sequence order for workflow view
  const orderColumn = processSchema[sortBy] || processSchema.sequenceOrder;
  const orderDirection = sortOrder === 'asc' ? asc(orderColumn) : desc(orderColumn);

  // Execute queries
  const [processes, [{ total }]] = await Promise.all([
    db
      .select()
      .from(processSchema)
      .where(and(...whereConditions))
      .orderBy(orderDirection)
      .limit(limit)
      .offset(offset),
    
    db
      .select({ total: count() })
      .from(processSchema)
      .where(and(...whereConditions))
  ]);

  return {
    processes,
    pagination: {
      page,
      limit,
      total,
      hasMore: offset + processes.length < total,
    },
  };
}

// Get workflow sequence
export async function getProcessWorkflow(ownerId: string): Promise<WorkflowAnalysis> {
  const processes = await db
    .select()
    .from(processSchema)
    .where(and(
      eq(processSchema.ownerId, ownerId),
      eq(processSchema.status, 'active')
    ))
    .orderBy(asc(processSchema.sequenceOrder));

  // Calculate workflow analysis
  const criticalPath = processes.map(p => ({
    processCode: p.processCode,
    sequenceOrder: p.sequenceOrder,
    isParallelAllowed: p.isParallelAllowed,
    estimatedDuration: p.standardTimePerUnit || 0,
    prerequisites: p.prerequisiteProcesses || [],
  }));

  // Identify bottlenecks based on capacity
  const bottlenecks = processes
    .filter(p => {
      if (!p.standardTimePerUnit || !p.defaultCapacityPerDay) return false;
      const totalTime = p.standardTimePerUnit * p.defaultCapacityPerDay;
      const workingMinutes = 8 * 60; // 8 hours
      return totalTime > workingMinutes * 0.9; // 90% utilization threshold
    })
    .map(p => ({
      processCode: p.processCode,
      standardTimePerUnit: p.standardTimePerUnit || 0,
      setupTime: p.setupTime || 0,
      defaultCapacityPerDay: p.defaultCapacityPerDay || 0,
      maxCapacityPerDay: p.defaultCapacityPerDay || 0,
      capacityUtilization: 90, // Calculated value
      bottleneckRisk: 'high' as const,
    }));

  // Find parallel opportunities
  const parallelOpportunities = processes
    .filter(p => p.isParallelAllowed)
    .reduce((acc, process) => {
      const parallelWith = processes.filter(other => 
        other.isParallelAllowed && 
        other.sequenceOrder === process.sequenceOrder &&
        other.processCode !== process.processCode
      );
      
      if (parallelWith.length > 0) {
        acc.push({
          processes: [process.processCode, ...parallelWith.map(p => p.processCode)],
          timeSaving: Math.max(...parallelWith.map(p => p.standardTimePerUnit || 0)),
        });
      }
      
      return acc;
    }, [] as Array<{ processes: string[]; timeSaving: number }>);

  const totalProductionTime = processes.reduce((sum, p) => sum + (p.standardTimePerUnit || 0), 0);
  const totalSetupTime = processes.reduce((sum, p) => sum + (p.setupTime || 0), 0);

  return {
    totalProcesses: processes.length,
    criticalPath,
    bottlenecks,
    parallelOpportunities,
    totalProductionTime,
    totalSetupTime,
  };
}

// Get processes by category
export async function getProcessesByCategory(category: string, ownerId: string): Promise<ProcessDb[]> {
  return await db
    .select()
    .from(processSchema)
    .where(and(
      eq(processSchema.ownerId, ownerId),
      eq(processSchema.processCategory, category)
    ))
    .orderBy(asc(processSchema.sequenceOrder));
}

// UPDATE operations
export async function updateProcess(
  id: number,
  ownerId: string,
  data: UpdateProcessInput
): Promise<ProcessDb> {
  // If updating process code, check for duplicates
  if (data.processCode) {
    const existing = await db
      .select()
      .from(processSchema)
      .where(and(
        eq(processSchema.ownerId, ownerId),
        eq(processSchema.processCode, data.processCode)
      ))
      .limit(1);

    if (existing.length > 0 && existing[0].id !== id) {
      throw new Error('Process code already exists');
    }
  }

  // If updating sequence order, check for duplicates
  if (data.sequenceOrder) {
    const existing = await db
      .select()
      .from(processSchema)
      .where(and(
        eq(processSchema.ownerId, ownerId),
        eq(processSchema.sequenceOrder, data.sequenceOrder)
      ))
      .limit(1);

    if (existing.length > 0 && existing[0].id !== id) {
      throw new Error(`Sequence order ${data.sequenceOrder} is already taken`);
    }
  }

  const [updated] = await db
    .update(processSchema)
    .set(data)
    .where(and(
      eq(processSchema.id, id),
      eq(processSchema.ownerId, ownerId)
    ))
    .returning();

  if (!updated) {
    throw new Error('Process not found or failed to update');
  }

  return updated;
}

// Reorder processes
export async function reorderProcesses(
  processUpdates: Array<{ id: number; sequenceOrder: number }>,
  ownerId: string
): Promise<ProcessDb[]> {
  const updates: Promise<ProcessDb>[] = [];

  for (const update of processUpdates) {
    updates.push(updateProcess(update.id, ownerId, { sequenceOrder: update.sequenceOrder }));
  }

  return await Promise.all(updates);
}

// DELETE operations
export async function deleteProcess(id: number, ownerId: string): Promise<void> {
  // Check if process is referenced by other processes as prerequisite
  const referencingProcesses = await db
    .select()
    .from(processSchema)
    .where(eq(processSchema.ownerId, ownerId));

  const processToDelete = await getProcessById(id, ownerId);
  if (!processToDelete) {
    throw new Error('Process not found');
  }

  const hasReferences = referencingProcesses.some(p => 
    (p.prerequisiteProcesses || []).includes(processToDelete.processCode)
  );

  if (hasReferences) {
    throw new Error('Cannot delete process that is referenced as prerequisite by other processes');
  }

  const result = await db
    .delete(processSchema)
    .where(and(
      eq(processSchema.id, id),
      eq(processSchema.ownerId, ownerId)
    ));

  if (result.rowCount === 0) {
    throw new Error('Process not found');
  }
}

// STATISTICS
export async function getProcessStats(ownerId: string): Promise<ProcessStats> {
  const [basicStats] = await db
    .select({
      total: count(),
      active: count(eq(processSchema.status, 'active')),
      inactive: count(eq(processSchema.status, 'inactive')),
      deprecated: count(eq(processSchema.status, 'deprecated')),
      development: count(eq(processSchema.status, 'development')),
    })
    .from(processSchema)
    .where(eq(processSchema.ownerId, ownerId));

  const categoryStats = await db
    .select({
      processCategory: processSchema.processCategory,
      count: count(),
    })
    .from(processSchema)
    .where(eq(processSchema.ownerId, ownerId))
    .groupBy(processSchema.processCategory);

  const typeStats = await db
    .select({
      processType: processSchema.processType,
      count: count(),
    })
    .from(processSchema)
    .where(eq(processSchema.ownerId, ownerId))
    .groupBy(processSchema.processType);

  return {
    total: basicStats?.total || 0,
    byCategory: Object.fromEntries(categoryStats.map(c => [c.processCategory, c.count])),
    byType: Object.fromEntries(typeStats.map(t => [t.processType, t.count])),
    byStatus: {
      active: basicStats?.active || 0,
      inactive: basicStats?.inactive || 0,
      deprecated: basicStats?.deprecated || 0,
      development: basicStats?.development || 0,
    },
    averageTimePerUnit: 0, // Will be calculated from non-null standardTimePerUnit values
    totalDailyCapacity: 0, // Will be calculated from sum of defaultCapacityPerDay
    qualityProcesses: 0,   // Will be calculated from qualityCheckRequired = true
    outsourceableProcesses: 0, // Will be calculated from isOutsourceable = true
    automatedProcesses: 0, // Will be calculated from processType = 'automated'
    skillLevelDistribution: {}, // Will be calculated if skill level data available
  };
}

// Helper functions
export async function processExists(id: number, ownerId: string): Promise<boolean> {
  const [result] = await db
    .select({ id: processSchema.id })
    .from(processSchema)
    .where(and(
      eq(processSchema.id, id),
      eq(processSchema.ownerId, ownerId)
    ))
    .limit(1);

  return !!result;
}

export async function getNextSequenceOrder(ownerId: string): Promise<number> {
  const [maxSequence] = await db
    .select({ max: processSchema.sequenceOrder })
    .from(processSchema)
    .where(eq(processSchema.ownerId, ownerId))
    .limit(1);

  return (maxSequence?.max || 0) + 1;
}

export async function getDepartments(ownerId: string): Promise<string[]> {
  const departments = await db
    .select({ department: processSchema.department })
    .from(processSchema)
    .where(and(
      eq(processSchema.ownerId, ownerId),
      eq(processSchema.department, processSchema.department) // NOT NULL condition
    ))
    .groupBy(processSchema.department);

  return departments.map(d => d.department).filter(Boolean);
}
```

### **PHASE 2: API Layer**

#### Step 2.1: Main API Route
**File:** `src/app/api/processes/route.ts`

```typescript
import { auth } from '@clerk/nextjs/server';
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { ZodError } from 'zod';

import { 
  createProcess, 
  createBulkProcesses,
  getPaginatedProcesses 
} from '@/libs/queries/process';
import {
  validateCreateProcess,
  validateProcessListParams,
  validateBulkProcess,
} from '@/libs/validations/process';

// GET /api/processes
export async function GET(request: NextRequest) {
  try {
    const { userId, orgId } = await auth();
    if (!userId) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const ownerId = orgId || userId;
    const { searchParams } = new URL(request.url);

    const queryParams = {
      page: searchParams.get('page') || undefined,
      limit: searchParams.get('limit') || undefined,
      search: searchParams.get('search') || undefined,
      processCategory: searchParams.get('processCategory') || undefined,
      processType: searchParams.get('processType') || undefined,
      status: searchParams.get('status') || undefined,
      department: searchParams.get('department') || undefined,
      isOutsourceable: searchParams.get('isOutsourceable') || undefined,
      qualityCheckRequired: searchParams.get('qualityCheckRequired') || undefined,
      sortBy: searchParams.get('sortBy') || undefined,
      sortOrder: searchParams.get('sortOrder') || undefined,
    };

    const validatedParams = { ...validateProcessListParams(queryParams), ownerId };
    const result = await getPaginatedProcesses(validatedParams);

    return NextResponse.json({
      success: true,
      data: result.processes,
      pagination: result.pagination,
    });
  } catch (error) {
    console.error('Error fetching processes:', error);
    
    if (error instanceof ZodError) {
      return NextResponse.json(
        { success: false, error: 'Invalid request parameters', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/processes
export async function POST(request: NextRequest) {
  try {
    const { userId, orgId } = await auth();
    if (!userId) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const ownerId = orgId || userId;
    const body = await request.json();

    // Check if it's a bulk creation request
    if (body.processes && Array.isArray(body.processes)) {
      const validatedData = validateBulkProcess(body);
      const processes = await createBulkProcesses(validatedData, ownerId);

      return NextResponse.json(
        { 
          success: true, 
          data: processes, 
          message: `${processes.length} processes created successfully` 
        },
        { status: 201 }
      );
    } else {
      // Single process creation
      const validatedData = validateCreateProcess(body);
      const process = await createProcess({
        ...validatedData,
        ownerId,
      });

      return NextResponse.json(
        { success: true, data: process, message: 'Process created successfully' },
        { status: 201 }
      );
    }
  } catch (error) {
    console.error('Error creating process:', error);
    
    if (error instanceof ZodError) {
      return NextResponse.json(
        { success: false, error: 'Invalid request data', details: error.errors },
        { status: 400 }
      );
    }

    if (error instanceof Error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 400 });
    }

    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
```

#### Step 2.2: Workflow Analysis Route
**File:** `src/app/api/processes/workflow/route.ts`

```typescript
import { auth } from '@clerk/nextjs/server';
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

import { getProcessWorkflow } from '@/libs/queries/process';

// GET /api/processes/workflow
export async function GET(request: NextRequest) {
  try {
    const { userId, orgId } = await auth();
    if (!userId) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const ownerId = orgId || userId;
    const workflowAnalysis = await getProcessWorkflow(ownerId);

    return NextResponse.json({
      success: true,
      data: workflowAnalysis,
    });
  } catch (error) {
    console.error('Error fetching workflow analysis:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
```

### **PHASE 3: Client API & Hooks Layer**

#### Step 3.1: Client API Functions
**File:** `src/libs/api/process.ts`

```typescript
// Following todos pattern but with Process-specific features
export async function fetchProcesses(params = {}) {
  // Implementation following fetchTodos pattern
  // Additional parameters for workflow, capacity filtering
}

export async function createProcess(data) {
  // Implementation following createTodo pattern
}

export async function createBulkProcesses(data) {
  // New functionality for bulk process creation
}

export async function fetchProcessWorkflow() {
  // New functionality for workflow analysis
}

export async function updateProcess(id, data) {
  // Implementation following updateTodo pattern
}

export async function deleteProcess(id) {
  // Implementation following deleteTodo pattern
}

export async function fetchProcessStats() {
  // Implementation following fetchTodoStats pattern
}
```

### **PHASE 4: UI Components Layer**

#### Step 4.1: Workflow Visualization Component
**File:** `src/features/process/ProcessWorkflow.tsx`

```typescript
// Specialized component for workflow visualization
// - Process sequence diagram
// - Dependency visualization
// - Parallel process indicators
// - Bottleneck highlighting
// - Critical path display
```

#### Step 4.2: Capacity Management Component
**File:** `src/features/process/ProcessCapacity.tsx`

```typescript
// Real-time capacity analysis component
// - Time standards input
// - Capacity calculations
// - Utilization charts
// - Bottleneck warnings
// - Optimization suggestions
```

#### Step 4.3: List Component
**File:** `src/features/process/ProcessList.tsx`

```typescript
// Following TodoList pattern but with:
// - Workflow sequence view
// - Category-based filtering
// - Capacity indicators
// - Quality status display
// - Outsourcing flags
```

### **PHASE 5: Page Integration**

#### Step 5.1: Dashboard Page
**File:** `src/app/[locale]/(auth)/dashboard/processes/page.tsx`

```typescript
// Following TodosPage pattern but with:
// - Workflow overview dashboard
// - Capacity analysis charts
// - Process sequencing tools
// - Quality management interface
// - SOP management links
```

---

## 🧪 **TESTING STRATEGY**

### Focus Areas:
1. **Process code validation** (CAT, MAY, THEU format)
2. **Sequence order management** (uniqueness and workflow logic)
3. **Capacity calculations** (time standards and daily capacity)
4. **Quality standards validation**
5. **Workflow dependency validation** (prerequisite logic)
6. **SOP and training integration**

---

## ✅ **ACCEPTANCE CRITERIA**

### Functional Requirements:
- [ ] Create processes with unique process codes
- [ ] Manage workflow sequencing and dependencies
- [ ] Calculate and validate capacity requirements
- [ ] Define quality standards and tolerances
- [ ] Configure outsourcing capabilities
- [ ] List with workflow and capacity filtering
- [ ] Search by process code, name, description
- [ ] Edit with business rule validation
- [ ] Delete with dependency checking
- [ ] Workflow analysis and visualization
- [ ] SOP and training management

### Technical Requirements:
- [ ] Process code uniqueness per owner
- [ ] Sequence order uniqueness and validation
- [ ] Capacity calculation accuracy
- [ ] Workflow dependency validation
- [ ] Quality standards integration
- [ ] Performance optimization for workflow queries

### Business Rules:
- [ ] Unique process codes per owner
- [ ] Unique sequence orders per workflow
- [ ] Prerequisites must have lower sequence order
- [ ] Capacity must be realistic based on time standards
- [ ] Quality standards required when quality check enabled
- [ ] Cannot delete processes referenced as prerequisites

---

## 🚀 **GETTING STARTED**

1. **Start with Core Processes**: Create basic CAT, MAY, THEU processes
2. **Sequence Management**: Focus on workflow ordering
3. **Capacity Planning**: Build time and capacity features
4. **Quality Integration**: Add quality control features
5. **Workflow Analysis**: Implement dependency visualization

**Estimated Timeline**: 1.5-2 weeks

**Key Features**: Process workflow management, capacity planning, quality control

This plan provides a comprehensive process management system with workflow optimization and capacity planning capabilities.