/**
 * OutsourceOrderDetail export functionality hook
 * Generated based on existing pattern from useOutsourceOrderExport.ts
 */

import { useMutation } from '@tanstack/react-query';
import { useAuth } from '@clerk/nextjs';
import { toast } from 'sonner';
import type { 
  OutsourceOrderDetailExportParams, 
  OutsourceOrderDetailWithRelations 
} from '@/types/outsourceOrderDetail';

const API_BASE = '/api/outsourceOrderDetails/export';

interface ExportResponse {
  success: boolean;
  data?: {
    url: string;
    filename: string;
  };
  error?: string;
}

export function useOutsourceOrderDetailExport() {
  const { userId } = useAuth();

  const exportMutation = useMutation({
    mutationFn: async (params: OutsourceOrderDetailExportParams): Promise<ExportResponse> => {
      if (!userId) throw new Error('User not authenticated');

      const searchParams = new URLSearchParams();
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          searchParams.append(key, String(value));
        }
      });

      const response = await fetch(`${API_BASE}?${searchParams}`, {
        method: 'GET',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Export failed');
      }

      // Handle blob download
      if (response.headers.get('content-type')?.includes('application/')) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const filename = params.filename || `outsource-order-details-${Date.now()}.${params.format || 'xlsx'}`;
        
        // Trigger download
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);

        return {
          success: true,
          data: { url, filename },
        };
      }

      return response.json();
    },
    onSuccess: (result) => {
      if (result.success) {
        toast.success('Export completed successfully');
      } else {
        toast.error(result.error || 'Export failed');
      }
    },
    onError: (error: Error) => {
      toast.error(`Export failed: ${error.message}`);
    },
  });

  const exportData = (params: Partial<OutsourceOrderDetailExportParams> = {}) => {
    const exportParams: OutsourceOrderDetailExportParams = {
      format: 'xlsx',
      includeHeaders: true,
      page: 1,
      limit: 999999, // Export all
      ...params,
    };

    return exportMutation.mutateAsync(exportParams);
  };

  const exportToCSV = (params: Partial<OutsourceOrderDetailExportParams> = {}) => {
    return exportData({ ...params, format: 'csv' });
  };

  const exportToExcel = (params: Partial<OutsourceOrderDetailExportParams> = {}) => {
    return exportData({ ...params, format: 'xlsx' });
  };

  // Client-side export for small datasets
  const exportClientSide = (
    data: OutsourceOrderDetailWithRelations[],
    format: 'csv' | 'xlsx' = 'csv',
    filename?: string
  ) => {
    if (format === 'csv') {
      return exportToCSVClientSide(data, filename);
    } else {
      toast.error('Client-side Excel export not implemented. Use server-side export.');
    }
  };

  const exportToCSVClientSide = (
    data: OutsourceOrderDetailWithRelations[],
    filename?: string
  ) => {
    const csvContent = convertToCSV(data);
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = filename || `outsource-order-details-${Date.now()}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    toast.success('CSV export completed');
  };

  const convertToCSV = (data: OutsourceOrderDetailWithRelations[]): string => {
    if (data.length === 0) return '';

    // Define headers
    const headers = [
      'ID',
      'Order Code',
      'Plan Code',
      'Plan Name',
      'Product Code',
      'Product Name',
      'Step Code',
      'Step Name',
      'Ordered Quantity',
      'Completed Quantity',
      'Unit Price',
      'Total Price',
      'Expected Completion Date',
      'Actual Completion Date',
      'Status',
      'Sequence Number',
      'Notes',
      'Created At',
      'Updated At',
    ];

    // Convert data to CSV rows
    const rows = data.map(item => [
      item.id,
      item.outsourceOrder?.orderCode || '',
      item.planCode || '',
      item.planName || '',
      item.productCode || '',
      item.productName || '',
      item.stepCode || '',
      item.stepName || '',
      item.orderedQuantity || 0,
      item.completedQuantity || 0,
      item.unitPrice || '',
      item.totalPrice || '',
      item.expectedCompletionDate || '',
      item.actualCompletionDate || '',
      item.status || '',
      item.sequenceNumber || '',
      (item.itemNotes || '').replace(/"/g, '""'), // Escape quotes
      item.createdAt,
      item.updatedAt,
    ]);

    // Combine headers and rows
    const allRows = [headers, ...rows];

    // Convert to CSV string
    return allRows
      .map(row => 
        row.map(field => 
          typeof field === 'string' && field.includes(',') 
            ? `"${field}"` 
            : field
        ).join(',')
      )
      .join('\n');
  };

  return {
    exportData,
    exportToCSV,
    exportToExcel,
    exportClientSide,
    exportToCSVClientSide,
    isExporting: exportMutation.isPending,
    error: exportMutation.error,
  };
}
