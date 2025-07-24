/**
 * OutsourceOrderReceipt validation schemas with Relations Support
 * Enhanced version with proper error handling, type safety and relationships
 * Generated based on existing pattern from outsourceOrderDetail validations
 */

import { z } from 'zod';

// Base schema without refine methods (for extending and form usage)
const baseOutsourceOrderReceiptSchema = z.object({
  outsourceOrderDetailId: z.number().int().min(1, 'Order Detail is required'),
  receiptNumber: z.string().trim().min(1, 'Receipt Number is required').max(50, 'Receipt Number must be 50 characters or less').regex(/^[\w-]+$/, 'Receipt Number can only contain letters, numbers, underscores and dashes'),
  receiptTitle: z.string().trim().max(200, 'Receipt Title must be 200 characters or less').optional(),
  receiptQuantity: z.number().int().min(1, 'Receipt Quantity must be at least 1'),
  receiptDate: z.preprocess(
    val => typeof val === 'string' ? new Date(val) : val,
    z.date({ required_error: 'Receipt Date is required', invalid_type_error: 'Invalid date' }),
  ),
  plannedReceiptDate: z.preprocess(
    val => val === undefined || val === '' ? undefined : (typeof val === 'string' ? new Date(val) : val),
    z.date({ invalid_type_error: 'Invalid date' }).optional(),
  ),
  qualityStatus: z.string().trim().max(50, 'Quality Status must be 50 characters or less').optional(),
  qualityScore: z.number().min(1, 'Quality Score must be at least 1').max(10, 'Quality Score must be at most 10').optional(),
  defectQuantity: z.number().int().min(0, 'Defect Quantity cannot be negative').optional(),
  reworkQuantity: z.number().int().min(0, 'Rework Quantity cannot be negative').optional(),
  qualityNotes: z.string().trim().optional(),
  receivedByUserId: z.string().min(1, 'Received By is required'),
  inspectedByUserId: z.string().trim().optional(),
  deliveredByUserId: z.string().trim().optional(),
  batchNumber: z.string().trim().max(100, 'Batch Number must be 100 characters or less').optional(),
  storageLocation: z.string().trim().max(200, 'Storage Location must be 200 characters or less').optional(),
  warehouseCode: z.string().trim().max(50, 'Warehouse Code must be 50 characters or less').optional(),
  actualUnitCost: z.preprocess(
    (val) => {
      // Handle empty string, null, undefined
      if (val === undefined || val === null || val === '') {
        return undefined;
      }
      // Handle whitespace-only strings
      if (typeof val === 'string' && val.trim() === '') {
        return undefined;
      }
      // Convert to number
      const num = Number(val);
      // Return undefined if conversion results in NaN
      return Number.isNaN(num) ? undefined : num;
    },
    z.number().min(0, 'Actual Unit Cost cannot be negative').optional(),
  ),
  totalCost: z.preprocess(
    (val) => {
      // Handle empty string, null, undefined
      if (val === undefined || val === null || val === '') {
        return undefined;
      }
      // Handle whitespace-only strings
      if (typeof val === 'string' && val.trim() === '') {
        return undefined;
      }
      // Convert to number
      const num = Number(val);
      // Return undefined if conversion results in NaN
      return Number.isNaN(num) ? undefined : num;
    },
    z.number().min(0, 'Total Cost cannot be negative').optional(),
  ),
  notes: z.string().trim().optional(),
  attachments: z.string().trim().optional(),
  status: z.string().trim().max(50, 'Status must be 50 characters or less').optional(),
  isPartialReceipt: z.boolean().optional(),
});

// Form schema for React Hook Form (clean ZodObject without refine)
export const outsourceOrderReceiptFormSchema = baseOutsourceOrderReceiptSchema;

