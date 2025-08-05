'use client';

/**
 * ProductionProgressPivotList Component
 * Pivot table for production progress report based on sp_production_progress_pivot
 * Following Yamato-SaaS patterns with responsive design
 */

import { 
  Download, 
  Package, 
  Calendar, 
  Target, 
  CheckCircle2, 
  AlertCircle, 
  TrendingUp,
  Hash,
  Factory,
  Settings,
  RefreshCw
} from 'lucide-react';
import { useTranslations } from 'next-intl';
import React, { useMemo } from 'react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DataTable } from '@/components/ui/data-table';
import { ProductionProgressPivotSkeleton } from '@/features/productionProgressPivot/ProductionProgressPivotSkeleton';
import { useProductionProgressPivot } from '@/hooks/useProductionProgressPivot';
import { useProductionProgressPivotExport } from '@/hooks/useProductionProgressPivotExport';
import { useProductionProgressPivotFilters } from '@/hooks/useProductionProgressPivotFilters';
import type { 
  ProductionProgressPivotItem,
  ProductionProgressPivotColumn,
  DynamicStepColumn,
} from '@/types/productionProgressPivot';

type ProductionProgressPivotListProps = {
  className?: string;
};

export function ProductionProgressPivotList({
  className = '',
}: ProductionProgressPivotListProps): JSX.Element {
  const t = useTranslations('productionProgressPivot.list');
  const { filters } = useProductionProgressPivotFilters();
  const { exportData, isExporting } = useProductionProgressPivotExport();

  // Fetch data with current filters
  const {
    data: rawData,
    isLoading,
    isError,
    refetch,
  } = useProductionProgressPivot({
    ...filters,
    page: 1,
    limit: 20,
  });

  // Filter out rows with total_completed = 0
  const data = useMemo(() => {
    if (!rawData) return [];
    return rawData.filter(item => item.total_completed > 0);
  }, [rawData]);


  // Helper function to get dynamic step columns from data
  const getDynamicStepColumns = useMemo(() => {
    if (!data || data.length === 0) return [];
    
    const stepColumns: DynamicStepColumn[] = [];
    
    // Collect ALL unique steps from ALL records first
    const allSteps = new Map<string, { stepCode: string; stepName: string; positions: Set<number> }>();
    
    data.forEach((item) => {
      for (let i = 1; i <= 150; i++) {
        const stepCode = item[`step_code_${i}` as keyof ProductionProgressPivotItem] as string | null;
        const stepName = item[`step_name_${i}` as keyof ProductionProgressPivotItem] as string | null;
        
        if (stepCode && stepName) {
          if (!allSteps.has(stepCode)) {
            allSteps.set(stepCode, {
              stepCode,
              stepName,
              positions: new Set()
            });
          }
          allSteps.get(stepCode)!.positions.add(i);
        }
      }
    });
    
    // Sort steps by their numeric value for correct ordering (cd01, cd02, cd10, cd20)
    const sortedSteps = Array.from(allSteps.values()).sort((a, b) => {
      const getNumericPart = (code: string) => {
        const match = code.match(/\d+/);
        return match ? parseInt(match[0], 10) : 0;
      };
      return getNumericPart(a.stepCode) - getNumericPart(b.stepCode);
    });
    
    // Create columns in the correct sorted order
    sortedSteps.forEach((step, index) => {
      stepColumns.push({
        stepIndex: index, // 0-based for internal use
        stepCode: step.stepCode,
        stepName: step.stepName,
        quantity: 0, // Will be filled per row
      });
    });
    
    return stepColumns;
  }, [data, data?.length]); // Add data.length as dependency to force recalculation

  // Define table columns with dynamic steps
  const columns = useMemo(() => {
    const baseColumns: ProductionProgressPivotColumn[] = [
      {
        key: 'product_name',
        label: t('columns.productName', { defaultValue: 'Sản phẩm' }),
        sortable: true,
        width: '220px',
        align: 'left',
      },
      {
        key: 'plan_code',
        label: t('columns.planCode', { defaultValue: 'Kế hoạch' }),
        sortable: true,
        width: '130px',
        align: 'center',
      },
      {
        key: 'planned_quantity',
        label: t('columns.plannedQuantity', { defaultValue: 'SL Kế hoạch' }),
        sortable: true,
        width: '130px',
        align: 'right',
        format: 'number',
      },
    ];

    // Add dynamic step columns
    const stepColumns: ProductionProgressPivotColumn[] = getDynamicStepColumns.map(step => ({
      key: 'dynamic_step',
      label: step.stepName || step.stepCode || '',
      sortable: false,
      width: '120px',
      align: 'right',
      format: 'number',
      stepIndex: step.stepIndex,
    }));

    const endColumns: ProductionProgressPivotColumn[] = [
      {
        key: 'total_completed',
        label: t('columns.totalCompleted', { defaultValue: 'Tổng hoàn thành' }),
        sortable: true,
        width: '150px',
        align: 'right',
        format: 'number',
      },
    ];

    return [...baseColumns, ...stepColumns, ...endColumns];
  }, [t, getDynamicStepColumns]);

  const formatCellValue = (item: ProductionProgressPivotItem, column: ProductionProgressPivotColumn) => {
    if (column.key === 'dynamic_step' && typeof column.stepIndex === 'number') {
      // Find the step quantity by matching stepCode, not by stepIndex position
      const targetStepCode = getDynamicStepColumns[column.stepIndex]?.stepCode;
      if (targetStepCode) {
        // Search through all step positions to find matching stepCode
        for (let i = 1; i <= 150; i++) {
          const stepCode = item[`step_code_${i}` as keyof ProductionProgressPivotItem] as string | null;
          if (stepCode === targetStepCode) {
            const quantity = item[`step_quantity_${i}` as keyof ProductionProgressPivotItem] as number;
            return quantity.toLocaleString();
          }
        }
      }
      return '0';
    }

    const value = item[column.key as keyof ProductionProgressPivotItem];

    switch (column.format) {
      case 'number':
        return typeof value === 'number' ? value.toLocaleString() : '0';
      case 'text':
      default:
        return String(value || '');
    }
  };

  const getProgressColor = (current: number, planned: number) => {
    if (planned === 0) return 'bg-gray-200';
    const percentage = (current / planned) * 100;
    if (percentage >= 100) return 'bg-green-500';
    if (percentage >= 80) return 'bg-blue-500';
    if (percentage >= 50) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  const getCompletionBadgeVariant = (current: number, planned: number) => {
    if (planned === 0) return 'secondary';
    const percentage = (current / planned) * 100;
    if (percentage >= 100) return 'default';
    if (percentage >= 80) return 'secondary';
    if (percentage >= 50) return 'outline';
    return 'destructive';
  };

  const renderCell = (item: ProductionProgressPivotItem, column: ProductionProgressPivotColumn) => {
    let value: any;
    
    if (column.key === 'dynamic_step' && typeof column.stepIndex === 'number') {
      // Find the step quantity by matching stepCode, not by stepIndex position
      const targetStepCode = getDynamicStepColumns[column.stepIndex]?.stepCode;
      if (targetStepCode) {
        // Search through all step positions to find matching stepCode
        for (let i = 1; i <= 150; i++) {
          const stepCode = item[`step_code_${i}` as keyof ProductionProgressPivotItem] as string | null;
          if (stepCode === targetStepCode) {
            value = item[`step_quantity_${i}` as keyof ProductionProgressPivotItem];
            break;
          }
        }
      }
      value = value || 0;
    } else {
      value = item[column.key as keyof ProductionProgressPivotItem];
    }

    switch (column.key) {
      case 'product_name':
        return (
          <div className="flex items-center gap-2 min-w-0">
            <Package className="h-4 w-4 text-blue-600 flex-shrink-0" />
            <div className="min-w-0">
              <div className="font-medium text-gray-900 truncate">{item.product_name}</div>
              <div className="text-xs text-gray-500 truncate">{item.product_code}</div>
            </div>
          </div>
        );

      case 'plan_code':
        return (
          <div className="flex items-center justify-center gap-2">
            <Calendar className="h-4 w-4 text-green-600" />
            <Badge variant="outline" className="font-mono text-xs">
              {item.plan_code}
            </Badge>
          </div>
        );

      case 'planned_quantity':
        return (
          <div className="flex items-center justify-end gap-2">
            <Target className="h-4 w-4 text-orange-600" />
            <Badge variant="secondary" className="font-mono">
              {(typeof value === 'number' ? value : 0).toLocaleString()}
            </Badge>
          </div>
        );

      case 'total_completed':
        const planned = item.planned_quantity;
        const completed = typeof value === 'number' ? value : 0;
        const percentage = planned > 0 ? (completed / planned) * 100 : 0;
        
        return (
          <div className="space-y-1">
            <div className="flex items-center justify-end gap-2">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <Badge 
                variant={getCompletionBadgeVariant(completed, planned)}
                className="font-mono"
              >
                {completed.toLocaleString()}
              </Badge>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-1">
              <div 
                className={`h-1 rounded-full transition-all duration-300 ${getProgressColor(completed, planned)}`}
                style={{ width: `${Math.min(percentage, 100)}%` }}
              />
            </div>
            <div className="text-xs text-gray-500 text-right">
              {percentage.toFixed(1)}%
            </div>
          </div>
        );

      case 'dynamic_step':
        const stepQuantity = typeof value === 'number' ? value : 0;
        const stepPlanned = item.planned_quantity;
        const stepPercentage = stepPlanned > 0 ? (stepQuantity / stepPlanned) * 100 : 0;
        
        return (
          <div className="space-y-1">
            <div className="flex items-center justify-end gap-1">
              <Settings className="h-3 w-3 text-purple-600" />
              <Badge 
                variant={stepQuantity > 0 ? 'default' : 'secondary'}
                className="font-mono text-xs"
              >
                {stepQuantity.toLocaleString()}
              </Badge>
            </div>
            {stepQuantity > 0 && (
              <div className="w-full bg-gray-200 rounded-full h-1">
                <div 
                  className={`h-1 rounded-full transition-all duration-300 ${getProgressColor(stepQuantity, stepPlanned)}`}
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

  // Calculate summary metrics (must be before any conditional returns)
  const summaryMetrics = useMemo(() => {
    if (!data || data.length === 0) return null;

    const totalPlanned = data.reduce((sum, item) => sum + item.planned_quantity, 0);
    const totalCompleted = data.reduce((sum, item) => sum + item.total_completed, 0);
    const averageCompletion = totalPlanned > 0 ? (totalCompleted / totalPlanned) * 100 : 0;
    
    const onTimeItems = data.filter(item => 
      item.planned_quantity > 0 && (item.total_completed / item.planned_quantity) >= 0.8
    );
    const delayedItems = data.filter(item => 
      item.planned_quantity > 0 && (item.total_completed / item.planned_quantity) < 0.5
    );

    return {
      totalPlanned,
      totalCompleted,
      averageCompletion,
      onTimeCount: onTimeItems.length,
      delayedCount: delayedItems.length,
      totalItems: data.length,
    };
  }, [data]);

  const handleExport = async (format: 'xlsx' | 'csv') => {
    await exportData({
      ...filters,
      format,
      includeHeaders: true,
      filename: `production_progress_pivot_${new Date().toISOString().slice(0, 10)}`,
    });
  };

  if (isError) {
    return (
      <Card className={className}>
        <CardContent className="p-6">
          <div className="text-center text-red-600">
            <p>{t('error', { defaultValue: 'Failed to load production progress pivot data' })}</p>
            <Button variant="outline" onClick={() => refetch()} className="mt-2">
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
      {summaryMetrics && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="bg-gradient-to-r from-blue-50 to-blue-100 border-blue-200">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-500 rounded-lg">
                  <Target className="h-5 w-5 text-white" />
                </div>
                <div>
                  <p className="text-sm font-medium text-blue-700">Kế hoạch</p>
                  <p className="text-2xl font-bold text-blue-900">
                    {summaryMetrics.totalPlanned.toLocaleString()}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-r from-green-50 to-green-100 border-green-200">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-500 rounded-lg">
                  <CheckCircle2 className="h-5 w-5 text-white" />
                </div>
                <div>
                  <p className="text-sm font-medium text-green-700">Hoàn thành</p>
                  <p className="text-2xl font-bold text-green-900">
                    {summaryMetrics.totalCompleted.toLocaleString()}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-r from-purple-50 to-purple-100 border-purple-200">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-500 rounded-lg">
                  <TrendingUp className="h-5 w-5 text-white" />
                </div>
                <div>
                  <p className="text-sm font-medium text-purple-700">Tỷ lệ TB</p>
                  <p className="text-2xl font-bold text-purple-900">
                    {summaryMetrics.averageCompletion.toFixed(1)}%
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-r from-orange-50 to-orange-100 border-orange-200">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-orange-500 rounded-lg">
                  <AlertCircle className="h-5 w-5 text-white" />
                </div>
                <div>
                  <p className="text-sm font-medium text-orange-700">Chậm tiến độ</p>
                  <p className="text-2xl font-bold text-orange-900">
                    {summaryMetrics.delayedCount}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Data Table */}
      <Card className="shadow-lg">
        <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white rounded-lg shadow-sm">
                <Factory className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <CardTitle className="text-xl text-gray-900">
                  {t('title', { defaultValue: 'Báo cáo Tiến độ Sản xuất - Pivot' })}
                </CardTitle>
                <p className="text-sm text-gray-600 mt-1">
                  Theo dõi tiến độ sản xuất theo từng công đoạn
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="px-3 py-1">
                <Hash className="h-3 w-3 mr-1" />
                {data?.length || 0} bản ghi
              </Badge>
              <Button
                variant="outline"
                size="sm"
                onClick={() => refetch()}
                disabled={isLoading}
                className="bg-white hover:bg-gray-50"
                title="Làm mới dữ liệu và cột động"
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
        <CardContent>
          {isLoading ? (
            <ProductionProgressPivotSkeleton />
          ) : (
            <DataTable
              columns={columns.map(col => ({
                id: col.key === 'dynamic_step' ? `step_${col.stepIndex}` : col.key,
                header: ({ column }: any) => {
                  const getHeaderIcon = () => {
                    switch (col.key) {
                      case 'product_name':
                        return <Package className="h-4 w-4 text-blue-600" />;
                      case 'plan_code':
                        return <Calendar className="h-4 w-4 text-green-600" />;
                      case 'planned_quantity':
                        return <Target className="h-4 w-4 text-orange-600" />;
                      case 'total_completed':
                        return <CheckCircle2 className="h-4 w-4 text-green-600" />;
                      case 'dynamic_step':
                        return <Settings className="h-4 w-4 text-purple-600" />;
                      default:
                        return null;
                    }
                  };

                  return (
                    <div className={`flex items-center gap-2 font-semibold text-gray-700 ${
                      col.align === 'right' ? 'justify-end' : 
                      col.align === 'center' ? 'justify-center' : 'justify-start'
                    }`}>
                      {getHeaderIcon()}
                      <span>{col.label}</span>
                      {col.sortable && (
                        <button
                          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
                          className="ml-1 hover:bg-gray-100 rounded p-1"
                        >
                          <TrendingUp className="h-3 w-3" />
                        </button>
                      )}
                    </div>
                  );
                },
                accessorKey: col.key === 'dynamic_step' ? `step_quantity_${(col.stepIndex || 0) + 1}` : col.key,
                cell: ({ row }: { row: { original: ProductionProgressPivotItem } }) => renderCell(row.original, col),
              }))}
              data={data as any[]}
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}