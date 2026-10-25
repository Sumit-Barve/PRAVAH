import { apiGet } from './apiClient';
import { RegulatoryRule } from '@saksham/shared';

export interface RulesResponse {
  success: boolean;
  total: number;
  data: RegulatoryRule[];
}

export const fetchRegulatoryRules = async (filters: {
  category?: string;
  verificationStatus?: string;
} = {}): Promise<RegulatoryRule[]> => {
  const response = await apiGet<RulesResponse>('/rules', {
    category: filters.category && filters.category !== 'ALL' ? filters.category : undefined,
    verificationStatus: filters.verificationStatus && filters.verificationStatus !== 'ALL' ? filters.verificationStatus : undefined,
  });
  return response.data;
};
