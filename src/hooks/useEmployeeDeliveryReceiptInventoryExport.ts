/**
 * useEmployeeDeliveryReceiptInventoryExport Hook
 * Manages export functionality for employee delivery receipt inventory
 * Following Yamato-SaaS patterns and export implementation
 */

import { useCallback, useState } from 'react';

import { exportEmployeeDeliveryReceiptInventory } from '@/libs/api/employeeDeliveryReceiptInventory';
import type {
  EmployeeDeliveryReceiptInventoryExportParams,
  ExportFormat,
} from '@/types/employeeDeliveryReceiptInventory';

type UseEmployeeDeliveryReceiptInventoryExportState = {
  isExporting: boolean;
  exportError: Error | null;
  exportProgress: number;
};

type UseEmployeeDeliveryReceiptInventoryExportReturn = UseEmployeeDeliveryReceiptInventoryExportState & {
  exportData: (params: EmployeeDeliveryReceiptInventoryExportParams) => Promise<void>;
  clearError: () => void;
};

export function useEmployeeDeliveryReceiptInventoryExport(): UseEmployeeDeliveryReceiptInventoryExportReturn {
  const [state, setState] = useState<UseEmployeeDeliveryReceiptInventoryExportState>({
    isExporting: false,
    exportError: null,
    exportProgress: 0,
  });

  const clearError = useCallback(() => {
    setState(prev => ({ ...prev, exportError: null }));
  }, []);

  const exportData = useCallback(async (params: EmployeeDeliveryReceiptInventoryExportParams) => {
    setState(prev => ({ ...prev, isExporting: true, exportError: null, exportProgress: 0 }));

    try {
      // Simulate progress for better UX
      setState(prev => ({ ...prev, exportProgress: 25 }));

      const result = await exportEmployeeDeliveryReceiptInventory(params);

      setState(prev => ({ ...prev, exportProgress: 75 }));

      if (result.success) {
        // Create download link and trigger download
        const link = document.createElement('a');
        link.href = result.downloadUrl;
        link.download = result.filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        setState(prev => ({ ...prev, exportProgress: 100 }));

        // Reset progress after a short delay
        setTimeout(() => {
          setState(prev => ({ ...prev, isExporting: false, exportProgress: 0 }));
        }, 1000);
      } else {
        throw new Error(result.error || 'Export failed');
      }
    } catch (error) {
      setState(prev => ({
        ...prev,
        isExporting: false,
        exportError: error instanceof Error ? error : new Error('Export failed'),
        exportProgress: 0,
      }));
    }
  }, []);

  return {
    ...state,
    exportData,
    clearError,
  };
}

/**
 * Helper function to generate export filename
 */
export function generateExportFilename(
  format: ExportFormat = 'xlsx',
  filters?: Partial<EmployeeDeliveryReceiptInventoryExportParams>
): string {
  const timestamp = new Date().toISOString().slice(0, 19).replace(/[:-]/g, '');
  let filename = `employee-delivery-receipt-inventory-${timestamp}`;

  // Add filter info to filename if applicable
  if (filters?.plan_code) {
    filename += `-plan-${filters.plan_code}`;
  }
  if (filters?.product_code) {
    filename += `-product-${filters.product_code}`;
  }
  if (filters?.production_step_code) {
    filename += `-step-${filters.production_step_code}`;
  }
  if (filters?.employee_id) {
    filename += `-employee-${filters.employee_id}`;
  }

  return `${filename}.${format}`;
}