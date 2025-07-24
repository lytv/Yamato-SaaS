import type { EmployeeSalaryEntry, EmployeeSalaryEntryFormData, EmployeeSalaryEntryListParamsWithOwner, EmployeeSalaryEntrysResponse, UpdateEmployeeSalaryEntryInput } from '@/types/employeeSalaryEntry';

export async function createEmployeeSalaryEntry(data: EmployeeSalaryEntryFormData): Promise<EmployeeSalaryEntry> {
  const res = await fetch('/api/employeeSalaryEntries', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    throw new Error('Failed to create');
  }
  const json = await res.json();
  return json.data;
}

export async function updateEmployeeSalaryEntry(id: number, data: UpdateEmployeeSalaryEntryInput): Promise<EmployeeSalaryEntry> {
  const res = await fetch(`/api/employeeSalaryEntries/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    throw new Error('Failed to update');
  }
  const json = await res.json();
  return json.data;
}

export async function deleteEmployeeSalaryEntry(id: number): Promise<void> {
  const res = await fetch(`/api/employeeSalaryEntries/${id}`, { method: 'DELETE' });
  if (!res.ok) {
    throw new Error('Failed to delete');
  }
}

export async function fetchEmployeeSalaryEntrys(params: EmployeeSalaryEntryListParamsWithOwner): Promise<EmployeeSalaryEntrysResponse> {
  const url = new URL('/api/employeeSalaryEntries', window.location.origin);
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined) {
      url.searchParams.append(key, String(value));
    }
  });
  const res = await fetch(url.toString());
  if (!res.ok) {
    throw new Error('Failed to fetch employeeSalaryEntrys');
  }
  return await res.json();
}
