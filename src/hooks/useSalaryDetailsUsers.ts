import { useQuery } from '@tanstack/react-query';

interface UserOption {
  value: string;
  label: string;
  shortcut?: string;
  email: string;
}

interface UsersResponse {
  success: boolean;
  data: UserOption[];
}

async function fetchUserOptions(): Promise<UsersResponse> {
  const response = await fetch('/api/salary-details/users');
  
  if (!response.ok) {
    throw new Error('Failed to fetch user options');
  }
  
  return response.json();
}

export function useSalaryDetailsUsers() {
  return useQuery({
    queryKey: ['salary-details-users'],
    queryFn: fetchUserOptions,
    staleTime: 1000 * 60 * 10, // 10 minutes
    select: (data) => data.data || [],
  });
}