// Enhanced validation with custom rules (for API validation)
export const outsourceOrderReceiptValidationSchema = baseOutsourceOrderReceiptSchema.refine((data) => {
  // Ensure defectQuantity doesn't exceed receiptQuantity
  if (data.defectQuantity !== undefined && data.defectQuantity > data.receiptQuantity) {
    return false;
  }
  return true;
}, {
  message: 'Defect Quantity cannot exceed Receipt Quantity',
  path: ['defectQuantity'],
}).refine((data) => {
  // Ensure reworkQuantity doesn't exceed receiptQuantity
  if (data.reworkQuantity !== undefined && data.reworkQuantity > data.receiptQuantity) {
    return false;
  }
  return true;
}, {
  message: 'Rework Quantity cannot exceed Receipt Quantity',
  path: ['reworkQuantity'],
}).refine((data) => {
  // Ensure defectQuantity + reworkQuantity doesn't exceed receiptQuantity
  const defects = data.defectQuantity || 0;
  const rework = data.reworkQuantity || 0;
  if (defects + rework > data.receiptQuantity) {
    return false;
  }
  return true;
}, {
  message: 'Total of Defect and Rework Quantities cannot exceed Receipt Quantity',
  path: ['reworkQuantity'],
}).refine((data) => {
  // Ensure receiptDate is not in the future (allow today)
  if (data.receiptDate) {
    const today = new Date();
    today.setHours(23, 59, 59, 999); // End of today
    return data.receiptDate <= today;
  }
  return true;
}, {
  message: 'Receipt Date cannot be in the future',
  path: ['receiptDate'],
});

// Create outsourceOrderReceipt schema (for API validation with all rules)
export const createOutsourceOrderReceiptSchema = baseOutsourceOrderReceiptSchema.extend({
  ownerId: z.string().min(1, 'Owner ID is required'),
}).refine((data) => {
  // Ensure defectQuantity doesn't exceed receiptQuantity
  if (data.defectQuantity !== undefined && data.defectQuantity > data.receiptQuantity) {
    return false;
  }
  return true;
}, {
  message: 'Defect Quantity cannot exceed Receipt Quantity',
  path: ['defectQuantity'],
}).refine((data) => {
  // Ensure reworkQuantity doesn't exceed receiptQuantity
  if (data.reworkQuantity !== undefined && data.reworkQuantity > data.receiptQuantity) {
    return false;
  }
  return true;
}, {
  message: 'Rework Quantity cannot exceed Receipt Quantity',
  path: ['reworkQuantity'],
}).refine((data) => {
  // Ensure defectQuantity + reworkQuantity doesn't exceed receiptQuantity
  const defects = data.defectQuantity || 0;
  const rework = data.reworkQuantity || 0;
  if (defects + rework > data.receiptQuantity) {
    return false;
  }
  return true;
}, {
  message: 'Total of Defect and Rework Quantities cannot exceed Receipt Quantity',
  path: ['reworkQuantity'],
}).refine((data) => {
  // Ensure receiptDate is not in the future (allow today)
  if (data.receiptDate) {
    const today = new Date();
    today.setHours(23, 59, 59, 999); // End of today
    return data.receiptDate <= today;
  }
  return true;
}, {
  message: 'Receipt Date cannot be in the future',
  path: ['receiptDate'],
});

