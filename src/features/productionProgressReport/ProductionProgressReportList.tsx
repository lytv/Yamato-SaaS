'use client';

/**
 * ProductionProgressReportList Component
 * Data table for production progress report
 * Following Yamato-SaaS patterns with responsive design
 */

import { Download, TrendingDown, TrendingUp } from 'lucide-react';
import { useTranslations } from 'next-intl';
import React, { useMemo } from 'react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DataTable } from '@/components/ui/data-table';
import { Skeleton } from '@/components/ui/skeleton';
import { ProductionProgressReportSkeleton } from '@/features/productionProgressReport/ProductionProgressReportSkeleton';
import { useProductionProgressReport } from '@/hooks/useProductionProgressReport';
import { useProductionProgressReportExport } from '@/hooks/useProductionProgressReportExport';
import { useProductionProgressReportFilters } from '@/hooks/useProductionProgressReportFilters';
import type { 
  ProductionProgressReportItem,
  ProductionProgressReportColumn,
  CompletionRateColor,
} from '@/types/productionProgressReport';

type ProductionProgressReportListProps = {
  className?: string;
};

export function ProductionProgressReportList({
  className = '',
}: ProductionProgressReportListProps): JSX.Element {
  const t = useTranslations('productionProgressReport.list');
  const { filters } = useProductionProgressReportFilters();
  const { exportData, isExporting } = useProductionProgressReportExport();

  // Fetch data with current filters
  const {
    data,
    summary,
    isLoading,
    isError,
    refetch,
  } = useProductionProgressReport({
    ...filters,
    page: 1,
    limit: 20,
  });

  // Define table columns
  const columns: ProductionProgressReportColumn[] = useMemo(() => [
    {
      key: 'report_type',
      label: t('columns.reportType', { defaultValue: 'Type' }),
      sortable: true,
      width: '100px',
      align: 'center',
    },
    {
      key: 'entity_name',
      label: t('columns.entityName', { defaultValue: 'Entity' }),
      sortable: true,
      width: '200px',
      align: 'left',
    },
    {
      key: 'plan_code',
      label: t('columns.planCode', { defaultValue: 'Plan' }),
      sortable: true,
      width: '120px',
      align: 'center',
    },
    {
      key: 'product_code',
      label: t('columns.productCode', { defaultValue: 'Product' }),
      sortable: true,
      width: '120px',
      align: 'center',
    },
    {
      key: 'step_code',
      label: t('columns.stepCode', { defaultValue: 'Step' }),
      sortable: true,
      width: '120px',
      align: 'center',
    },
    {
      key: 'total_assigned',
      label: t('columns.totalAssigned', { defaultValue: 'Assigned' }),
      sortable: true,
      width: '100px',
      align: 'right',
      format: 'number',
    },
    {
      key: 'total_received',
      label: t('columns.totalReceived', { defaultValue: 'Received' }),
      sortable: true,
      width: '100px',
      align: 'right',
      format: 'number',
    },
    {
      key: 'total_made',
      label: t('columns.totalMade', { defaultValue: 'Made' }),
      sortable: true,
      width: '100px',
      align: 'right',
      format: 'number',
    },
    {
      key: 'remaining_quantity',
      label: t('columns.remaining', { defaultValue: 'Remaining' }),
      sortable: true,
      width: '100px',
      align: 'right',
      format: 'number',
    },
    {
      key: 'completion_rate',
      label: t('columns.completionRate', { defaultValue: 'Completion' }),
      sortable: true,
      width: '120px',
      align: 'right',
      format: 'percentage',
    },
  ], [t]);

  const getCompletionRateColor = (rate: number): CompletionRateColor => {
    if (rate >= 100) return 'success';
    if (rate >= 80) return 'success';
    if (rate >= 50) return 'warning';
    return 'danger';
  };

  const getReportTypeVariant = (type: string) => {
    return type === 'EMPLOYEE_SUMMARY' ? 'default' : 'secondary';
  };

  const formatCellValue = (item: ProductionProgressReportItem, column: ProductionProgressReportColumn) => {
    const value = item[column.key];

    switch (column.format) {
      case 'number':
        return typeof value === 'number' ? value.toLocaleString() : '0';
      case 'percentage':
        return typeof value === 'number' ? `${value.toFixed(1)}%` : '0.0%';
      case 'text':
      default:
        return String(value || '');
    }
  };

  const renderCell = (item: ProductionProgressReportItem, column: ProductionProgressReportColumn) => {
    const value = item[column.key];

    switch (column.key) {
      case 'report_type':
        return (
          <Badge variant={getReportTypeVariant(String(value))}>
            {value === 'EMPLOYEE_SUMMARY' ? 'Employee' : 'Outsource'}
          </Badge>
        );
      case 'completion_rate':
        const rate = typeof value === 'number' ? value : 0;
        const color = getCompletionRateColor(rate);
        return (
          <div className="flex items-center gap-1">
            {rate >= 100 ? (
              <TrendingUp className="h-4 w-4 text-green-600" />
            ) : rate < 50 ? (
              <TrendingDown className="h-4 w-4 text-red-600" />
            ) : null}
            <Badge variant={color === 'danger' ? 'destructive' : color === 'warning' ? 'outline' : 'default'}>
              {rate.toFixed(1)}%
            </Badge>
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

  const handleExport = async (format: 'xlsx' | 'csv') => {
    await exportData({
      ...filters,
      format,
      includeHeaders: true,
      filename: `production_progress_report_${new Date().toISOString().slice(0, 10)}`,
    });
  };

  if (isError) {
    return (
      <Card className={className}>
        <CardContent className="p-6">
          <div className="text-center text-red-600">
            <p>{t('error', { defaultValue: 'Failed to load production progress report' })}</p>
            <Button variant="outline" onClick={() => refetch()} className="mt-2">
              {t('retry', { defaultValue: 'Retry' })}
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              {t('summary.totalRecords', { defaultValue: 'Total Records' })}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {isLoading ? <Skeleton className="h-8 w-16" /> : summary.total_records.toLocaleString()}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              {t('summary.totalEntities', { defaultValue: 'Total Entities' })}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {isLoading ? <Skeleton className="h-8 w-16" /> : summary.total_entities.toLocaleString()}
            </div>
            <div className="text-xs text-gray-500 mt-1">
              {summary.employee_count} employees, {summary.outsource_count} outsources
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              {t('summary.totalMade', { defaultValue: 'Total Made' })}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {isLoading ? <Skeleton className="h-8 w-16" /> : summary.total_made.toLocaleString()}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              {t('summary.avgCompletionRate', { defaultValue: 'Avg Completion' })}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {isLoading ? <Skeleton className="h-8 w-16" /> : `${summary.average_completion_rate.toFixed(1)}%`}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Data Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>
              {t('title', { defaultValue: 'Production Progress Report' })}
            </CardTitle>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleExport('xlsx')}
                disabled={isExporting || isLoading}
              >
                <Download className="h-4 w-4 mr-2" />
                {t('export.excel', { defaultValue: 'Excel' })}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleExport('csv')}
                disabled={isExporting || isLoading}
              >
                <Download className="h-4 w-4 mr-2" />
                {t('export.csv', { defaultValue: 'CSV' })}
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <ProductionProgressReportSkeleton />
          ) : (
            <DataTable
              columns={columns.map(col => ({
                id: col.key,
                header: col.label,
                accessorKey: col.key,
                cell: ({ row }: { row: { original: ProductionProgressReportItem } }) => renderCell(row.original, col),
              }))}
              data={data as any[]}
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}