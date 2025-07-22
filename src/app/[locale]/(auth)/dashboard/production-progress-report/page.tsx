/**
 * Production Progress Report Page
 * Following Yamato-SaaS patterns and TDD practices
 */

import type { Metadata } from 'next';
import { useTranslations } from 'next-intl';
import { getTranslations } from 'next-intl/server';
import { Suspense } from 'react';

import { ProductionProgressReportFilter } from '@/features/productionProgressReport/ProductionProgressReportFilter';
import { ProductionProgressReportList } from '@/features/productionProgressReport/ProductionProgressReportList';
import { ProductionProgressReportSkeleton } from '@/features/productionProgressReport/ProductionProgressReportSkeleton';

type Props = {
  params: { locale: string };
};

export async function generateMetadata({ params: { locale } }: Props): Promise<Metadata> {
  const t = await getTranslations({ locale, namespace: 'productionProgressReport.page' });

  return {
    title: t('title'),
    description: t('description'),
  };
}

export default function ProductionProgressReportPage(): JSX.Element {
  const t = useTranslations('productionProgressReport.page');

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="border-b border-gray-200 pb-5">
        <h1 className="text-2xl font-bold leading-7 text-gray-900 sm:truncate sm:text-3xl sm:tracking-tight">
          {t('title')}
        </h1>
        <p className="mt-1 text-sm text-gray-500">
          {t('description')}
        </p>
      </div>

      {/* Content */}
      <Suspense fallback={<ProductionProgressReportSkeleton />}>
        <div className="space-y-6">
          <ProductionProgressReportFilter />
          <ProductionProgressReportList />
        </div>
      </Suspense>
    </div>
  );
}