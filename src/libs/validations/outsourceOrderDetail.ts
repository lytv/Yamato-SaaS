/**
 * OutsourceOrderDetail validation schemas with Relations Support
 * Enhanced version with proper error handling, type safety and relationships
 * Generated based on existing pattern from outsourceOrder validations
 */

import { z } from 'zod';

// Base schema without refine methods (for extending and form usage)
const baseOutsourceOrderDetailSchema = z.object({
  outsourceOrderId: z.number().int().min(1, 'Outsource Order is required'),
  planId: z.number().int().min(1, 'Plan is required'),
  productId: z.number().int().min(1, 'Product is required'),
  productionStepId: z.number().int().min(1, 'Production Step is required'),
  planCode: z.string().trim().min(1, 'Plan Code is required').max(50, 'Plan Code must be 50 characters or less'),
  planName: z.string().trim().min(1, 'Plan Name is required').max(200, 'Plan Name must be 200 characters or less'),
  productCode: z.string().trim().min(1, 'Product Code is required').max(50, 'Product Code must be 50 characters or less'),
  productName: z.string().trim().min(1, 'Product Name is required').max(200, 'Product Name must be 200 characters or less'),
  stepCode: z.string().trim().min(1, 'Step Code is required').max(50, 'Step Code must be 50 characters or less'),
  stepName: z.string().trim().min(1, 'Step Name is required').max(200, 'Step Name must be 200 characters or less'),
  orderedQuantity: z.number().int().min(1, 'Ordered Quantity must be at least 1'),
  completedQuantity: z.number().int().min(0, 'Completed Quantity cannot be negative').optional(),
  expectedCompletionDate: z.preprocess(
    val => typeof val === 'string' ? new Date(val) : val,
    z.date({ required_error: 'Expected Completion Date is required', invalid_type_error: 'Invalid date' }),
  ),
  actualCompletionDate: z.preprocess(
    val => val === undefined || val === '' ? undefined : (typeof val === 'string' ? new Date(val) : val),
    z.date({ invalid_type_error: 'Invalid date' }).optional(),
  ),
  status: z.string().trim().max(50, 'Status must be 50 characters or less').optional(),
  sequenceNumber: z.number().int().min(0, 'Sequence Number cannot be negative').optional(),
  unitPrice: z.preprocess(
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
    z.number().min(0, 'Unit Price cannot be negative').optional(),
  ),
  totalPrice: z.preprocess(
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
    z.number().min(0, 'Total Price cannot be negative').optional(),
  ),
  itemNotes: z.string().trim().optional(),
});

// Form schema for React Hook Form (clean ZodObject without refine)
export const outsourceOrderDetailFormSchema = baseOutsourceOrderDetailSchema;

// Enhanced validation with custom rules (for API validation)
export const outsourceOrderDetailValidationSchema = baseOutsourceOrderDetailSchema.refine((data) => {
  // Ensure completedQuantity doesn't exceed orderedQuantity
  if (data.completedQuantity !== undefined && data.completedQuantity > data.orderedQuantity) {
    return false;
  }
  return true;
}, {
  message: 'Completed Quantity cannot exceed Ordered Quantity',
  path: ['completedQuantity'],
}).refine((data) => {
  // Ensure actualCompletionDate is not before expectedCompletionDate (if both provided)
  if (data.actualCompletionDate && data.expectedCompletionDate) {
    return data.actualCompletionDate >= data.expectedCompletionDate ||
           Math.abs(data.actualCompletionDate.getTime() - data.expectedCompletionDate.getTime()) < 24 * 60 * 60 * 1000; // Allow same day
  }
  return true;
}, {
  message: 'Actual Completion Date should not be much earlier than Expected Completion Date',
  path: ['actualCompletionDate'],
});

// Create outsourceOrderDetail schema (for API validation with all rules)
export const createOutsourceOrderDetailSchema = baseOutsourceOrderDetailSchema.extend({
  ownerId: z.string().min(1, 'Owner ID is required'),
}).refine((data) => {
  // Ensure completedQuantity doesn't exceed orderedQuantity
  if (data.completedQuantity !== undefined && data.completedQuantity > data.orderedQuantity) {
    return false;
  }
  return true;
}, {
  message: 'Completed Quantity cannot exceed Ordered Quantity',
  path: ['completedQuantity'],
}).refine((data) => {
  // Ensure actualCompletionDate is not before expectedCompletionDate (if both provided)
  if (data.actualCompletionDate && data.expectedCompletionDate) {
    return data.actualCompletionDate >= data.expectedCompletionDate ||
           Math.abs(data.actualCompletionDate.getTime() - data.expectedCompletionDate.getTime()) < 24 * 60 * 60 * 1000; // Allow same day
  }
  return true;
}, {
  message: 'Actual Completion Date should not be much earlier than Expected Completion Date',
  path: ['actualCompletionDate'],
});

