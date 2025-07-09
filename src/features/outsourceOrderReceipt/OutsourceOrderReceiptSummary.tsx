/**
 * OutsourceOrderReceipt Summary Component with Statistics
 * Generated based on existing pattern from OutsourceOrderDetailSummary.tsx
 */

'use client';

import {
  AlertTriangle,
  CheckCircle,
  Clock,
  DollarSign,
  Package,
  TrendingDown,
  TrendingUp,
  Users,
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
      <div className={`grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4 ${className}`}>
        {Array.from({ length: 4 }).map((_, index) => (
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

  const formatCurrency = (amount?: number) => {
    if (amount === undefined || amount === null) {
      return '₫0';
    }
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(amount);
  };

  const formatNumber = (num?: number) => {
    if (num === undefined || num === null) {
      return '0';
    }
    return new Intl.NumberFormat('vi-VN').format(num);
  };

  const formatPercentage = (num?: number) => {
    if (num === undefined || num === null) {
      return '0%';
    }
    return `${num.toFixed(1)}%`;
  };

  const defectRate = stats.defectRate || 0;
  const isDefectRateHigh = defectRate > 5; // Consider >5% as high defect rate

  return (
    <div className={`grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4 ${className}`}>
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

      {/* Defect Rate */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">{t('defectRate')}</CardTitle>
          {isDefectRateHigh
            ? (
                <TrendingUp className="size-4 text-red-600" />
              )
            : (
                <TrendingDown className="size-4 text-green-600" />
              )}
        </CardHeader>
        <CardContent>
          <div className={`text-2xl font-bold ${isDefectRateHigh ? 'text-red-600' : 'text-green-600'}`}>
            {formatPercentage(defectRate)}
          </div>
          <p className="text-xs text-muted-foreground">
            {formatNumber(stats.totalDefectQuantity)}
            {' '}
            {t('defects')}
            {' '}
            /
            {' '}
            {formatNumber(stats.totalReceiptQuantity)}
            {' '}
            {t('total')}
          </p>
        </CardContent>
      </Card>

      {/* Total Cost */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">{t('totalCost')}</CardTitle>
          <DollarSign className="size-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{formatCurrency(stats.totalCost)}</div>
          <p className="text-xs text-muted-foreground">
            {t('actualReceiptCosts')}
          </p>
        </CardContent>
      </Card>

      {/* Quality Details */}
      <Card className="md:col-span-2 lg:col-span-2">
        <CardHeader>
          <CardTitle className="text-sm font-medium">{t('qualityOverview')}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">{t('defects')}</span>
                <span className="text-sm font-medium text-red-600">
                  {formatNumber(stats.totalDefectQuantity)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">{t('rework')}</span>
                <span className="text-sm font-medium text-yellow-600">
                  {formatNumber(stats.totalReworkQuantity)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">{t('goodUnits')}</span>
                <span className="text-sm font-medium text-green-600">
                  {formatNumber((stats.totalReceiptQuantity || 0) - (stats.totalDefectQuantity || 0) - (stats.totalReworkQuantity || 0))}
                </span>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">{t('avgQualityScore')}</span>
                <span className="text-sm font-medium">
                  {stats.averageQualityScore ? `${stats.averageQualityScore.toFixed(1)}/10` : t('na')}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">{t('thisWeek')}</span>
                <span className="text-sm font-medium">
                  {formatNumber(stats.thisWeek)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">{t('successRate')}</span>
                <span className="text-sm font-medium text-green-600">
                  {formatPercentage(100 - defectRate)}
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Recent Activity */}
      <Card className="md:col-span-2 lg:col-span-2">
        <CardHeader>
          <CardTitle className="text-sm font-medium">{t('recentActivity')}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center space-x-4">
              <Clock className="size-4 text-muted-foreground" />
              <div className="flex-1 space-y-1">
                <p className="text-sm font-medium">{t('today')}</p>
                <p className="text-xs text-muted-foreground">
                  {formatNumber(stats.today)}
                  {' '}
                  {t('receiptsProcessed')}
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <AlertTriangle className="size-4 text-muted-foreground" />
              <div className="flex-1 space-y-1">
                <p className="text-sm font-medium">{t('qualityIssues')}</p>
                <p className="text-xs text-muted-foreground">
                  {formatPercentage(defectRate)}
                  {' '}
                  {t('defectRate')}
                  {isDefectRateHigh && ` (${t('aboveThreshold')})`}
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <Users className="size-4 text-muted-foreground" />
              <div className="flex-1 space-y-1">
                <p className="text-sm font-medium">{t('processing')}</p>
                <p className="text-xs text-muted-foreground">
                  {t('multipleTeamsActive')}
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
