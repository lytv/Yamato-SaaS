/**
 * OutsourceOrder Details Page
 * Master-Detail page showing order summary and details management
 */

import { OutsourceOrderDetailList } from '@/features/outsourceOrderDetail/OutsourceOrderDetailList';

type OutsourceOrderDetailsPageProps = {
  params: {
    id: string;
  };
};

export default function OutsourceOrderDetailsPage({
  params,
}: OutsourceOrderDetailsPageProps) {
  const outsourceOrderId = Number.parseInt(params.id);

  // Validate ID
  if (Number.isNaN(outsourceOrderId) || outsourceOrderId <= 0) {
    return (
      <div className="container mx-auto py-6">
        <div className="rounded-lg border border-red-200 bg-red-50 p-6">
          <h1 className="mb-2 text-xl font-bold text-red-800">Invalid Order ID</h1>
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
