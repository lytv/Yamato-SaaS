/**
 * OutsourceOrder Details Page
 * Master-Detail page showing order summary and details management
 */

import { OutsourceOrderDetailList } from '@/features/outsourceOrderDetail/OutsourceOrderDetailList';

interface OutsourceOrderDetailsPageProps {
  params: {
    id: string;
  };
}

export default function OutsourceOrderDetailsPage({ 
  params 
}: OutsourceOrderDetailsPageProps) {
  const outsourceOrderId = parseInt(params.id);

  // Validate ID
  if (isNaN(outsourceOrderId) || outsourceOrderId <= 0) {
    return (
      <div className="container mx-auto py-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <h1 className="text-xl font-bold text-red-800 mb-2">Invalid Order ID</h1>
          <p className="text-red-600">
            The order ID provided is not valid. Please check the URL and try again.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6">
      <OutsourceOrderDetailList outsourceOrderId={outsourceOrderId} />
    </div>
  );
}
