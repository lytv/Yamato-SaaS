import { z } from 'zod';

// Enum schemas
const TableTypeSchema = z.enum(['cutting', 'sewing', 'embroidery', 'packing', 'quality_control', 'other']);
const WorkTableStatusSchema = z.enum(['active', 'maintenance', 'offline', 'repair', 'decommissioned']);

const DimensionSchema = z.number().min(0.1).max(999.99).multipleOf(0.01);
const PercentageSchema = z.number().min(0).max(100).multipleOf(0.01);
const CapacitySchema = z.number().int().min(1).max(99999);

const OptionalDateSchema = z.union([
  z.string().datetime(),
  z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  z.null(),
  z.undefined(),
]).optional().nullable();

// Define the base object for work table
const CreateWorkTableBase = z.object({
  ownerId: z.string().min(1, 'Owner ID is required'),
  tableCode: z.string()
    .min(1, 'Table code is required')
    .max(20, 'Table code must be less than 20 characters')
    .regex(/^[\w-]+$/, 'Table code must be alphanumeric with underscores or hyphens'),
  tableName: z.string().max(100, 'Table name must be less than 100 characters'),
  tableDetail: z.string().max(200, 'Table detail must be less than 200 characters').optional(),
  tableType: TableTypeSchema,
});

export const CreateWorkTableSchema = CreateWorkTableBase;

export const UpdateWorkTableSchema = z.object({
  tableCode: z.string()
    .min(1, 'Table code is required')
    .max(20, 'Table code must be less than 20 characters')
    .regex(/^[\w-]+$/, 'Table code must be alphanumeric with underscores or hyphens')
    .optional(),
  tableName: z.string().max(100, 'Table name must be less than 100 characters').optional(),
  tableDetail: z.string().max(200, 'Table detail must be less than 200 characters').optional(),
  tableType: TableTypeSchema.optional(),
  tableCategory: z.number().int().min(1).max(999).optional(),
  capacityPerDay: CapacitySchema.optional(),
  capacityPerHour: CapacitySchema.optional(),
  tableSizeLength: DimensionSchema.optional(),
  tableSizeWidth: DimensionSchema.optional(),
  locationCode: z.string().max(50, 'Location code must be less than 50 characters').optional(),
  department: z.string().max(100, 'Department must be less than 100 characters').optional(),
  assignedOperator: z.string().max(100, 'Assigned operator must be less than 100 characters').optional(),
  supervisor: z.string().max(100, 'Supervisor must be less than 100 characters').optional(),
  status: WorkTableStatusSchema.optional(),
  availabilitySchedule: z.string().max(500, 'Availability schedule must be less than 500 characters').optional(),
  lastMaintenanceDate: OptionalDateSchema,
  nextMaintenanceDate: OptionalDateSchema,
  equipmentModel: z.string().max(100, 'Equipment model must be less than 100 characters').optional(),
  installationDate: OptionalDateSchema,
  warrantyExpiryDate: OptionalDateSchema,
  utilizationRate: PercentageSchema.optional(),
  efficiencyRating: PercentageSchema.optional(),
  totalProcessedUnits: z.number().int().min(0).optional(),
  specialCapabilities: z.string().max(1000, 'Special capabilities must be less than 1000 characters').optional(),
  limitations: z.string().max(1000, 'Limitations must be less than 1000 characters').optional(),
  note: z.string().max(500, 'Note must be less than 500 characters').optional(),
}).partial()
  .refine(
    (data: Record<string, unknown>) => Object.keys(data).length > 0,
    { message: 'At least one field must be provided for update' },
  );

export const WorkTableIdSchema = z.object({
  id: z.coerce.number().int().positive('Work table ID must be a positive integer'),
});