// Update outsourceOrderDetail schema (all fields optional except validation consistency)
export const updateOutsourceOrderDetailSchema = z.object({
  outsourceOrderId: z.number().int().min(1).optional(),
  planId: z.number().int().min(1).optional(),
  productId: z.number().int().min(1).optional(),
  productionStepId: z.number().int().min(1).optional(),
  planCode: z.string().trim().max(50, 'Plan Code must be 50 characters or less').optional(),
  planName: z.string().trim().max(200, 'Plan Name must be 200 characters or less').optional(),
  productCode: z.string().trim().max(50, 'Product Code must be 50 characters or less').optional(),
  productName: z.string().trim().max(200, 'Product Name must be 200 characters or less').optional(),
  stepCode: z.string().trim().max(50, 'Step Code must be 50 characters or less').optional(),
  stepName: z.string().trim().max(200, 'Step Name must be 200 characters or less').optional(),
  orderedQuantity: z.number().int().min(1, 'Ordered Quantity must be at least 1').optional(),
  completedQuantity: z.number().int().min(0, 'Completed Quantity cannot be negative').optional(),
  expectedCompletionDate: z.preprocess(
    val => typeof val === 'string' ? new Date(val) : val,
    z.date({ invalid_type_error: 'Invalid date' }).optional(),
  ),
  actualCompletionDate: z.preprocess(
    val => val === undefined || val === '' ? undefined : (typeof val === 'string' ? new Date(val) : val),
    z.date({ invalid_type_error: 'Invalid date' }).optional(),
  ),
  status: z.string().trim().max(50, 'Status must be 50 characters or less').optional(),
  sequenceNumber: z.number().int().min(0, 'Sequence Number cannot be negative').optional(),
  unitPrice: z.preprocess(
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
    z.number().min(0, 'Unit Price cannot be negative').optional(),
  ),
  totalPrice: z.preprocess(
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
    z.number().min(0, 'Total Price cannot be negative').optional(),
  ),
  itemNotes: z.string().trim().optional(),
}).refine((data) => {
  // Ensure completedQuantity doesn't exceed orderedQuantity (if both provided)
  if (data.completedQuantity !== undefined && data.orderedQuantity !== undefined && 
      data.completedQuantity > data.orderedQuantity) {
    return false;
  }
  return true;
}, {
  message: 'Completed Quantity cannot exceed Ordered Quantity',
  path: ['completedQuantity'],
});

// List parameters validation
export const outsourceOrderDetailListParamsSchema = z.object({
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).max(1000).default(10),
  search: z.string().trim().optional(),
  sortBy: z.enum(['createdAt', 'updatedAt', 'sequenceNumber', 'expectedCompletionDate']).default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
  showAll: z.boolean().default(false),
  includeRelations: z.boolean().default(false),
  outsourceOrderId: z.number().int().min(1).optional(),
  status: z.string().trim().optional(),
  planId: z.number().int().min(1).optional(),
  productId: z.number().int().min(1).optional(),
  productionStepId: z.number().int().min(1).optional(),
});

// Export parameters validation  
export const outsourceOrderDetailExportParamsSchema = outsourceOrderDetailListParamsSchema.extend({
  format: z.enum(['xlsx', 'csv']).default('xlsx'),
  includeHeaders: z.boolean().default(true),
  filename: z.string().trim().optional(),
});

// Validation functions
export function validateOutsourceOrderDetailForm(data: unknown) {
  return outsourceOrderDetailFormSchema.safeParse(data);
}

export function validateOutsourceOrderDetailWithRules(data: unknown) {
  return outsourceOrderDetailValidationSchema.safeParse(data);
}

export function validateCreateOutsourceOrderDetail(data: unknown) {
  return createOutsourceOrderDetailSchema.safeParse(data);
}

export function validateUpdateOutsourceOrderDetail(data: unknown) {
  return updateOutsourceOrderDetailSchema.safeParse(data);
}

export function validateOutsourceOrderDetailListParams(data: unknown) {
  return outsourceOrderDetailListParamsSchema.safeParse(data);
}

export function validateOutsourceOrderDetailExportParams(data: unknown) {
  return outsourceOrderDetailExportParamsSchema.safeParse(data);
}
