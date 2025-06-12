/**
 * Excel Helpers Unit Tests
 * Following TDD Workflow Standards
 * Tests for Excel generation and utility functions
 */

import { Buffer } from 'node:buffer';

import type { Product } from '@/types/product';
import { generateExcelFilename, generateProductsExcel, validateExcelExportData } from '@/utils/excelHelpers';

// Mock product data for testing
const mockProducts: Product[] = [
  {
    id: 1,
    productCode: 'TEST-001',
    productName: 'Test Product 1',
    category: 'Test Category',
    notes: 'Test notes',
    ownerId: 'user123',
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z',
  },
  {
    id: 2,
    productCode: 'TEST-002',
    productName: 'Test Product 2',
    category: '',
    notes: '',
    ownerId: 'user123',
    createdAt: '2024-01-02T00:00:00.000Z',
    updatedAt: '2024-01-02T00:00:00.000Z',
  },
];

describe('Excel Helpers', () => {
  describe('generateProductsExcel', () => {
    it('should generate Excel buffer from products array', () => {
      // Act
      const result = generateProductsExcel(mockProducts);

      // Assert
      expect(result).toBeInstanceOf(Buffer);
      expect(result.length).toBeGreaterThan(0);
    });

    it('should handle empty products array', () => {
      // Act
      const result = generateProductsExcel([]);

      // Assert
      expect(result).toBeInstanceOf(Buffer);
      expect(result.length).toBeGreaterThan(0); // Still contains headers and metadata
    });

    it('should handle products with missing optional fields', () => {
      // Arrange
      const productsWithMissingFields: Product[] = [
        {
          id: 1,
          productCode: 'TEST-001',
          productName: 'Test Product',
          category: null,
          notes: null,
          ownerId: 'user123',
          createdAt: '2024-01-01T00:00:00.000Z',
          updatedAt: '2024-01-01T00:00:00.000Z',
        },
      ];

      // Act
      const result = generateProductsExcel(productsWithMissingFields);

      // Assert
      expect(result).toBeInstanceOf(Buffer);
      expect(result.length).toBeGreaterThan(0);
    });
  });

  describe('generateExcelFilename', () => {
    it('should generate filename with timestamp format', () => {
      // Act
      const filename = generateExcelFilename();

      // Assert
      expect(filename).toMatch(/^products-export-\d{4}-\d{2}-\d{2}T\d{2}-\d{2}-\d{2}\.xlsx$/);
      expect(filename).toContain('products-export-');
      expect(filename).toContain('.xlsx');
    });

    it('should generate filename with custom prefix', () => {
      // Arrange
      const customPrefix = 'custom-export';

      // Act
      const filename = generateExcelFilename(customPrefix);

      // Assert
      expect(filename).toMatch(/^custom-export-\d{4}-\d{2}-\d{2}T\d{2}-\d{2}-\d{2}\.xlsx$/);
      expect(filename).toContain('custom-export-');
    });

    it('should include current date in filename', () => {
      // Arrange
      const now = new Date();
      const expectedYear = now.getFullYear().toString();

      // Act
      const filename = generateExcelFilename();

      // Assert
      expect(filename).toContain(expectedYear);
      expect(filename).toContain('.xlsx');
    });
  });

  describe('validateExcelExportData', () => {
    it('should validate valid products array', () => {
      // Act
      const result = validateExcelExportData(mockProducts);

      // Assert
      expect(result.isValid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('should reject empty products array', () => {
      // Act
      const result = validateExcelExportData([]);

      // Assert
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('No products to export');
    });

    it('should reject non-array input', () => {
      // Act
      const result = validateExcelExportData('invalid' as any);

      // Assert
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Products must be an array');
    });

    it('should reject too many products (over 5000)', () => {
      // Arrange
      const tooManyProducts = Array.from({ length: 5001 }, (_, index) => ({
        id: index + 1,
        productCode: `TEST-${index + 1}`,
        productName: `Test Product ${index + 1}`,
        category: 'Test',
        notes: '',
        ownerId: 'user123',
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-01-01T00:00:00.000Z',
      }));

      // Act
      const result = validateExcelExportData(tooManyProducts);

      // Assert
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Too many products to export (maximum 5000)');
    });

    it('should reject products with missing required fields', () => {
      // Arrange
      const invalidProducts: Product[] = [
        {
          id: 1,
          productCode: '',
          productName: 'Test Product',
          category: 'Test',
          notes: '',
          ownerId: 'user123',
          createdAt: '2024-01-01T00:00:00.000Z',
          updatedAt: '2024-01-01T00:00:00.000Z',
        },
        {
          id: 2,
          productCode: 'TEST-002',
          productName: '',
          category: 'Test',
          notes: '',
          ownerId: 'user123',
          createdAt: '2024-01-01T00:00:00.000Z',
          updatedAt: '2024-01-01T00:00:00.000Z',
        },
      ];

      // Act
      const result = validateExcelExportData(invalidProducts);

      // Assert
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('2 product(s) missing required fields');
    });

    it('should accept exactly 5000 products', () => {
      // Arrange
      const exactlyFiveThousandProducts = Array.from({ length: 5000 }, (_, index) => ({
        id: index + 1,
        productCode: `TEST-${index + 1}`,
        productName: `Test Product ${index + 1}`,
        category: 'Test',
        notes: '',
        ownerId: 'user123',
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-01-01T00:00:00.000Z',
      }));

      // Act
      const result = validateExcelExportData(exactlyFiveThousandProducts);

      // Assert
      expect(result.isValid).toBe(true);
      expect(result.error).toBeUndefined();
    });
  });
});
