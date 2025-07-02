/**
 * Processs API Client
 * Handles all HTTP requests to process endpoints
 * Following Yamato-SaaS patterns and error handling
 */

import type {
  Process,
  ProcessErrorResponse,
  ProcessFormData,
  ProcessListParams,
  ProcessResponse,
  ProcesssResponse,
  UpdateProcessInput,
} from '@/types/process';

/**
 * Fetch paginated processs list
 */
export async function fetchProcesss(
  params: ProcessListParams,
): Promise<ProcesssResponse | ProcessErrorResponse> {
  const definedParams: Record<string, string> = {};

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined) {
      definedParams[key] = String(value);
    }
  });

  const queryParams = new URLSearchParams(definedParams);

  try {
    const response = await fetch(`/api/processes?${queryParams.toString()}`);
    return await response.json();
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Network error',
      code: 'NETWORK_ERROR',
    };
  }
}

/**
 * Fetch single process by ID
 */
export async function fetchProcess(id: number): Promise<Process> {
  const response = await fetch(`/api/processes/${id}`);

  if (!response.ok) {
    const error: ProcessErrorResponse = await response.json();
    throw new Error(error.error || 'Failed to fetch process');
  }

  const result: ProcessResponse = await response.json();
  return result.data;
}

/**
 * Create new process
 */
export async function createProcess(data: ProcessFormData): Promise<Process> {
  const response = await fetch('/api/processes', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error: ProcessErrorResponse = await response.json();
    throw new Error(error.error || 'Failed to create process');
  }

  const result: ProcessResponse = await response.json();
  return result.data;
}

/**
 * Update existing process
 */
export async function updateProcess(id: number, data: UpdateProcessInput): Promise<Process> {
  const response = await fetch(`/api/processes/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error: ProcessErrorResponse = await response.json();
    throw new Error(error.error || 'Failed to update process');
  }

  const result: ProcessResponse = await response.json();
  return result.data;
}

/**
 * Delete process
 */
export async function deleteProcess(id: number): Promise<void> {
  const response = await fetch(`/api/processes/${id}`, {
    method: 'DELETE',
  });

  if (!response.ok) {
    const error: ProcessErrorResponse = await response.json();
    throw new Error(error.error || 'Failed to delete process');
  }
}
