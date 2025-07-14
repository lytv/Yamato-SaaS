import { useQuery } from '@tanstack/react-query';
import { SalaryDetailsResponse, SalaryDetailsParams } from '@/types/salaryDetails';

async function fetchSalaryDetails(params: SalaryDetailsParams): Promise<SalaryDetailsResponse> {
  const searchParams = new URLSearchParams();
  
  if (params.search) searchParams.set('search', params.search);
  if (params.userIds) searchParams.set('userIds', params.userIds);
  searchParams.set('startDate', params.startDate);
  searchParams.set('endDate', params.endDate);
  if (params.sortBy) searchParams.set('sortBy', params.sortBy);
  if (params.sortOrder) searchParams.set('sortOrder', params.sortOrder);
  if (params.page) searchParams.set('page', params.page.toString());
  if (params.limit) searchParams.set('limit', params.limit.toString());
  if (params.showAll) searchParams.set('showAll', params.showAll.toString());

  const response = await fetch(`/api/salary-details?${searchParams}`);
  
  if (!response.ok) {
    throw new Error('Failed to fetch salary details');
  }
  
  return response.json();
}

export function useSalaryDetails(params: SalaryDetailsParams, enabled: boolean = true) {
  return useQuery({
    queryKey: ['salary-details', params],
    queryFn: () => fetchSalaryDetails(params),
    enabled: enabled && !!params.startDate && !!params.endDate,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}