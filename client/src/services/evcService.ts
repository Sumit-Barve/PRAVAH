import { apiGet } from './apiClient';
import { EVCInspection } from '@saksham/shared';

export interface EVCResponse {
  success: boolean;
  total: number;
  data: EVCInspection[];
}

export const fetchEVCInspections = async (filters: {
  status?: string;
  region?: string;
} = {}): Promise<EVCInspection[]> => {
  const response = await apiGet<EVCResponse>('/evc', {
    status: filters.status && filters.status !== 'ALL' ? filters.status : undefined,
    region: filters.region && filters.region !== 'ALL' ? filters.region : undefined,
  });
  return response.data;
};
