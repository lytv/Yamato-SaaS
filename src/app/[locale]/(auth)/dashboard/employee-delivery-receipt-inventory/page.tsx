/**
 * Employee Delivery Receipt Inventory Page
 * Following Yamato-SaaS patterns and dashboard layout
 */

import type { Metadata } from 'next';
import { useTranslations } from 'next-intl';
import { getTranslations } from 'next-intl/server';

import { EmployeeDeliveryReceiptInventoryList } from '@/features/employeeDeliveryReceiptInventory/EmployeeDeliveryReceiptInventoryList';

type Props = {
  params: { locale: string };
};

export async function generateMetadata({ params: { locale } }: Props): Promise<Metadata> {
  const t = await getTranslations({ locale, namespace: 'employeeDeliveryReceiptInventory.page' });

  return {
    title: t('title'),
    description: t('description'),
  };
}

export default function EmployeeDeliveryReceiptInventoryPage(): JSX.Element {
  const t = useTranslations('employeeDeliveryReceiptInventory.page');

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="border-b border-gray-200 pb-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{t('title')}</h1>
            <p className="mt-1 text-sm text-gray-500">{t('description')}</p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <EmployeeDeliveryReceiptInventoryList />
    </div>
  );
}