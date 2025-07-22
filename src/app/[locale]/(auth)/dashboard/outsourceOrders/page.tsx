/**
 * OutsourceOrder Dashboard Page - Integrated View
 * Combined master-detail view for better management
 */

import { OutsourceOrderIntegratedList } from '@/features/outsourceOrder/OutsourceOrderIntegratedList';

export default function OutsourceOrdersPage() {
  return (
    <div className="container mx-auto py-6">
      <OutsourceOrderIntegratedList />
    </div>
  );
}