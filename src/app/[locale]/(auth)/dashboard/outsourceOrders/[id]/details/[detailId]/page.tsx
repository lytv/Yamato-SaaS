/**
 * OutsourceOrder Detail Overview Page
 * Shows detail information with tabs for receipts and other actions
 */

import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';

import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { OutsourceOrderReceiptList } from '@/features/outsourceOrderReceipt/OutsourceOrderReceiptList';
import { OutsourceOrderReceiptSummary } from '@/features/outsourceOrderReceipt/OutsourceOrderReceiptSummary';

type OutsourceOrderDetailOverviewPageProps = {
  params: {
    id: string;
    detailId: string;
  };
};

export default function OutsourceOrderDetailOverviewPage({
  params,
}: OutsourceOrderDetailOverviewPageProps) {
  const outsourceOrderId = Number.parseInt(params.id);
  const outsourceOrderDetailId = Number.parseInt(params.detailId);

  // Validate IDs
  if (isNaN(outsourceOrderId) || outsourceOrderId <= 0
    || isNaN(outsourceOrderDetailId) || outsourceOrderDetailId <= 0) {
    return (
      <div className="container mx-auto py-6">
        <div className="rounded-lg border border-red-200 bg-red-50 p-6">
          <h1 className="mb-2 text-xl font-bold text-red-800">Invalid IDs</h1>
          <p className="text-red-600">
            The order ID or detail ID provided is not valid. Please check the URL and try again.
          </p>
          <Link href="/dashboard/outsourceOrders">
            <Button variant="outline" className="mt-4">
              <ArrowLeft className="mr-2 size-4" />
              Back to Orders
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  const t = useTranslations('OutsourceOrderReceiptTabs');

  return (
    <div className="container mx-auto py-6">
      {/* Breadcrumb Navigation */}
      <div className="mb-6">
        <div className="mb-4 flex items-center gap-2 text-sm text-gray-500">
          <Link href="/dashboard/outsourceOrders" className="hover:text-gray-700">
            Outsource Orders
          </Link>
          <span>/</span>
          <Link
            href={`/dashboard/outsourceOrders/${outsourceOrderId}/details`}
            className="hover:text-gray-700"
          >
            Order #
            {outsourceOrderId}
          </Link>
          <span>/</span>
          <span className="font-medium text-gray-900">
            Detail #
            {outsourceOrderDetailId}
          </span>
        </div>

        {/* Back Button */}
        <Link href={`/dashboard/outsourceOrders/${outsourceOrderId}/details`}>
          <Button variant="outline" size="sm">
            <ArrowLeft className="mr-2 size-4" />
            {t('backToOrderDetails')}
          </Button>
        </Link>
      </div>

      {/* Detail Management Tabs */}
      <div className="rounded-lg border bg-white shadow-sm">
        <Tabs defaultValue="receipts" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="receipts">{t('receiptManagement')}</TabsTrigger>
            <TabsTrigger value="summary">{t('statisticsSummary')}</TabsTrigger>
          </TabsList>

          <TabsContent value="receipts" className="p-6">
            <OutsourceOrderReceiptList outsourceOrderDetailId={outsourceOrderDetailId} />
          </TabsContent>

          <TabsContent value="summary" className="p-6">
            <OutsourceOrderReceiptSummary outsourceOrderDetailId={outsourceOrderDetailId} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
