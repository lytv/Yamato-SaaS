/**
 * Price Summary List Component
 * Pivot table for price summary report with dynamic step columns
 * Following Yamato-SaaS patterns with responsive design
 */

'use client';

import { 
  Download, 
  Package, 
  DollarSign, 
  Hash,
  Calculator,
  RefreshCw,
  Settings,
  BarChart3,
} from 'lucide-react';
import { useTranslations } from 'next-intl';
import React, { useMemo } from 'react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PriceSummarySkeleton } from '@/features/priceSummary/PriceSummarySkeleton';
import { usePriceSummaryExport } from '@/hooks/usePriceSummaryExport';
import type { 
  PriceSummaryItem,
  PriceSummaryColumn,
  DynamicPriceColumn,
  PriceSummaryFilterState,
} from '@/types/priceSummary';
import { PRICE_TYPE_OPTIONS } from '@/types/priceSummary';

type PriceSummaryListProps = {
  data: readonly PriceSummaryItem[];
  summary: {
    total_records: number;
    total_products: number;
    total_steps_with_pricing: number;
    average_price_per_product: number;
    highest_priced_product: string;
    lowest_priced_product: string;
  };
  pagination: {
    page: number;
    limit: number;
    total: number;
    hasMore: boolean;
  };
  filters: PriceSummaryFilterState;
  isLoading: boolean;
  isError: boolean;
  error: Error | null;
  onRefetch: () => void;
  className?: string;
};

