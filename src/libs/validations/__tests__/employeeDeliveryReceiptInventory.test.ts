/**
 * Employee Delivery Receipt Inventory Validation Tests
 * Testing validation schemas for type safety and business rules
 */

import { describe, expect, it } from 'vitest';

import {
  validateEmployeeDeliveryReceiptInventoryExportParams,
  validateEmployeeDeliveryReceiptInventoryFilterOptions,
  validateEmployeeDeliveryReceiptInventoryFilterState,
  validateEmployeeDeliveryReceiptInventoryItem,
  validateEmployeeDeliveryReceiptInventoryListParams,
  validateEmployeeDeliveryReceiptInventoryStoredProcParams,
  validateEmployeeDeliveryReceiptInventorySummary,
} from '../employeeDeliveryReceiptInventory';

describe('Employee Delivery Receipt Inventory Validation', () => {
  describe('validateEmployeeDeliveryReceiptInventoryListParams', () => {
    it('should validate valid list parameters', () => {
      const validParams = {
        page: 1,
        limit: 20,
        search: 'John Doe',
        plan_code: 'T.6',
        product_code: 'NHA01',
        production_step_code: 'MAY',
        employee_id: 'user_123',
        sortBy: 'employee_name',
        sortOrder: 'asc',
      };

      const result = validateEmployeeDeliveryReceiptInventoryListParams(validParams);

      expect(result).toEqual(validParams);
    });

    it('should handle null/undefined values with defaults', () => {
      const params = {
        page: null,
        limit: undefined,
        search: null,
        plan_code: undefined,
        sortBy: null,
        sortOrder: undefined,
      };

      const result = validateEmployeeDeliveryReceiptInventoryListParams(params);

      expect(result.page).toBe(1);
      expect(result.limit).toBe(20);
      expect(result.search).toBeUndefined();
      expect(result.plan_code).toBeUndefined();
      expect(result.sortBy).toBe('employee_name');
      expect(result.sortOrder).toBe('asc');
    });

    it('should handle string numbers correctly', () => {
      const params = {
        page: '2',
        limit: '50',
      };

      const result = validateEmployeeDeliveryReceiptInventoryListParams(params);

      expect(result.page).toBe(2);
      expect(result.limit).toBe(50);
    });

    it('should enforce page minimum of 1', () => {
      const params = {
        page: 0,
      };

      const result = validateEmployeeDeliveryReceiptInventoryListParams(params);

      expect(result.page).toBe(1);
    });

    it('should enforce limit bounds (1-100)', () => {
      const params1 = { limit: 0 };
      const result1 = validateEmployeeDeliveryReceiptInventoryListParams(params1);

      expect(result1.limit).toBe(1); // Minimum enforced

      const params2 = { limit: 150 };
      const result2 = validateEmployeeDeliveryReceiptInventoryListParams(params2);

      expect(result2.limit).toBe(100); // Max
    });

    it('should validate sortBy field against allowed values', () => {
      const params1 = { sortBy: 'employee_name' };
      const result1 = validateEmployeeDeliveryReceiptInventoryListParams(params1);

      expect(result1.sortBy).toBe('employee_name');

      const params2 = { sortBy: 'invalid_field' };
      const result2 = validateEmployeeDeliveryReceiptInventoryListParams(params2);

      expect(result2.sortBy).toBe('employee_name'); // Default
    });

    it('should trim and validate string fields', () => {
      const params = {
        search: '  John Doe  ',
        plan_code: '  T.6  ',
        product_code: '  NHA01  ',
      };

      const result = validateEmployeeDeliveryReceiptInventoryListParams(params);

      expect(result.search).toBe('John Doe');
      expect(result.plan_code).toBe('T.6');
      expect(result.product_code).toBe('NHA01');
    });
  });

  describe('validateEmployeeDeliveryReceiptInventoryExportParams', () => {
    it('should validate valid export parameters', () => {
      const validParams = {
        search: 'John Doe',
        plan_code: 'T.6',
        format: 'xlsx',
        includeHeaders: true,
        filename: 'custom_export.xlsx',
      };

      const result = validateEmployeeDeliveryReceiptInventoryExportParams(validParams);

      expect(result.format).toBe('xlsx');
      expect(result.includeHeaders).toBe(true);
      expect(result.filename).toBe('custom_export.xlsx');
    });

    it('should default format to xlsx', () => {
      const params = { format: null };
      const result = validateEmployeeDeliveryReceiptInventoryExportParams(params);

      expect(result.format).toBe('xlsx');
    });

    it('should validate format against allowed values', () => {
      const params1 = { format: 'csv' };
      const result1 = validateEmployeeDeliveryReceiptInventoryExportParams(params1);

      expect(result1.format).toBe('csv');

      const params2 = { format: 'pdf' };
      const result2 = validateEmployeeDeliveryReceiptInventoryExportParams(params2);

      expect(result2.format).toBe('xlsx'); // Default
    });
  });

  describe('validateEmployeeDeliveryReceiptInventoryItem', () => {
    it('should validate valid inventory item', () => {
      const validItem = {
        employee_id: 'user_123',
        employee_name: 'John Doe',
        plan_code: 'T.6',
        product_code: 'NHA01',
        product_name: 'Product A',
        step_code: 'MAY',
        step_name: 'Sewing',
        total_assigned: 100,
        total_received: 80,
        total_defect: 5,
        total_rework: 3,
        current_inventory: 20,
        completion_rate: 80.5,
      };

      const result = validateEmployeeDeliveryReceiptInventoryItem(validItem);

      expect(result).toEqual(validItem);
    });

    it('should reject empty required fields', () => {
      const invalidItem = {
        employee_id: '',
        employee_name: 'John Doe',
        plan_code: 'T.6',
        product_code: 'NHA01',
        product_name: 'Product A',
        step_code: 'MAY',
        step_name: 'Sewing',
        total_assigned: 100,
        total_received: 80,
        total_defect: 5,
        total_rework: 3,
        current_inventory: 20,
        completion_rate: 80.5,
      };

      expect(() => validateEmployeeDeliveryReceiptInventoryItem(invalidItem))
        .toThrow('Employee ID cannot be empty');
    });

    it('should reject negative values for non-negative fields', () => {
      const invalidItem = {
        employee_id: 'user_123',
        employee_name: 'John Doe',
        plan_code: 'T.6',
        product_code: 'NHA01',
        product_name: 'Product A',
        step_code: 'MAY',
        step_name: 'Sewing',
        total_assigned: -10,
        total_received: 80,
        total_defect: 5,
        total_rework: 3,
        current_inventory: 20,
        completion_rate: 80.5,
      };

      expect(() => validateEmployeeDeliveryReceiptInventoryItem(invalidItem))
        .toThrow('Total assigned must be non-negative');
    });

    it('should allow negative current_inventory', () => {
      const validItem = {
        employee_id: 'user_123',
        employee_name: 'John Doe',
        plan_code: 'T.6',
        product_code: 'NHA01',
        product_name: 'Product A',
        step_code: 'MAY',
        step_name: 'Sewing',
        total_assigned: 100,
        total_received: 120,
        total_defect: 5,
        total_rework: 3,
        current_inventory: -20,
        completion_rate: 120.0,
      };

      const result = validateEmployeeDeliveryReceiptInventoryItem(validItem);

      expect(result.current_inventory).toBe(-20);
    });
  });

  describe('validateEmployeeDeliveryReceiptInventorySummary', () => {
    it('should validate valid summary', () => {
      const validSummary = {
        total_records: 150,
        total_employees: 25,
        total_assigned: 5000,
        total_received: 4200,
        total_defect: 100,
        total_rework: 50,
        total_inventory: 800,
        average_completion_rate: 84.5,
      };

      const result = validateEmployeeDeliveryReceiptInventorySummary(validSummary);

      expect(result).toEqual(validSummary);
    });

    it('should reject negative values for non-negative fields', () => {
      const invalidSummary = {
        total_records: -1,
        total_employees: 25,
        total_assigned: 5000,
        total_received: 4200,
        total_defect: 100,
        total_rework: 50,
        total_inventory: 800,
        average_completion_rate: 84.5,
      };

      expect(() => validateEmployeeDeliveryReceiptInventorySummary(invalidSummary))
        .toThrow('Total records must be non-negative');
    });

    it('should allow negative total_inventory', () => {
      const validSummary = {
        total_records: 150,
        total_employees: 25,
        total_assigned: 5000,
        total_received: 5200,
        total_defect: 100,
        total_rework: 50,
        total_inventory: -200,
        average_completion_rate: 104.0,
      };

      const result = validateEmployeeDeliveryReceiptInventorySummary(validSummary);

      expect(result.total_inventory).toBe(-200);
    });
  });

  describe('validateEmployeeDeliveryReceiptInventoryFilterOptions', () => {
    it('should validate valid filter options', () => {
      const validOptions = {
        plans: [
          { code: 'T.6', name: 'Plan June' },
          { code: 'T.7', name: 'Plan July' },
        ],
        products: [
          { code: 'NHA01', name: 'Product A' },
          { code: 'NHA02', name: 'Product B' },
        ],
        productionSteps: [
          { code: 'MAY', name: 'Sewing' },
          { code: 'CAT', name: 'Cutting' },
        ],
        employees: [
          { id: 'user_123', name: 'John Doe' },
          { id: 'user_456', name: 'Jane Smith' },
        ],
      };

      const result = validateEmployeeDeliveryReceiptInventoryFilterOptions(validOptions);

      expect(result).toEqual(validOptions);
    });

    it('should reject empty codes/names in options', () => {
      const invalidOptions = {
        plans: [
          { code: '', name: 'Plan June' },
        ],
        products: [],
        productionSteps: [],
        employees: [],
      };

      expect(() => validateEmployeeDeliveryReceiptInventoryFilterOptions(invalidOptions))
        .toThrow('Plan code cannot be empty');
    });
  });

  describe('validateEmployeeDeliveryReceiptInventoryStoredProcParams', () => {
    it('should validate valid stored procedure parameters', () => {
      const validParams = {
        p_plan_code: 'T.6',
        p_product_code: 'NHA01',
        p_production_step_code: 'MAY',
        p_employee_id: 'user_123',
      };

      const result = validateEmployeeDeliveryReceiptInventoryStoredProcParams(validParams);

      expect(result).toEqual(validParams);
    });

    it('should handle null values', () => {
      const params = {
        p_plan_code: null,
        p_product_code: null,
        p_production_step_code: null,
        p_employee_id: null,
      };

      const result = validateEmployeeDeliveryReceiptInventoryStoredProcParams(params);

      expect(result).toEqual(params);
    });

    it('should handle undefined values', () => {
      const params = {};

      const result = validateEmployeeDeliveryReceiptInventoryStoredProcParams(params);

      expect(result).toEqual({});
    });
  });

  describe('validateEmployeeDeliveryReceiptInventoryFilterState', () => {
    it('should validate valid filter state', () => {
      const validState = {
        search: 'John Doe',
        plan_code: 'T.6',
        product_code: 'NHA01',
        production_step_code: 'MAY',
        employee_id: 'user_123',
        sortBy: 'employee_name',
        sortOrder: 'asc' as const,
      };

      const result = validateEmployeeDeliveryReceiptInventoryFilterState(validState);

      expect(result).toEqual(validState);
    });

    it('should provide defaults for missing values', () => {
      const params = {};

      const result = validateEmployeeDeliveryReceiptInventoryFilterState(params);

      expect(result.search).toBe('');
      expect(result.plan_code).toBe('');
      expect(result.product_code).toBe('');
      expect(result.production_step_code).toBe('');
      expect(result.employee_id).toBe('');
      expect(result.sortBy).toBe('employee_name');
      expect(result.sortOrder).toBe('asc');
    });

    it('should validate sortOrder enum', () => {
      const params = {
        sortOrder: 'invalid',
      };

      expect(() => validateEmployeeDeliveryReceiptInventoryFilterState(params))
        .toThrow();
    });
  });
});
