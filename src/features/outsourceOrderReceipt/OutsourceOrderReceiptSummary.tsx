/**
 * OutsourceOrderReceipt Summary Component with Statistics
 * Generated based on existing pattern from OutsourceOrderDetailSummary.tsx
 */

'use client';

import {
  CheckCircle,
  Package,
} from 'lucide-react';
import { useTranslations } from 'next-intl';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useOutsourceOrderReceiptStats } from '@/hooks/useOutsourceOrderReceipts';

type OutsourceOrderReceiptSummaryProps = {
  outsourceOrderDetailId?: number;
  className?: string;
};

export function OutsourceOrderReceiptSummary({
  outsourceOrderDetailId,
  className,
}: OutsourceOrderReceiptSummaryProps) {
  const t = useTranslations('OutsourceOrderReceiptSummary');
  const {
    data: stats,
    isLoading,
    error,
  } = useOutsourceOrderReceiptStats(outsourceOrderDetailId);

  if (isLoading) {
    return (
      <div className={`grid grid-cols-1 gap-6 md:grid-cols-2 ${className}`}>
        {Array.from({ length: 2 }).map((_, index) => (
          <Card key={index}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <div className="h-4 w-24 animate-pulse rounded bg-gray-200" />
              <div className="size-4 animate-pulse rounded bg-gray-200" />
            </CardHeader>
            <CardContent>
              <div className="mb-2 h-8 w-16 animate-pulse rounded bg-gray-200" />
              <div className="h-3 w-20 animate-pulse rounded bg-gray-200" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (error || !stats) {
    return (
      <div className={`py-8 text-center ${className}`}>
        <p className="text-gray-500">{t('failedToLoadReceiptStatistics')}</p>
      </div>
    );
  }

  const formatNumber = (num?: number) => {
    if (num === undefined || num === null) {
      return '0';
    }
    return new Intl.NumberFormat('vi-VN').format(num);
  };

  return (
    <div className={`grid grid-cols-1 gap-6 md:grid-cols-2 ${className}`}>
      {/* Total Receipts */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">{t('totalReceipts')}</CardTitle>
          <Package className="size-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{formatNumber(stats.total)}</div>
          <p className="text-xs text-muted-foreground">
            {formatNumber(stats.today)}
            {' '}
            {t('today')}
            ,
            {' '}
            {formatNumber(stats.thisMonth)}
            {' '}
            {t('thisMonth')}
          </p>
        </CardContent>
      </Card>

      {/* Total Quantity Received */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">{t('quantityReceived')}</CardTitle>
          <CheckCircle className="size-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{formatNumber(stats.totalReceiptQuantity)}</div>
          <p className="text-xs text-muted-foreground">
            {t('totalUnitsReceivedAcrossAllReceipts')}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