export function PriceSummaryList({
  data,
  summary,
  filters,
  isLoading,
  isError,
  error,
  onRefetch,
  className = '',
}: PriceSummaryListProps): JSX.Element {
  const t = useTranslations('priceSummary.list');
  const { exportData, isExporting } = usePriceSummaryExport();

  // Get current price type label
  const currentPriceTypeLabel = PRICE_TYPE_OPTIONS.find(
    option => option.value === filters.price_type
  )?.label || 'Đơn giá';

  // Helper function to get dynamic step columns from data
  const getDynamicStepColumns = useMemo(() => {
    if (!data || data.length === 0) return [];
    
    const stepColumns: DynamicPriceColumn[] = [];
    
    // Collect ALL unique steps from ALL records
    const allSteps = new Map<string, { stepCode: string; stepName: string; sequenceNumber: number }>();
    
    data.forEach((item) => {
      Object.entries(item.step_data).forEach(([stepCode, stepInfo]) => {
        if (stepCode && stepInfo) {
          allSteps.set(stepCode, {
            stepCode,
            stepName: stepInfo.step_name || stepCode,
            sequenceNumber: stepInfo.sequence_number || 0,
          });
        }
      });
    });
    
    // Sort steps by sequence number, then by code
    const sortedSteps = Array.from(allSteps.values()).sort((a, b) => {
      if (a.sequenceNumber !== b.sequenceNumber) {
        return a.sequenceNumber - b.sequenceNumber;
      }
      // Fallback to numeric sorting by code
      const getNumericPart = (code: string) => {
        const match = code.match(/\d+/);
        return match ? parseInt(match[0], 10) : 0;
      };
      return getNumericPart(a.stepCode) - getNumericPart(b.stepCode);
    });
    
    // Create columns in the correct sorted order
    sortedSteps.forEach((step) => {
      stepColumns.push({
        stepCode: step.stepCode,
        stepName: step.stepName,
        sequenceNumber: step.sequenceNumber,
        price: 0, // Will be filled per row
      });
    });
    
    return stepColumns;
  }, [data]);

  // Define table columns with dynamic steps
  const columns = useMemo(() => {
    const baseColumns: PriceSummaryColumn[] = [
      {
        key: 'product_name',
        label: t('columns.productName', { defaultValue: 'Sản phẩm' }),
        sortable: true,
        width: '150px',
        align: 'left',
        sticky: true,
      },
      {
        key: 'total_price',
        label: t('columns.totalPrice', { defaultValue: 'Tổng giá trị' }),
        sortable: true,
        width: '150px',
        align: 'right',
        format: 'currency',
        sticky: true,
      },
    ];

    // Add dynamic step columns
    const stepColumns: PriceSummaryColumn[] = getDynamicStepColumns.map(step => ({
      key: 'dynamic_step',
      label: step.stepName || step.stepCode,
      sortable: false,
      width: '120px',
      align: 'right',
      format: 'currency',
      stepCode: step.stepCode,
    }));

    const endColumns: PriceSummaryColumn[] = [
      {
        key: 'total_steps',
        label: t('columns.totalSteps', { defaultValue: 'Số công đoạn' }),
        sortable: true,
        width: '120px',
        align: 'center',
        format: 'number',
      },
    ];

    return [...baseColumns, ...stepColumns, ...endColumns];
  }, [t, getDynamicStepColumns]);

  // Format currency value
  const formatCurrency = (value: number): string => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  // Format cell value
  const formatCellValue = (item: PriceSummaryItem, column: PriceSummaryColumn) => {
    if (column.key === 'dynamic_step' && column.stepCode) {
      const stepData = item.step_data[column.stepCode];
      const price = stepData?.price || 0;
      return price > 0 ? formatCurrency(price) : '-';
    }

    const value = item[column.key as keyof PriceSummaryItem];

    switch (column.format) {
      case 'currency':
        return typeof value === 'number' ? formatCurrency(value) : '-';
      case 'number':
        return typeof value === 'number' ? value.toLocaleString() : '0';
      case 'text':
      default:
        return String(value || '');
    }
  };

  // Get price level color for visualization
  const getPriceColor = (price: number, maxPrice: number) => {
    if (maxPrice === 0) return 'bg-gray-200';
    const percentage = (price / maxPrice) * 100;
    if (percentage >= 80) return 'bg-emerald-400';
    if (percentage >= 60) return 'bg-blue-400';
    if (percentage >= 40) return 'bg-yellow-400';
    if (percentage >= 20) return 'bg-orange-400';
    return 'bg-red-400';
  };

  // Get badge color for price values
  const getPriceBadgeVariant = (price: number) => {
    if (price === 0) return 'secondary';
    return 'default';
  };

  // Get badge background color for better visibility
  const getPriceBadgeClass = (price: number) => {
    if (price === 0) return 'bg-gray-100 text-gray-600 border-gray-300';
    return 'bg-blue-50 text-blue-800 border-blue-200 hover:bg-blue-100';
  };

  // Render table cell
  const renderCell = (item: PriceSummaryItem, column: PriceSummaryColumn) => {
    switch (column.key) {
      case 'product_name':
        return (
          <div className="flex items-center gap-3 min-w-0">
            <Package className="h-4 w-4 text-blue-600 flex-shrink-0" />
            <div className="min-w-0">
              <div className="font-medium text-gray-900 truncate">{item.product_name}</div>
              <div className="text-xs text-gray-500 truncate font-mono">{item.product_code}</div>
            </div>
          </div>
        );

      case 'total_steps':
        return (
          <div className="flex items-center justify-center gap-2">
            <Settings className="h-4 w-4 text-purple-600" />
            <Badge 
              variant="outline" 
              className={`font-mono ${getPriceBadgeClass(item.total_steps)}`}
            >
              {item.total_steps}
            </Badge>
          </div>
        );

      case 'total_price':
        const maxTotalPrice = Math.max(...data.map(d => d.total_price));
        const pricePercentage = maxTotalPrice > 0 ? (item.total_price / maxTotalPrice) * 100 : 0;
        
        return (
          <div className="space-y-2">
            <div className="flex items-center justify-end gap-2">
              <DollarSign className="h-4 w-4 text-green-600" />
              <Badge 
                variant={getPriceBadgeVariant(item.total_price)}
                className={`font-mono ${getPriceBadgeClass(item.total_price)}`}
              >
                {formatCurrency(item.total_price)}
              </Badge>
            </div>
            {item.total_price > 0 && (
              <div className="w-full bg-gray-200 rounded-full h-1">
                <div 
                  className={`h-1 rounded-full transition-all duration-300 ${getPriceColor(item.total_price, maxTotalPrice)}`}
                  style={{ width: `${Math.min(pricePercentage, 100)}%` }}
                />
              </div>
            )}
          </div>
        );

      case 'dynamic_step':
        if (!column.stepCode) return '-';
        
        const stepData = item.step_data[column.stepCode];
        const stepPrice = stepData?.price || 0;
        const maxStepPrice = Math.max(...data.map(d => d.step_data[column.stepCode!]?.price || 0));
        const stepPercentage = maxStepPrice > 0 ? (stepPrice / maxStepPrice) * 100 : 0;
        
        return (
          <div className="space-y-1">
            <div className="flex items-center justify-end gap-1">
              <Calculator className="h-3 w-3 text-orange-600" />
              <Badge 
                variant={getPriceBadgeVariant(stepPrice)}
                className={`font-mono text-xs ${getPriceBadgeClass(stepPrice)}`}
              >
                {stepPrice > 0 ? formatCurrency(stepPrice) : '-'}
              </Badge>
            </div>
            {stepPrice > 0 && maxStepPrice > 0 && (
              <div className="w-full bg-gray-200 rounded-full h-1">
                <div 
                  className={`h-1 rounded-full transition-all duration-300 ${getPriceColor(stepPrice, maxStepPrice)}`}
                  style={{ width: `${Math.min(stepPercentage, 100)}%` }}
                />
              </div>
            )}
          </div>
        );

      default:
        return (
          <span className={`${column.align === 'right' ? 'text-right' : column.align === 'center' ? 'text-center' : 'text-left'}`}>
            {formatCellValue(item, column)}
          </span>
        );
    }
  };

  // Handle export
  const handleExport = async (format: 'xlsx' | 'csv') => {
    await exportData({
      ...filters,
      format,
      includeHeaders: true,
      filename: `price_summary_${filters.price_type}_${new Date().toISOString().slice(0, 10)}`,
    });
  };

  // Error state
  if (isError) {
    return (
      <Card className={className}>
        <CardContent className="p-6">
          <div className="text-center text-red-600">
            <p>{error?.message || t('error', { defaultValue: 'Failed to load price summary data' })}</p>
            <Button variant="outline" onClick={onRefetch} className="mt-2">
              {t('retry', { defaultValue: 'Retry' })}
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-r from-blue-50 to-blue-100 border-blue-200">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-500 rounded-lg">
                <Package className="h-5 w-5 text-white" />
              </div>
              <div>
                <p className="text-sm font-medium text-blue-700">Sản phẩm</p>
                <p className="text-2xl font-bold text-blue-900">
                  {summary.total_products.toLocaleString()}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-green-50 to-green-100 border-green-200">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-500 rounded-lg">
                <Settings className="h-5 w-5 text-white" />
              </div>
              <div>
                <p className="text-sm font-medium text-green-700">Công đoạn có giá</p>
                <p className="text-2xl font-bold text-green-900">
                  {summary.total_steps_with_pricing.toLocaleString()}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-purple-50 to-purple-100 border-purple-200">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-500 rounded-lg">
                <Calculator className="h-5 w-5 text-white" />
              </div>
              <div>
                <p className="text-sm font-medium text-purple-700">Giá TB/Sản phẩm</p>
                <p className="text-2xl font-bold text-purple-900">
                  {formatCurrency(summary.average_price_per_product)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-orange-50 to-orange-100 border-orange-200">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-orange-500 rounded-lg">
                <BarChart3 className="h-5 w-5 text-white" />
              </div>
              <div>
                <p className="text-sm font-medium text-orange-700">Cao nhất</p>
                <p className="text-sm font-bold text-orange-900 truncate">
                  {summary.highest_priced_product || 'N/A'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Data Table */}
      <Card className="shadow-lg">
        <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white rounded-lg shadow-sm">
                <DollarSign className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <CardTitle className="text-xl text-gray-900">
                  {t('title', { defaultValue: 'Tổng Hợp Đơn Giá' })}
                </CardTitle>
                <p className="text-sm text-gray-600 mt-1">
                  Hiển thị {currentPriceTypeLabel} theo công đoạn • 📌 Cột sản phẩm & tổng giá trị cố định
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="px-3 py-1">
                <Hash className="h-3 w-3 mr-1" />
                {data?.length || 0} sản phẩm
              </Badge>
              <Button
                variant="outline"
                size="sm"
                onClick={onRefetch}
                disabled={isLoading}
                className="bg-white hover:bg-gray-50"
                title="Làm mới dữ liệu"
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                {t('refresh', { defaultValue: 'Làm mới' })}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleExport('xlsx')}
                disabled={isExporting || isLoading}
                className="bg-white hover:bg-gray-50"
              >
                <Download className="h-4 w-4 mr-2" />
                {t('export.excel', { defaultValue: 'Excel' })}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleExport('csv')}
                disabled={isExporting || isLoading}
                className="bg-white hover:bg-gray-50"
              >
                <Download className="h-4 w-4 mr-2" />
                {t('export.csv', { defaultValue: 'CSV' })}
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-6">
              <PriceSummarySkeleton />
            </div>
          ) : (
            <div className="overflow-x-auto shadow-inner">
              <table className="w-full text-sm min-w-max">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    {columns.map((col, index) => {
                      const getHeaderIcon = () => {
                        switch (col.key) {
                          case 'product_name':
                            return <Package className="h-4 w-4 text-blue-600" />;
                          case 'total_steps':
                            return <Settings className="h-4 w-4 text-purple-600" />;
                          case 'total_price':
                            return <DollarSign className="h-4 w-4 text-green-600" />;
                          case 'dynamic_step':
                            return <Calculator className="h-4 w-4 text-orange-600" />;
                          default:
                            return null;
                        }
                      };

                      const isFirstColumn = index === 0;
                      const isSecondColumn = index === 1;
                      const isStickyColumn = col.sticky;
                      
                      const getStickyStyle = () => {
                        if (isFirstColumn) return 'left-0';
                        if (isSecondColumn && isStickyColumn) return 'left-[150px]'; // Width của cột đầu tiên
                        return '';
                      };

                      const headerClass = `
                        px-4 py-3 font-semibold text-gray-700 
                        ${col.align === 'right' ? 'text-right' : col.align === 'center' ? 'text-center' : 'text-left'}
                        ${isStickyColumn ? `sticky ${getStickyStyle()} bg-gray-50 hover:bg-blue-100 z-10 border-r border-gray-200 transition-colors duration-200` : ''}
                      `.trim();

                      return (
                        <th 
                          key={col.key === 'dynamic_step' ? `step_${col.stepCode}` : String(col.key)}
                          className={headerClass}
                          style={{ width: col.width }}
                        >
                          <div className={`flex items-center gap-2 ${
                            col.align === 'right' ? 'justify-end' : 
                            col.align === 'center' ? 'justify-center' : 'justify-start'
                          }`}>
                            {getHeaderIcon()}
                            <span>{col.label}</span>
                          </div>
                        </th>
                      );
                    })}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {data.map((item, rowIndex) => (
                    <tr key={`${item.product_code}-${rowIndex}`} className="hover:bg-gray-50">
                      {columns.map((col, colIndex) => {
                        const isFirstColumn = colIndex === 0;
                        const isSecondColumn = colIndex === 1;
                        const isStickyColumn = col.sticky;
                        
                        const getStickyStyle = () => {
                          if (isFirstColumn) return 'left-0';
                          if (isSecondColumn && isStickyColumn) return 'left-[150px]'; // Width của cột đầu tiên
                          return '';
                        };

                        const cellClass = `
                          px-4 py-3 
                          ${col.align === 'right' ? 'text-right' : col.align === 'center' ? 'text-center' : 'text-left'}
                          ${isStickyColumn ? `sticky ${getStickyStyle()} bg-white hover:bg-blue-50 z-10 border-r border-gray-200 transition-colors duration-200` : ''}
                        `.trim();

                        return (
                          <td 
                            key={col.key === 'dynamic_step' ? `step_${col.stepCode}` : String(col.key)}
                            className={cellClass}
                          >
                            {renderCell(item, col)}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
              {data.length === 0 && (
                <div className="p-8 text-center text-gray-500">
                  Không có dữ liệu để hiển thị
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}