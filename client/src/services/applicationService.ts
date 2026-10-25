import { apiGet } from './apiClient';
import { Application } from '@saksham/shared';

export interface ApplicationFilterOptions {
  search?: string;
  stage?: string;
  region?: string;
  priority?: string;
  category?: string;
  limit?: number;
  offset?: number;
}

export interface ApplicationsResponse {
  success: boolean;
  total: number;
  data: Application[];
}

export interface ApplicationDetailResponse {
  success: boolean;
  data: Application & {
    scrutinyFindings?: any[];
    evcInspections?: any[];
    complianceItems?: any[];
    validityDocuments?: any[];
  };
}

export const fetchApplications = async (
  filters: ApplicationFilterOptions = {}
): Promise<ApplicationsResponse> => {
  return apiGet<ApplicationsResponse>('/applications', {
    search: filters.search,
    stage: filters.stage && filters.stage !== 'ALL' ? filters.stage : undefined,
    region: filters.region && filters.region !== 'ALL' ? filters.region : undefined,
    priority: filters.priority && filters.priority !== 'ALL' ? filters.priority : undefined,
    category: filters.category && filters.category !== 'ALL' ? filters.category : undefined,
    limit: filters.limit,
    offset: filters.offset,
  });
};

export const fetchApplicationById = async (
  id: string
): Promise<ApplicationDetailResponse> => {
  return apiGet<ApplicationDetailResponse>(`/applications/${encodeURIComponent(id)}`);
};
