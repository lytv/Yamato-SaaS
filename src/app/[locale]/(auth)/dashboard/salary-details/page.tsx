import type { Metadata } from 'next';

import { SalaryDetailsList } from '@/features/salaryDetails/SalaryDetailsList';

export const metadata: Metadata = {
  title: 'Chi tiết lương | Yamato SaaS',
  description: 'Xem chi tiết lương của nhân viên và gia công',
};

export default function SalaryDetailsPage() {
  return (
    <div className="container mx-auto py-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Chi tiết lương</h1>
          <p className="text-muted-foreground">
            Xem chi tiết thông tin tính lương cho nhân viên và công việc gia công
          </p>
        </div>
      </div>

      <SalaryDetailsList />
    </div>
  );
}
