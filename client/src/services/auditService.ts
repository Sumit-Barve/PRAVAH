import { apiGet } from './apiClient';
import { AuditLogEntry } from '@saksham/shared';

export interface AuditResponse {
  success: boolean;
  total: number;
  data: AuditLogEntry[];
}

export const fetchAuditLogs = async (filters: {
  entityType?: string;
  actorRole?: string;
  limit?: number;
} = {}): Promise<AuditLogEntry[]> => {
  const response = await apiGet<AuditResponse>('/audit', {
    entityType: filters.entityType && filters.entityType !== 'ALL' ? filters.entityType : undefined,
    actorRole: filters.actorRole && filters.actorRole !== 'ALL' ? filters.actorRole : undefined,
    limit: filters.limit,
  });
  return response.data;
};
