'use client';

import type { ColumnDef } from '@tanstack/react-table';
import {
  flexRender,
  getCoreRowModel,
  useReactTable,
} from '@tanstack/react-table';
import { useMemo, useState } from 'react';
import { useDebounce } from 'use-debounce';

import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { ProductStepCrosstabFilter } from '@/features/product-step-crosstab/ProductStepCrosstabFilter';
import { useProductStepCrosstab } from '@/hooks/useProductStepCrosstab';
import type { PriceType } from '@/types/productStepCrosstab';

type PivotData = {
  productCode: string;
  productName: string;
  [key: string]: string;
};

export const ProductStepCrosstabContainer = () => {
  const [productCode, setProductCode] = useState('');
  const [generalSearch, setGeneralSearch] = useState('');
  const [priceType, setPriceType] = useState<PriceType>('calculated');
  const [showAll, setShowAll] = useState(false);
  const [paginationState, setPaginationState] = useState({ page: 1, limit: 10 });

  const [debouncedProductCode] = useDebounce(productCode, 300);
  const [debouncedGeneralSearch] = useDebounce(generalSearch, 300);

  const { data, pagination, isLoading, error, handleExport, isExporting }
    = useProductStepCrosstab({
      page: paginationState.page,
      limit: paginationState.limit,
      productCode: debouncedProductCode,
      search: debouncedGeneralSearch,
      priceType,
      showAll,
    });

  const { columns, pivotData } = useMemo(() => {
    const dataForPivot = data || [];
    if (dataForPivot.length === 0) {
      return { columns: [], pivotData: [] };
    }

    const allSteps = new Map<string, string>();
    dataForPivot.forEach((product) => {
      product.steps.forEach((step) => {
        if (!allSteps.has(step.stepCode)) {
          allSteps.set(step.stepCode, step.stepName);
        }
      });
    });

    const newPivotData: PivotData[] = dataForPivot.map((product) => {
      const row: PivotData = {
        productCode: product.productCode,
        productName: product.productName,
      };
      product.steps.forEach((step) => {
        row[step.stepCode] = step.price;
      });
      return row;
    });

    const dynamicColumns: ColumnDef<PivotData, any>[] = Array.from(
      allSteps.entries(),
    ).map(([stepCode, stepName]) => ({
      accessorKey: stepCode,
      header: () => (
        <div className="text-center">
          <div>{stepCode}</div>
          <div className="text-xs font-normal text-muted-foreground">
            {stepName}
          </div>
        </div>
      ),
      cell: ({ row }) => {
        const value = row.getValue(stepCode);
        const displayValue = value === null || value === undefined ? '' : String(value);
        return <div className="text-right">{displayValue}</div>;
      },
    }));

    const newColumns: ColumnDef<PivotData, any>[] = [
      {
        accessorKey: 'productCode',
        header: 'Product Code',
      },
      {
        accessorKey: 'productName',
        header: 'Product Name',
      },
      ...dynamicColumns,
    ];

    return { columns: newColumns, pivotData: newPivotData };
  }, [data]);

  const table = useReactTable({
    data: pivotData,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  const handlePageChange = (newPage: number) => {
    setPaginationState(prev => ({ ...prev, page: newPage }));
  };

  return (
    <div className="space-y-4">
      <ProductStepCrosstabFilter
        productCode={productCode}
        onProductCodeChange={setProductCode}
        generalSearch={generalSearch}
        onGeneralSearchChange={setGeneralSearch}
        priceType={priceType}
        onPriceTypeChange={setPriceType}
        onExport={handleExport}
        isExporting={isExporting}
        showAll={showAll}
        onShowAllChange={setShowAll}
      />

      {isLoading && <div className="py-10 text-center">Loading...</div>}
      {error && (
        <div className="py-10 text-center text-red-500">
          Error:
          {error}
        </div>
      )}

      {!isLoading && !error && (
        <>
          <div className="text-sm text-muted-foreground">
            {pagination
            && !showAll
            && `Showing ${pivotData.length} of ${pagination.total} results. • Page ${pagination.page}`}
            {pagination
            && showAll
            && `Showing all ${pivotData.length} results.`}
          </div>

          <div className="rounded-md border">
            <Table>
              <TableHeader>
                {table.getHeaderGroups().map(headerGroup => (
                  <TableRow key={headerGroup.id}>
                    {headerGroup.headers.map(header => (
                      <TableHead key={header.id}>
                        {header.isPlaceholder
                          ? null
                          : flexRender(
                            header.column.columnDef.header,
                            header.getContext(),
                          )}
                      </TableHead>
                    ))}
                  </TableRow>
                ))}
              </TableHeader>
              <TableBody>
                {table.getRowModel().rows?.length
                  ? (
                      table.getRowModel().rows.map(row => (
                        <TableRow
                          key={row.id}
                          data-state={row.getIsSelected() && 'selected'}
                        >
                          {row.getVisibleCells().map(cell => (
                            <TableCell
                              key={cell.id}
                              className="whitespace-nowrap p-2 text-sm"
                            >
                              {flexRender(
                                cell.column.columnDef.cell,
                                cell.getContext(),
                              )}
                            </TableCell>
                          ))}
                        </TableRow>
                      ))
                    )
                  : (
                      <TableRow>
                        <TableCell
                          colSpan={columns.length}
                          className="h-24 text-center"
                        >
                          No results found.
                        </TableCell>
                      </TableRow>
                    )}
              </TableBody>
            </Table>
          </div>

          {!showAll && pagination && pagination.total > 0 && (
            <div className="flex items-center justify-end space-x-2 py-4">
              <span className="text-sm">
                Page
                {' '}
                {pagination.page}
                {' '}
                of
                {' '}
                {pagination.totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(pagination.page - 1)}
                disabled={pagination.page <= 1}
              >
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(pagination.page + 1)}
                disabled={pagination.page >= pagination.totalPages}
              >
                Next
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
};
