import type {
  CreateWorkTableInput,
  UpdateWorkTableInput,
  WorkTableErrorResponse,
  WorkTableListParams,
  WorkTableResponse,
  WorkTablesResponse,
} from '@/types/workTable';

const API_BASE = '/api/work-tables';

export async function fetchWorkTables(params: Omit<WorkTableListParams, 'ownerId'>): Promise<WorkTablesResponse> {
  const searchParams = new URLSearchParams();

  // Add pagination params
  searchParams.append('page', params.page.toString());
  searchParams.append('limit', params.limit.toString());

  // Add search param
  if (params.search) {
    searchParams.append('search', params.search);
  }

  // Add sort params
  if (params.sortBy) {
    searchParams.append('sortBy', params.sortBy);
  }
  if (params.sortOrder) {
    searchParams.append('sortOrder', params.sortOrder);
  }

  // Add filter params
  if (params.tableType) {
    searchParams.append('tableType', params.tableType);
  }
  if (params.status) {
    searchParams.append('status', params.status);
  }
  if (params.department) {
    searchParams.append('department', params.department);
  }
  if (params.locationCode) {
    searchParams.append('locationCode', params.locationCode);
  }
  if (params.tableCategory) {
    searchParams.append('tableCategory', params.tableCategory.toString());
  }
  if (params.assignedOperator) {
    searchParams.append('assignedOperator', params.assignedOperator);
  }
  if (params.supervisor) {
    searchParams.append('supervisor', params.supervisor);
  }
  if (params.minCapacityPerDay) {
    searchParams.append('minCapacityPerDay', params.minCapacityPerDay.toString());
  }
  if (params.maxCapacityPerDay) {
    searchParams.append('maxCapacityPerDay', params.maxCapacityPerDay.toString());
  }
  if (params.minCapacityPerHour) {
    searchParams.append('minCapacityPerHour', params.minCapacityPerHour.toString());
  }
  if (params.maxCapacityPerHour) {
    searchParams.append('maxCapacityPerHour', params.maxCapacityPerHour.toString());
  }
  if (params.minUtilizationRate) {
    searchParams.append('minUtilizationRate', params.minUtilizationRate.toString());
  }
  if (params.maxUtilizationRate) {
    searchParams.append('maxUtilizationRate', params.maxUtilizationRate.toString());
  }
  if (params.minEfficiencyRating) {
    searchParams.append('minEfficiencyRating', params.minEfficiencyRating.toString());
  }
  if (params.maxEfficiencyRating) {
    searchParams.append('maxEfficiencyRating', params.maxEfficiencyRating.toString());
  }
  if (params.maintenanceDue !== undefined) {
    searchParams.append('maintenanceDue', params.maintenanceDue.toString());
  }
  if (params.warrantyExpiring !== undefined) {
    searchParams.append('warrantyExpiring', params.warrantyExpiring.toString());
  }

  const response = await fetch(`${API_BASE}?${searchParams.toString()}`);

  if (!response.ok) {
    const errorData: WorkTableErrorResponse = await response.json();
    throw new Error(errorData.error || 'Failed to fetch work tables');
  }

  return response.json();
}

export async function fetchWorkTable(id: number): Promise<WorkTableResponse> {
  const response = await fetch(`${API_BASE}/${id}`);

  if (!response.ok) {
    const errorData: WorkTableErrorResponse = await response.json();
    throw new Error(errorData.error || 'Failed to fetch work table');
  }

  return response.json();
}

export async function createWorkTable(data: CreateWorkTableInput): Promise<WorkTableResponse> {
  const { tableCode, tableName, tableDetail, tableType, ownerId } = data;
  const res = await fetch('/api/work-tables', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ tableCode, tableName, tableDetail, tableType, ownerId }),
  });
  if (!res.ok) {
    throw new Error(await res.text());
  }
  return res.json();
}

export async function updateWorkTable(id: number, data: UpdateWorkTableInput): Promise<WorkTableResponse> {
  const response = await fetch(`${API_BASE}/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const errorData: WorkTableErrorResponse = await response.json();
    throw new Error(errorData.error || 'Failed to update work table');
  }

  return response.json();
}

export async function deleteWorkTable(id: number): Promise<{ success: true; message: string }> {
  const response = await fetch(`${API_BASE}/${id}`, {
    method: 'DELETE',
  });

  if (!response.ok) {
    const errorData: WorkTableErrorResponse = await response.json();
    throw new Error(errorData.error || 'Failed to delete work table');
  }

  return response.json();
}
