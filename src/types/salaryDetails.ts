export type SalaryDetail = {
  user_id: string;
  full_name: string;
  work_date: string;
  source_table: 'employee_salary' | 'outsource_receipt';
  product_code: string;
  product_name: string;
  step_code: string;
  step_name: string;
  quantity: number;
  unit_price: number;
  line_total: number;
};

export type UserSummary = {
  user_id: string;
  full_name: string;
  total_amount: number;
  record_count: number;
};

export type SalaryDetailsResponse = {
  success: boolean;
  data: SalaryDetail[];
  pagination?: {
    page: number;
    limit: number;
    total: number;
    hasMore: boolean;
    totalPages: number;
  };
  summary: {
    total_records: number;
    total_amount: number;
    user_summary: UserSummary[];
    date_range: {
      start_date: string;
      end_date: string;
    };
  };
};

export type SalaryDetailsFilters = {
  search: string;
  userIds: string[];
  startDate: string;
  endDate: string;
  sortBy: 'work_date' | 'full_name' | 'product_code' | 'step_code' | 'quantity' | 'unit_price' | 'line_total';
  sortOrder: 'asc' | 'desc';
  showAll: boolean;
};

export type SalaryDetailsParams = {
  search?: string;
  userIds?: string;
  startDate: string;
  endDate: string;
  sortBy?: string;
  sortOrder?: string;
  page?: number;
  limit?: number;
  showAll?: boolean;
};
