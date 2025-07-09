/**
 * OutsourceOrderReceipt export functionality hook
 * Generated based on existing pattern from useOutsourceOrderDetailExport
 */

import { useState } from 'react';
import { toast } from 'sonner';
import { useAuth } from '@clerk/nextjs';

import type { OutsourceOrderReceiptExportParams } from '@/types/outsourceOrderReceipt';

const API_BASE = '/api/outsourceOrderReceipts';

export function useOutsourceOrderReceiptExport() {
  const [isExporting, setIsExporting] = useState(false);
  const { userId } = useAuth();

  const exportData = async (params: OutsourceOrderReceiptExportParams = {}) => {
    if (!userId) {
      toast.error('User not authenticated');
      return;
    }

    setIsExporting(true);
    
    try {
      const searchParams = new URLSearchParams();
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          searchParams.append(key, String(value));
        }
      });

      const response = await fetch(`${API_BASE}/export?${searchParams}`);
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Export failed');
      }

      // Get filename from response headers or use default
      const contentDisposition = response.headers.get('Content-Disposition');
      let filename = params.filename || 'outsource_order_receipts_export';
      
      if (contentDisposition) {
        const match = contentDisposition.match(/filename="?([^"]+)"?/);
        if (match) {
          filename = match[1] || filename;
        }
      }

      // Add extension if not present
      const format = params.format || 'xlsx';
      if (!filename.endsWith(`.${format}`)) {
        filename += `.${format}`;
      }

      // Create download link
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      
      // Cleanup
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      toast.success(`Export completed: ${filename}`);
    } catch (error) {
      console.error('Export error:', error);
      toast.error(`Export failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsExporting(false);
    }
  };

  return {
    exportData,
    isExporting,
  };
}