// Update outsourceOrderReceipt schema (all fields optional except validation consistency)
export const updateOutsourceOrderReceiptSchema = z.object({
  outsourceOrderDetailId: z.number().int().min(1).optional(),
  receiptNumber: z.string().trim().max(50, 'Receipt Number must be 50 characters or less').regex(/^[\w-]+$/, 'Receipt Number can only contain letters, numbers, underscores and dashes').optional(),
  receiptTitle: z.string().trim().max(200, 'Receipt Title must be 200 characters or less').optional(),
  receiptQuantity: z.number().int().min(1, 'Receipt Quantity must be at least 1').optional(),
  receiptDate: z.preprocess(
    val => typeof val === 'string' ? new Date(val) : val,
    z.date({ invalid_type_error: 'Invalid date' }).optional(),
  ),
  plannedReceiptDate: z.preprocess(
    val => val === undefined || val === '' ? undefined : (typeof val === 'string' ? new Date(val) : val),
    z.date({ invalid_type_error: 'Invalid date' }).optional(),
  ),
  qualityStatus: z.string().trim().max(50, 'Quality Status must be 50 characters or less').optional(),
  qualityScore: z.number().min(1, 'Quality Score must be at least 1').max(10, 'Quality Score must be at most 10').optional(),
  defectQuantity: z.number().int().min(0, 'Defect Quantity cannot be negative').optional(),
  reworkQuantity: z.number().int().min(0, 'Rework Quantity cannot be negative').optional(),
  qualityNotes: z.string().trim().optional(),
  receivedByUserId: z.string().optional(),
  inspectedByUserId: z.string().trim().optional(),
  deliveredByUserId: z.string().trim().optional(),
  batchNumber: z.string().trim().max(100, 'Batch Number must be 100 characters or less').optional(),
  storageLocation: z.string().trim().max(200, 'Storage Location must be 200 characters or less').optional(),
  warehouseCode: z.string().trim().max(50, 'Warehouse Code must be 50 characters or less').optional(),
  actualUnitCost: z.preprocess(
    (val) => {
      if (val === undefined || val === null || val === '') {
        return undefined;
      }
      if (typeof val === 'string' && val.trim() === '') {
        return undefined;
      }
      const num = Number(val);
      return Number.isNaN(num) ? undefined : num;
    },
    z.number().min(0, 'Actual Unit Cost cannot be negative').optional(),
  ),
  totalCost: z.preprocess(
    (val) => {
      if (val === undefined || val === null || val === '') {
        return undefined;
      }
      if (typeof val === 'string' && val.trim() === '') {
        return undefined;
      }
      const num = Number(val);
      return Number.isNaN(num) ? undefined : num;
    },
    z.number().min(0, 'Total Cost cannot be negative').optional(),
  ),
  notes: z.string().trim().optional(),
  attachments: z.string().trim().optional(),
  status: z.string().trim().max(50, 'Status must be 50 characters or less').optional(),
  isPartialReceipt: z.boolean().optional(),
}).refine((data) => {
  // Ensure defectQuantity doesn't exceed receiptQuantity (if both provided)
  if (data.defectQuantity !== undefined && data.receiptQuantity !== undefined && 
      data.defectQuantity > data.receiptQuantity) {
    return false;
  }
  return true;
}, {
  message: 'Defect Quantity cannot exceed Receipt Quantity',
  path: ['defectQuantity'],
}).refine((data) => {
  // Ensure reworkQuantity doesn't exceed receiptQuantity (if both provided)
  if (data.reworkQuantity !== undefined && data.receiptQuantity !== undefined && 
      data.reworkQuantity > data.receiptQuantity) {
    return false;
  }
  return true;
}, {
  message: 'Rework Quantity cannot exceed Receipt Quantity',
  path: ['reworkQuantity'],
});

// List parameters validation
export const outsourceOrderReceiptListParamsSchema = z.object({
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).max(1000).default(10),
  search: z.string().trim().optional(),
  sortBy: z.enum(['createdAt', 'updatedAt', 'receiptDate', 'receiptNumber']).default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
  showAll: z.boolean().default(false),
  includeRelations: z.boolean().default(false),
  outsourceOrderDetailId: z.number().int().min(1).optional(),
  qualityStatus: z.string().trim().optional(),
  status: z.string().trim().optional(),
  receivedByUserId: z.string().trim().optional(),
  batchNumber: z.string().trim().optional(),
});

// Export parameters validation  
export const outsourceOrderReceiptExportParamsSchema = outsourceOrderReceiptListParamsSchema.extend({
  format: z.enum(['xlsx', 'csv']).default('xlsx'),
  includeHeaders: z.boolean().default(true),
  filename: z.string().trim().optional(),
});

// Validation functions
export function validateOutsourceOrderReceiptForm(data: unknown) {
  return outsourceOrderReceiptFormSchema.safeParse(data);
}

export function validateOutsourceOrderReceiptWithRules(data: unknown) {
  return outsourceOrderReceiptValidationSchema.safeParse(data);
}

export function validateCreateOutsourceOrderReceipt(data: unknown) {
  return createOutsourceOrderReceiptSchema.safeParse(data);
}

export function validateUpdateOutsourceOrderReceipt(data: unknown) {
  return updateOutsourceOrderReceiptSchema.safeParse(data);
}

export function validateOutsourceOrderReceiptListParams(data: unknown) {
  return outsourceOrderReceiptListParamsSchema.safeParse(data);
}

export function validateOutsourceOrderReceiptExportParams(data: unknown) {
  return outsourceOrderReceiptExportParamsSchema.safeParse(data);
}
