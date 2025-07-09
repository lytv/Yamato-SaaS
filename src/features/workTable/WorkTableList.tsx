import { useTranslations } from 'next-intl';
import { useState } from 'react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useDeleteWorkTable } from '@/hooks/useWorkTableMutations';
import { useWorkTables } from '@/hooks/useWorkTables';
import type { WorkTable, WorkTableFilters } from '@/types/workTable';

type WorkTableListProps = {
  onEdit?: (workTable: WorkTable) => void;
  onView?: (workTable: WorkTable) => void;
};

const DEFAULT_FILTERS: WorkTableFilters = {
  search: '',
  sortBy: 'createdAt',
  sortOrder: 'desc',
  tableType: 'all',
  locationCode: '',
  tableCategory: 'all',
  assignedOperator: '',
  supervisor: '',
  capacityPerHourRange: [0, 100],
  utilizationRateRange: [0, 100],
  efficiencyRatingRange: [0, 100],
  maintenanceDue: false,
  warrantyExpiring: false,
};

export function WorkTableList({ onEdit, onView }: WorkTableListProps) {
  const t = useTranslations('workTable.list');
  const [filters, setFilters] = useState<WorkTableFilters>(DEFAULT_FILTERS);
  const [currentPage, setCurrentPage] = useState(1);

  const { workTables, pagination, isLoading, error, refresh } = useWorkTables({
    page: currentPage,
    limit: 10,
    search: filters.search || undefined,
    sortBy: filters.sortBy,
    sortOrder: filters.sortOrder,
  });

  const { deleteWorkTable, isLoading: isDeleting } = useDeleteWorkTable();

  const handleSearchChange = (value: string) => {
    setFilters(prev => ({ ...prev, search: value }));
    setCurrentPage(1);
  };

  const handleDelete = async (id: number) => {
    if (confirm('Are you sure you want to delete this work table?')) {
      try {
        await deleteWorkTable(id);
        refresh();
      } catch (error) {
        console.error('Failed to delete work table:', error);
      }
    }
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  if (error) {
    return (
      <div className="p-4 text-center">
        <p className="text-red-500">
          Error:
          {error}
        </p>
        <Button onClick={refresh} className="mt-2">
          {t('retry')}
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Search and Filters */}
      <div className="flex gap-4">
        <Input
          placeholder={t('search_placeholder')}
          value={filters.search}
          onChange={e => handleSearchChange(e.target.value)}
          className="max-w-sm"
        />
      </div>

      {/* Table */}
      <div className="rounded-md border">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-muted/50">
              <tr>
                <th className="p-2 text-left">{t('code')}</th>
                <th className="p-2 text-left">{t('name')}</th>
                <th className="p-2 text-left">{t('type')}</th>
                <th className="p-2 text-left">{t('actions')}</th>
              </tr>
            </thead>
            <tbody>
              {isLoading
                ? (
                    <tr>
                      <td colSpan={7} className="p-4 text-center">
                        Loading...
                      </td>
                    </tr>
                  )
                : workTables.length === 0
                  ? (
                      <tr>
                        <td colSpan={7} className="p-4 text-center text-muted-foreground">
                          {t('no_work_tables_found')}
                        </td>
                      </tr>
                    )
                  : (
                      workTables.map(workTable => (
                        <tr key={workTable.id} className="border-t">
                          <td className="p-2">{workTable.tableCode}</td>
                          <td className="p-2">{workTable.tableName}</td>
                          <td className="p-2">{workTable.tableType}</td>
                          <td className="p-2">
                            <div className="flex gap-2">
                              {onView && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => onView(workTable)}
                                >
                                  {t('view')}
                                </Button>
                              )}
                              {onEdit && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => onEdit(workTable)}
                                >
                                  {t('edit')}
                                </Button>
                              )}
                              <Button
                                variant="destructive"
                                size="sm"
                                onClick={() => handleDelete(workTable.id)}
                                disabled={isDeleting}
                              >
                                {t('delete')}
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      {pagination && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            {t('showing', {
              from: ((pagination.page - 1) * pagination.limit) + 1,
              to: Math.min(pagination.page * pagination.limit, pagination.total),
              total: pagination.total,
            })}
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage <= 1}
            >
              {t('previous')}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={!pagination.hasMore}
            >
              {t('next')}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
