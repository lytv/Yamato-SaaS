/**
 * Employee Delivery Receipt Inventory API Client
 * Handles all HTTP requests to employee delivery receipt inventory endpoints
 * Following Yamato-SaaS patterns and error handling
 */

import type {
  EmployeeDeliveryReceiptInventoryErrorResponse,
  EmployeeDeliveryReceiptInventoryExportParams,
  EmployeeDeliveryReceiptInventoryExportResponse,
  EmployeeDeliveryReceiptInventoryFilterOptionsResponse,
  EmployeeDeliveryReceiptInventoryFilters,
  EmployeeDeliveryReceiptInventoryResponse,
} from '@/types/employeeDeliveryReceiptInventory';

/**
 * Fetch employee delivery receipt inventory data
 */
export async function fetchEmployeeDeliveryReceiptInventory(
  params: EmployeeDeliveryReceiptInventoryFilters,
): Promise<EmployeeDeliveryReceiptInventoryResponse | EmployeeDeliveryReceiptInventoryErrorResponse> {
  const definedParams: Record<string, string> = {};

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined) {
      definedParams[key] = String(value);
    }
  });

  const queryParams = new URLSearchParams(definedParams);

  try {
    const response = await fetch(`/api/employeeDeliveryReceiptInventory?${queryParams.toString()}`);
    return await response.json();
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Network error',
      code: 'NETWORK_ERROR',
    };
  }
}

/**
 * Fetch filter options for dropdowns
 */
export async function fetchEmployeeDeliveryReceiptInventoryFilterOptions(): Promise<
  EmployeeDeliveryReceiptInventoryFilterOptionsResponse | EmployeeDeliveryReceiptInventoryErrorResponse
> {
  try {
    const response = await fetch('/api/employeeDeliveryReceiptInventory/filter-options');
    return await response.json();
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Network error',
      code: 'NETWORK_ERROR',
    };
  }
}

/**
 * Export employee delivery receipt inventory data
 */
export async function exportEmployeeDeliveryReceiptInventory(
  params: EmployeeDeliveryReceiptInventoryExportParams,
): Promise<EmployeeDeliveryReceiptInventoryExportResponse | EmployeeDeliveryReceiptInventoryErrorResponse> {
  const definedParams: Record<string, string> = {};

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined) {
      definedParams[key] = String(value);
    }
  });

  const queryParams = new URLSearchParams(definedParams);

  try {
    const response = await fetch(`/api/employeeDeliveryReceiptInventory/export?${queryParams.toString()}`);
    
    if (response.ok) {
      // For successful exports, create a download URL from the blob
      const blob = await response.blob();
      const downloadUrl = URL.createObjectURL(blob);
      const contentDisposition = response.headers.get('Content-Disposition');
      const filename = contentDisposition?.match(/filename="(.+)"/)?.[1] || 'export.xlsx';
      
      return {
        success: true,
        filename,
        downloadUrl,
        recordCount: 0, // We don't have this info from the blob response
      };
    } else {
      const errorData = await response.json();
      return errorData;
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Network error',
      code: 'NETWORK_ERROR',
    };
  }
}
