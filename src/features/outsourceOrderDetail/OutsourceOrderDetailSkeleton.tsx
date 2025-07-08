/**
 * OutsourceOrderDetail Skeleton Component for Loading States
 * Generated based on existing pattern from OutsourceOrderSkeleton.tsx
 */

'use client';

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

export function OutsourceOrderDetailSkeleton() {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>#</TableHead>
          <TableHead>Plan</TableHead>
          <TableHead>Product</TableHead>
          <TableHead>Production Step</TableHead>
          <TableHead className="text-right">Ordered Qty</TableHead>
          <TableHead className="text-right">Completed</TableHead>
          <TableHead className="text-right">Unit Price</TableHead>
          <TableHead className="text-right">Total Price</TableHead>
          <TableHead>Expected Date</TableHead>
          <TableHead>Status</TableHead>
          <TableHead className="w-24 text-center">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {Array.from({ length: 5 }).map((_, index) => (
          <TableRow key={index}>
            <TableCell>
              <div className="h-4 w-6 animate-pulse rounded bg-gray-200" />
            </TableCell>
            <TableCell>
              <div className="space-y-1">
                <div className="h-4 w-16 animate-pulse rounded bg-gray-200" />
                <div className="h-3 w-24 animate-pulse rounded bg-gray-100" />
              </div>
            </TableCell>
            <TableCell>
              <div className="space-y-1">
                <div className="h-4 w-20 animate-pulse rounded bg-gray-200" />
                <div className="h-3 w-32 animate-pulse rounded bg-gray-100" />
              </div>
            </TableCell>
            <TableCell>
              <div className="space-y-1">
                <div className="h-4 w-18 animate-pulse rounded bg-gray-200" />
                <div className="h-3 w-28 animate-pulse rounded bg-gray-100" />
              </div>
            </TableCell>
            <TableCell className="text-right">
              <div className="ml-auto h-4 w-12 animate-pulse rounded bg-gray-200" />
            </TableCell>
            <TableCell className="text-right">
              <div className="ml-auto h-4 w-12 animate-pulse rounded bg-gray-200" />
            </TableCell>
            <TableCell className="text-right">
              <div className="ml-auto h-4 w-16 animate-pulse rounded bg-gray-200" />
            </TableCell>
            <TableCell className="text-right">
              <div className="ml-auto h-4 w-20 animate-pulse rounded bg-gray-200" />
            </TableCell>
            <TableCell>
              <div className="h-4 w-20 animate-pulse rounded bg-gray-200" />
            </TableCell>
            <TableCell>
              <div className="h-6 w-16 animate-pulse rounded-full bg-gray-200" />
            </TableCell>
            <TableCell>
              <div className="flex justify-center gap-1">
                <div className="h-8 w-8 animate-pulse rounded bg-gray-200" />
                <div className="h-8 w-8 animate-pulse rounded bg-gray-200" />
              </div>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
