'use client';

import { useState } from 'react';
import { useSalaryDetails } from '@/hooks/useSalaryDetails';
import { useSalaryDetailsFilters } from '@/hooks/useSalaryDetailsFilters';
import { useSalaryDetailsUsers } from '@/hooks/useSalaryDetailsUsers';
import { useSalaryDetailsExport } from '@/hooks/useSalaryDetailsExport';
import { useEmployeeSummaryExport } from '@/hooks/useEmployeeSummaryExport';
import { SalaryDetailsFilter } from './SalaryDetailsFilter';
import { SalaryDetailsSkeleton } from './SalaryDetailsSkeleton';
import { DataTable } from '@/components/ui/data-table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ColumnDef } from '@tanstack/react-table';
import { SalaryDetail, UserSummary } from '@/types/salaryDetails';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import { ChevronLeft, ChevronRight, Download } from 'lucide-react';

// Utility function to safely format numbers
const formatNumber = (value: number | null | undefined): string => {
  return (value || 0).toLocaleString('vi-VN');
};

const formatCurrency = (value: number | null | undefined): string => {
  return `${formatNumber(value)} ₫`;
};

export function SalaryDetailsList() {
  const { filters, updateFilter, clearFilters, toggleSort } = useSalaryDetailsFilters();
  const [currentPage, setCurrentPage] = useState(1);
  const { exportSalaryDetails, isExporting } = useSalaryDetailsExport();
  const { exportEmployeeSummary, isExporting: isExportingSummary } = useEmployeeSummaryExport();
  
  // Fetch user options from API
  const { data: userOptions = [], isLoading: isLoadingUsers } = useSalaryDetailsUsers();

  const queryParams = {
    search: filters.search,
    userIds: filters.userIds.join(','),
    startDate: filters.startDate,
    endDate: filters.endDate,
    sortBy: filters.sortBy,
    sortOrder: filters.sortOrder,
    page: currentPage,
    limit: 50,
    showAll: filters.showAll,
  };

  const { data, isLoading, error } = useSalaryDetails(queryParams);

  const columns: ColumnDef<SalaryDetail>[] = [
    {
      accessorKey: 'work_date',
      header: () => (
        <Button
          variant="ghost"
          onClick={() => toggleSort('work_date')}
          className="h-8 px-2"
        >
          Ngày làm việc
        </Button>
      ),
      cell: ({ row }) => (
        <div className="text-sm">
          {format(new Date(row.getValue('work_date')), 'dd/MM/yyyy', { locale: vi })}
        </div>
      ),
    },
    {
      accessorKey: 'full_name',
      header: () => (
        <Button
          variant="ghost"
          onClick={() => toggleSort('full_name')}
          className="h-8 px-2"
        >
          Nhân viên
        </Button>
      ),
      cell: ({ row }) => (
        <div className="font-medium">{row.getValue('full_name')}</div>
      ),
    },
    {
      accessorKey: 'source_table',
      header: 'Nguồn',
      cell: ({ row }) => {
        const source = row.getValue('source_table') as string;
        return (
          <Badge variant={source === 'employee_salary' ? 'default' : 'secondary'}>
            {source === 'employee_salary' ? 'Lương NV' : 'Gia công'}
          </Badge>
        );
      },
    },
    {
      accessorKey: 'product_code',
      header: () => (
        <Button
          variant="ghost"
          onClick={() => toggleSort('product_code')}
          className="h-8 px-2"
        >
          Sản phẩm
        </Button>
      ),
      cell: ({ row }) => (
        <div>
          <div className="font-medium text-xs">{row.getValue('product_code')}</div>
          <div className="text-xs text-muted-foreground">{row.original.product_name}</div>
        </div>
      ),
    },
    {
      accessorKey: 'step_code',
      header: () => (
        <Button
          variant="ghost"
          onClick={() => toggleSort('step_code')}
          className="h-8 px-2"
        >
          Công đoạn
        </Button>
      ),
      cell: ({ row }) => (
        <div>
          <div className="font-medium text-xs">{row.getValue('step_code')}</div>
          <div className="text-xs text-muted-foreground">{row.original.step_name}</div>
        </div>
      ),
    },
    {
      accessorKey: 'quantity',
      header: () => (
        <Button
          variant="ghost"
          onClick={() => toggleSort('quantity')}
          className="h-8 px-2 justify-end"
        >
          Số lượng
        </Button>
      ),
      cell: ({ row }) => (
        <div className="text-right font-mono">
          {formatNumber(row.getValue('quantity') as number)}
        </div>
      ),
    },
    {
      accessorKey: 'unit_price',
      header: () => (
        <Button
          variant="ghost"
          onClick={() => toggleSort('unit_price')}
          className="h-8 px-2 justify-end"
        >
          Đơn giá
        </Button>
      ),
      cell: ({ row }) => (
        <div className="text-right font-mono">
          {formatCurrency(row.getValue('unit_price') as number)}
        </div>
      ),
    },
    {
      accessorKey: 'line_total',
      header: () => (
        <Button
          variant="ghost"
          onClick={() => toggleSort('line_total')}
          className="h-8 px-2 justify-end"
        >
          Thành tiền
        </Button>
      ),
      cell: ({ row }) => (
        <div className="text-right font-mono font-semibold">
          {formatCurrency(row.getValue('line_total') as number)}
        </div>
      ),
    },
  ];

  const handleExport = async () => {
    try {
      await exportSalaryDetails({
        search: filters.search,
        userIds: filters.userIds.join(','),
        startDate: filters.startDate,
        endDate: filters.endDate,
        sortBy: filters.sortBy,
        sortOrder: filters.sortOrder,
        showAll: true, // Export all data
      });
    } catch (error) {
      console.error('Export failed:', error);
    }
  };

  const handleEmployeeSummaryExport = async () => {
    try {
      await exportEmployeeSummary({
        search: filters.search,
        userIds: filters.userIds.join(','),
        startDate: filters.startDate,
        endDate: filters.endDate,
        sortBy: filters.sortBy,
        sortOrder: filters.sortOrder,
      });
    } catch (error) {
      console.error('Employee summary export failed:', error);
    }
  };

  if (isLoading) {
    return <SalaryDetailsSkeleton />;
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-red-500">Lỗi khi tải dữ liệu: {error.message}</p>
        <Button 
          variant="outline" 
          onClick={() => window.location.reload()} 
          className="mt-4"
        >
          Thử lại
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Filter Section */}
      <SalaryDetailsFilter
        filters={filters}
        onFilterChange={updateFilter}
        onClearFilters={clearFilters}
        onExport={handleExport}
        isLoading={isLoading || isLoadingUsers}
        isExporting={isExporting}
        userOptions={userOptions}
      />

      {/* Summary Cards */}
      {data?.summary && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Tổng bản ghi
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatNumber(data.summary.total_records)}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Tổng tiền lương
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {formatCurrency(data.summary.total_amount)}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Số nhân viên
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {data.summary.user_summary.length}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Khoảng thời gian
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-sm">
                {format(new Date(data.summary.date_range.start_date), 'dd/MM/yyyy', { locale: vi })} - {' '}
                {format(new Date(data.summary.date_range.end_date), 'dd/MM/yyyy', { locale: vi })}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* User Summary */}
      {data?.summary?.user_summary && data.summary.user_summary.length > 0 && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Tổng hợp theo nhân viên</CardTitle>
            <Button
              variant="outline"
              size="sm"
              onClick={handleEmployeeSummaryExport}
              disabled={isExportingSummary}
            >
              <Download className="w-4 h-4 mr-2" />
              {isExportingSummary ? 'Đang xuất...' : 'Xuất Excel'}
            </Button>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-2 font-semibold">Nhân viên</th>
                    <th className="text-right p-2 font-semibold">Tổng tiền</th>
                  </tr>
                </thead>
                <tbody>
                  {data.summary.user_summary.map((user: UserSummary) => (
                    <tr key={user.user_id} className="border-b hover:bg-gray-50">
                      <td className="p-2">
                        <div className="font-medium">{user.full_name}</div>
                      </td>
                      <td className="p-2 text-right">
                        <div className="font-mono font-semibold text-green-600">
                          {formatCurrency(user.total_amount)}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="border-t-2 font-semibold">
                    <td className="p-2">Tổng cộng</td>
                    <td className="p-2 text-right font-mono text-green-600">
                      {formatCurrency(data.summary.total_amount)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Data Table */}
      <Card>
        <CardHeader>
          <CardTitle>Chi tiết lương</CardTitle>
        </CardHeader>
        <CardContent>
          <DataTable
            columns={columns}
            data={data?.data || []}
          />

          {/* Pagination */}
          {data?.pagination && !filters.showAll && (
            <div className="flex items-center justify-between mt-4">
              <div className="text-sm text-muted-foreground">
                Hiển thị {data.data.length} trong tổng số {data.pagination.total} bản ghi
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                >
                  <ChevronLeft className="w-4 h-4" />
                  Trước
                </Button>
                <span className="text-sm">
                  Trang {currentPage} / {data.pagination.totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => prev + 1)}
                  disabled={!data.pagination.hasMore}
                >
                  Sau
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}