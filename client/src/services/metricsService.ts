import { apiGet } from './apiClient';
import { DashboardMetrics } from '@saksham/shared';

export interface MetricsResponse {
  success: boolean;
  data: DashboardMetrics;
}

export const fetchDashboardMetrics = async (): Promise<DashboardMetrics> => {
  const response = await apiGet<MetricsResponse>('/metrics');
  return response.data;
};
