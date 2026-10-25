import { apiGet } from './apiClient';
import { ComplianceItem } from '@saksham/shared';

export interface ComplianceResponse {
  success: boolean;
  total: number;
  data: ComplianceItem[];
}

export const fetchComplianceItems = async (filters: {
  status?: string;
  overdueOnly?: boolean;
} = {}): Promise<ComplianceItem[]> => {
  const response = await apiGet<ComplianceResponse>('/compliance', {
    status: filters.status && filters.status !== 'ALL' ? filters.status : undefined,
    overdueOnly: filters.overdueOnly ? true : undefined,
  });
  return response.data;
};
