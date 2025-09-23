'use client';

/**
 * ProductionProgressReportList Component
 * Data table for production progress report
 * Following Yamato-SaaS patterns with responsive design
 */

import {
  AlertCircle,
  Calendar,
  CheckCircle2,
  Download,
  Factory,
  Hash,
  Package,
  RefreshCw,
  Settings,
  Target,
  TrendingUp,
  Users,
} from 'lucide-react';
import { useTranslations } from 'next-intl';
import React, { useMemo } from 'react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DataTable } from '@/components/ui/data-table';
import { ProductionProgressReportSkeleton } from '@/features/productionProgressReport/ProductionProgressReportSkeleton';
import { useProductionProgressReport } from '@/hooks/useProductionProgressReport';
import { useProductionProgressReportExport } from '@/hooks/useProductionProgressReportExport';
import { useProductionProgressReportFilters } from '@/hooks/useProductionProgressReportFilters';
import type {
  ProductionProgressReportColumn,
  ProductionProgressReportItem,
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
      width: '180px',
      align: 'center',
    },
    {
      key: 'step_code',
      label: t('columns.stepCode', { defaultValue: 'Step' }),
      sortable: true,
      width: '180px',
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
      key: 'total_made',
      label: t('columns.totalMade', { defaultValue: 'Made' }),
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
      key: 'remaining_quantity',
      label: t('columns.remaining', { defaultValue: 'Remaining' }),
      sortable: true,
      width: '100px',
      align: 'right',
      format: 'number',
    },
  ], [t]);

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
          <div className="flex items-center justify-center gap-2">
            {value === 'EMPLOYEE_SUMMARY'
              ? (
                  <Users className="size-4 text-blue-600" />
                )
              : (
                  <Factory className="size-4 text-purple-600" />
                )}
            <Badge variant={getReportTypeVariant(String(value))} className="font-mono text-xs">
              {value === 'EMPLOYEE_SUMMARY' ? 'Employee' : 'Outsource'}
            </Badge>
          </div>
        );

      case 'entity_name':
        return (
          <div className="flex min-w-0 items-center gap-2">
            {item.report_type === 'EMPLOYEE_SUMMARY'
              ? (
                  <Users className="size-4 shrink-0 text-blue-600" />
                )
              : (
                  <Factory className="size-4 shrink-0 text-purple-600" />
                )}
            <div className="min-w-0">
              <div className="truncate font-medium text-gray-900">{String(value)}</div>
              <div className="truncate text-xs text-gray-500">
                {item.report_type === 'EMPLOYEE_SUMMARY' ? 'Nhân viên' : 'Gia công'}
              </div>
            </div>
          </div>
        );

      case 'plan_code':
        return (
          <div className="flex items-center justify-center gap-2">
            <Calendar className="size-4 text-green-600" />
            <Badge variant="outline" className="font-mono text-xs">
              {String(value)}
            </Badge>
          </div>
        );

      case 'product_code':
        return (
          <div className="flex items-center justify-center gap-2">
            <Package className="size-4 text-orange-600" />
            <div className="text-center">
              <div className="text-sm font-medium text-gray-900">{item.product_name || String(value)}</div>
              <div className="text-xs text-gray-500">{String(value)}</div>
            </div>
          </div>
        );

      case 'step_code':
        return (
          <div className="flex items-center justify-center gap-2">
            <Settings className="size-4 text-indigo-600" />
            <div className="text-center">
              <div className="text-sm font-medium text-gray-900">{item.step_name || String(value)}</div>
              <div className="text-xs text-gray-500">{String(value)}</div>
            </div>
          </div>
        );

      case 'total_assigned':
        return (
          <div className="flex items-center justify-end gap-2">
            <Target className="size-4 text-blue-600" />
            <Badge variant="secondary" className="font-mono">
              {formatCellValue(item, column)}
            </Badge>
          </div>
        );

      case 'total_made':
        return (
          <div className="flex items-center justify-end gap-2">
            <CheckCircle2 className="size-4 text-green-600" />
            <Badge variant="secondary" className="font-mono">
              {formatCellValue(item, column)}
            </Badge>
          </div>
        );

      case 'total_received':
        return (
          <div className="flex items-center justify-end gap-2">
            <Package className="size-4 text-indigo-600" />
            <Badge variant="secondary" className="font-mono">
              {formatCellValue(item, column)}
            </Badge>
          </div>
        );

      case 'remaining_quantity': {
        const remaining = typeof value === 'number' ? value : 0;
        return (
          <div className="flex items-center justify-end gap-2">
            <AlertCircle className={`size-4 ${remaining > 0 ? 'text-orange-600' : 'text-green-600'}`} />
            <Badge
              variant={remaining > 0 ? 'destructive' : 'default'}
              className="font-mono"
            >
              {remaining.toLocaleString()}
            </Badge>
          </div>
        );
      }

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
    if (!data || data.length === 0) {
      return null;
    }

    const totalAssigned = data.reduce((sum, item) => sum + (item.total_assigned || 0), 0);
    const totalMade = data.reduce((sum, item) => sum + (item.total_made || 0), 0);
    const totalReceived = data.reduce((sum, item) => sum + (item.total_received || 0), 0);
    const totalRemaining = data.reduce((sum, item) => sum + (item.remaining_quantity || 0), 0);
    const averageCompletion = totalAssigned > 0 ? (totalReceived / totalAssigned) * 100 : 0;

    const employeeRecords = data.filter(item => item.report_type === 'EMPLOYEE_SUMMARY');
    const outsourceRecords = data.filter(item => item.report_type === 'OUTSOURCE_DETAIL');

    const onTimeItems = data.filter(item =>
      (item.completion_rate || 0) >= 80,
    );
    const delayedItems = data.filter(item =>
      (item.completion_rate || 0) < 50,
    );

    return {
      totalAssigned,
      totalMade,
      totalReceived,
      totalRemaining,
      averageCompletion,
      employeeCount: employeeRecords.length,
      outsourceCount: outsourceRecords.length,
      onTimeCount: onTimeItems.length,
      delayedCount: delayedItems.length,
      totalRecords: data.length,
    };
  }, [data]);

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
    <div className={`space-y-6 ${className}`}>
      {/* Summary Cards */}
      {summaryMetrics && (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card className="border-blue-200 bg-gradient-to-r from-blue-50 to-blue-100">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-blue-500 p-2">
                  <Target className="size-5 text-white" />
                </div>
                <div>
                  <p className="text-sm font-medium text-blue-700">Đã giao</p>
                  <p className="text-2xl font-bold text-blue-900">
                    {summaryMetrics.totalAssigned.toLocaleString()}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-green-200 bg-gradient-to-r from-green-50 to-green-100">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-green-500 p-2">
                  <CheckCircle2 className="size-5 text-white" />
                </div>
                <div>
                  <p className="text-sm font-medium text-green-700">Đã hoàn thành</p>
                  <p className="text-2xl font-bold text-green-900">
                    {summaryMetrics.totalMade.toLocaleString()}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-purple-200 bg-gradient-to-r from-purple-50 to-purple-100">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-purple-500 p-2">
                  <TrendingUp className="size-5 text-white" />
                </div>
                <div>
                  <p className="text-sm font-medium text-purple-700">Tỷ lệ TB</p>
                  <p className="text-2xl font-bold text-purple-900">
                    {summaryMetrics.averageCompletion.toFixed(1)}
                    %
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-orange-200 bg-gradient-to-r from-orange-50 to-orange-100">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-orange-500 p-2">
                  <AlertCircle className="size-5 text-white" />
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
        <CardHeader className="border-b bg-gradient-to-r from-blue-50 to-indigo-50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-white p-2 shadow-sm">
                <Factory className="size-6 text-blue-600" />
              </div>
              <div>
                <CardTitle className="text-xl text-gray-900">
                  {t('title', { defaultValue: 'Báo cáo Tiến độ Sản xuất - Chi tiết' })}
                </CardTitle>
                <p className="mt-1 text-sm text-gray-600">
                  Theo dõi chi tiết tiến độ theo từng nhân viên và đơn vị gia công
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="px-3 py-1">
                <Hash className="mr-1 size-3" />
                {data?.length || 0}
                {' '}
                bản ghi
              </Badge>
              <Button
                variant="outline"
                size="sm"
                onClick={() => refetch()}
                disabled={isLoading}
                className="bg-white hover:bg-gray-50"
                title="Làm mới dữ liệu"
              >
                <RefreshCw className={`mr-2 size-4 ${isLoading ? 'animate-spin' : ''}`} />
                Làm mới
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleExport('xlsx')}
                disabled={isExporting || isLoading}
                className="bg-white hover:bg-gray-50"
              >
                <Download className="mr-2 size-4" />
                {t('export.excel', { defaultValue: 'Excel' })}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleExport('csv')}
                disabled={isExporting || isLoading}
                className="bg-white hover:bg-gray-50"
              >
                <Download className="mr-2 size-4" />
                {t('export.csv', { defaultValue: 'CSV' })}
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading
            ? (
                <ProductionProgressReportSkeleton />
              )
            : (
                <DataTable
                  columns={columns.map(col => ({
                    id: col.key,
                    header: ({ column }: any) => {
                      const getHeaderIcon = () => {
                        switch (col.key) {
                          case 'report_type':
                            return <Users className="size-4 text-blue-600" />;
                          case 'entity_name':
                            return <Factory className="size-4 text-purple-600" />;
                          case 'plan_code':
                            return <Calendar className="size-4 text-green-600" />;
                          case 'product_code':
                            return <Package className="size-4 text-orange-600" />;
                          case 'step_code':
                            return <Settings className="size-4 text-indigo-600" />;
                          case 'total_assigned':
                            return <Target className="size-4 text-blue-600" />;
                          case 'total_made':
                            return <CheckCircle2 className="size-4 text-green-600" />;
                          case 'total_received':
                            return <Package className="size-4 text-indigo-600" />;
                          case 'remaining_quantity':
                            return <AlertCircle className="size-4 text-orange-600" />;
                          default:
                            return null;
                        }
                      };

                      return (
                        <div className={`flex items-center gap-2 font-semibold text-gray-700 ${
                          col.align === 'right'
                            ? 'justify-end'
                            : col.align === 'center' ? 'justify-center' : 'justify-start'
                        }`}
                        >
                          {getHeaderIcon()}
                          <span>{col.label}</span>
                          {col.sortable && (
                            <button
                              type="button"
                              onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
                              className="ml-1 rounded p-1 hover:bg-gray-100"
                            >
                              <TrendingUp className="size-3" />
                            </button>
                          )}
                        </div>
                      );
                    },
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
