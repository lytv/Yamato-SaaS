/**
 * OutsourceOrder Receipt Management Page
 * Manages receipt tracking for specific order detail
 */

import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';

import { Button } from '@/components/ui/button';
import { OutsourceOrderReceiptList } from '@/features/outsourceOrderReceipt/OutsourceOrderReceiptList';

interface OutsourceOrderReceiptPageProps {
  params: {
    id: string;
    detailId: string;
  };
}

export default function OutsourceOrderReceiptPage({ 
  params 
}: OutsourceOrderReceiptPageProps) {
  const outsourceOrderId = parseInt(params.id);
  const outsourceOrderDetailId = parseInt(params.detailId);

  // Validate IDs
  if (isNaN(outsourceOrderId) || outsourceOrderId <= 0 || 
      isNaN(outsourceOrderDetailId) || outsourceOrderDetailId <= 0) {
    return (
      <div className="container mx-auto py-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <h1 className="text-xl font-bold text-red-800 mb-2">Invalid IDs</h1>
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

  return (
    <div className="container mx-auto py-6">
      {/* Breadcrumb Navigation */}
      <div className="mb-6">
        <div className="flex items-center gap-2 text-sm text-gray-500 mb-4">
          <Link href="/dashboard/outsourceOrders" className="hover:text-gray-700">
            Outsource Orders
          </Link>
          <span>/</span>
          <Link 
            href={`/dashboard/outsourceOrders/${outsourceOrderId}/details`}
            className="hover:text-gray-700"
          >
            Order #{outsourceOrderId}
          </Link>
          <span>/</span>
          <span className="text-gray-900 font-medium">Receipt Management</span>
        </div>
        
        {/* Back Button */}
        <Link href={`/dashboard/outsourceOrders/${outsourceOrderId}/details`}>
          <Button variant="outline" size="sm">
            <ArrowLeft className="mr-2 size-4" />
            Back to Order Details
          </Button>
        </Link>
      </div>

      {/* Receipt Management Component */}
      <OutsourceOrderReceiptList outsourceOrderDetailId={outsourceOrderDetailId} />
    </div>
  );
}
