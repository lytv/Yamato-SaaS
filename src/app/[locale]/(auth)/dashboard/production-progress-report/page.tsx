/**
 * Production Progress Report Page with Tabs
 * Following Yamato-SaaS patterns and TDD practices
 */

'use client';

import { useTranslations } from 'next-intl';
import { Suspense, useState } from 'react';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ProductionProgressPivotProvider } from '@/contexts/ProductionProgressPivotContext';
import { ProductionProgressReportFilter } from '@/features/productionProgressReport/ProductionProgressReportFilter';
import { ProductionProgressReportList } from '@/features/productionProgressReport/ProductionProgressReportList';
import { ProductionProgressReportSkeleton } from '@/features/productionProgressReport/ProductionProgressReportSkeleton';
import { ProductionProgressPivotFilter } from '@/features/productionProgressPivot/ProductionProgressPivotFilter';
import { ProductionProgressPivotList } from '@/features/productionProgressPivot/ProductionProgressPivotList';
import { ProductionProgressPivotSkeleton } from '@/features/productionProgressPivot/ProductionProgressPivotSkeleton';

export default function ProductionProgressReportPage(): JSX.Element {
  const t = useTranslations('productionProgressReport.page');
  const [activeTab, setActiveTab] = useState('pivot');

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="border-b border-gray-200 pb-5">
        <h1 className="text-2xl font-bold leading-7 text-gray-900 sm:truncate sm:text-3xl sm:tracking-tight">
          {t('title', { defaultValue: 'Báo cáo Tiến độ Sản xuất' })}
        </h1>
        <p className="mt-1 text-sm text-gray-500">
          {t('description', { defaultValue: 'Theo dõi và quản lý tiến độ sản xuất' })}
        </p>
      </div>

      {/* Tabs Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="pivot">
            {t('tabs.pivot', { defaultValue: 'Báo cáo Tổng hợp' })}
          </TabsTrigger>
          <TabsTrigger value="detailed">
            {t('tabs.detailed', { defaultValue: 'Báo cáo Chi tiết' })}
          </TabsTrigger>
        </TabsList>

        {/* Pivot Report Tab */}
        <TabsContent value="pivot" className="space-y-6">
          <ProductionProgressPivotProvider>
            <Suspense fallback={<ProductionProgressPivotSkeleton />}>
              <div className="space-y-6">
                <ProductionProgressPivotFilter />
                <ProductionProgressPivotList />
              </div>
            </Suspense>
          </ProductionProgressPivotProvider>
        </TabsContent>

        {/* Detailed Report Tab */}
        <TabsContent value="detailed" className="space-y-6">
          <Suspense fallback={<ProductionProgressReportSkeleton />}>
            <div className="space-y-6">
              <ProductionProgressReportFilter />
              <ProductionProgressReportList />
            </div>
          </Suspense>
        </TabsContent>
      </Tabs>
    </div>
  );
}