export const WorkTableListParamsSchema = z.object({
  page: z.union([z.string(), z.number(), z.undefined(), z.null()])
    .transform((val) => {
      if (val === undefined || val === null) {
        return 1;
      }
      const num = typeof val === 'string' ? Number.parseInt(val, 10) : val;
      return Number.isNaN(num) ? 1 : num;
    })
    .pipe(z.number().int().min(1, 'Page must be at least 1')),
  limit: z.union([z.string(), z.number(), z.undefined(), z.null()])
    .transform((val) => {
      if (val === undefined || val === null) {
        return 10;
      }
      const num = typeof val === 'string' ? Number.parseInt(val, 10) : val;
      return Number.isNaN(num) ? 10 : num;
    })
    .pipe(z.number().int().min(1).max(100, 'Limit cannot exceed 100')),
  search: z.union([z.string(), z.undefined(), z.null()])
    .transform(val => val || undefined).optional(),
  sortBy: z.union([
    z.enum(['createdAt', 'updatedAt', 'tableName', 'tableCode', 'capacityPerDay', 'utilizationRate', 'efficiencyRating']),
    z.undefined(),
    z.null(),
  ]).transform(val =>
    val && ['createdAt', 'updatedAt', 'tableName', 'tableCode', 'capacityPerDay', 'utilizationRate', 'efficiencyRating'].includes(val)
      ? val
      : 'createdAt',
  ),
  sortOrder: z.union([z.enum(['asc', 'desc']), z.undefined(), z.null()])
    .transform(val => val && ['asc', 'desc'].includes(val) ? val : 'desc'),
  tableType: TableTypeSchema.optional(),
  status: WorkTableStatusSchema.optional(),
  department: z.string().optional(),
  locationCode: z.string().optional(),
  tableCategory: z.union([z.string(), z.number(), z.undefined(), z.null()])
    .transform((val) => {
      if (val === undefined || val === null) {
        return undefined;
      }
      const num = typeof val === 'string' ? Number.parseInt(val, 10) : val;
      return Number.isNaN(num) ? undefined : num;
    }).optional(),
  assignedOperator: z.string().optional(),
  supervisor: z.string().optional(),
  minCapacityPerDay: z.union([z.string(), z.number(), z.undefined(), z.null()])
    .transform((val) => {
      if (val === undefined || val === null) {
        return undefined;
      }
      const num = typeof val === 'string' ? Number.parseInt(val, 10) : val;
      return Number.isNaN(num) ? undefined : num;
    }).optional(),
  maxCapacityPerDay: z.union([z.string(), z.number(), z.undefined(), z.null()])
    .transform((val) => {
      if (val === undefined || val === null) {
        return undefined;
      }
      const num = typeof val === 'string' ? Number.parseInt(val, 10) : val;
      return Number.isNaN(num) ? undefined : num;
    }).optional(),
  minUtilizationRate: z.union([z.string(), z.number(), z.undefined(), z.null()])
    .transform((val) => {
      if (val === undefined || val === null) {
        return undefined;
      }
      const num = typeof val === 'string' ? Number.parseFloat(val) : val;
      return Number.isNaN(num) ? undefined : num;
    }).optional(),
  maxUtilizationRate: z.union([z.string(), z.number(), z.undefined(), z.null()])
    .transform((val) => {
      if (val === undefined || val === null) {
        return undefined;
      }
      const num = typeof val === 'string' ? Number.parseFloat(val) : val;
      return Number.isNaN(num) ? undefined : num;
    }).optional(),
  maintenanceDue: z.union([z.string(), z.boolean(), z.undefined(), z.null()])
    .transform((val) => {
      if (val === undefined || val === null) {
        return undefined;
      }
      if (typeof val === 'boolean') {
        return val;
      }
      return val === 'true';
    }).optional(),
  warrantyExpiring: z.union([z.string(), z.boolean(), z.undefined(), z.null()])
    .transform((val) => {
      if (val === undefined || val === null) {
        return undefined;
      }
      if (typeof val === 'boolean') {
        return val;
      }
      return val === 'true';
    }).optional(),
});

export const WorkTableFormSchema = z.object({
  tableCode: z.string().min(1, 'Table code is required').max(20),
  tableName: z.string().max(100),
  tableDetail: z.string().max(200).optional(),
  tableType: TableTypeSchema,
});

export const CreateWorkTableRequestSchema = CreateWorkTableBase.omit({ ownerId: true });
export const UpdateWorkTableRequestSchema = UpdateWorkTableSchema;

export type CreateWorkTableRequest = z.infer<typeof CreateWorkTableRequestSchema>;
export type UpdateWorkTableRequest = z.infer<typeof UpdateWorkTableRequestSchema>;
export type WorkTableListParams = z.infer<typeof WorkTableListParamsSchema>;
export type WorkTableFormData = z.infer<typeof WorkTableFormSchema>;

export function validateCreateWorkTable(data: unknown): any {
  const parsed = CreateWorkTableBase.parse(data);
  // No need to convert tableSizeLength or tableSizeWidth to string, as schema expects number
  // No need to convert utilizationRate or efficiencyRating to string, as schema expects number
  return parsed;
}
export function validateUpdateWorkTable(data: unknown): any {
  const parsed = UpdateWorkTableRequestSchema.parse(data);
  // No need to convert tableSizeLength or tableSizeWidth to string, as schema expects number
  return parsed;
}
export function validateWorkTableId(data: unknown): { id: number } {
  return WorkTableIdSchema.parse(data);
}
export function validateWorkTableListParams(data: unknown): WorkTableListParams {
  return WorkTableListParamsSchema.parse(data);
}
export function validateWorkTableForm(data: unknown): WorkTableFormData {
  return WorkTableFormSchema.parse(data);
}
export function calculateDaysBetween(startDate: string | Date, endDate: string | Date): number {
  const start = new Date(startDate);
  const end = new Date(endDate);
  const diffTime = Math.abs(end.getTime() - start.getTime());
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}
export function isMaintenanceDue(nextMaintenanceDate: string | Date | null): boolean {
  if (!nextMaintenanceDate) {
    return false;
  }
  const today = new Date();
  const maintenanceDate = new Date(nextMaintenanceDate);
  return maintenanceDate <= today;
}
export function isWarrantyExpiring(warrantyExpiryDate: string | Date | null, daysThreshold: number = 30): boolean {
  if (!warrantyExpiryDate) {
    return false;
  }
  const today = new Date();
  const expiryDate = new Date(warrantyExpiryDate);
  const diffTime = expiryDate.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays <= daysThreshold && diffDays > 0;
}
export function calculateEquipmentAge(installationDate: string | Date | null): number | null {
  if (!installationDate) {
    return null;
  }
  const today = new Date();
  const installation = new Date(installationDate);
  const diffTime = today.getTime() - installation.getTime();
  return Math.floor(diffTime / (1000 * 60 * 60 * 24 * 30));
}
