import { apiGet } from './apiClient';
import { DocumentValidityItem } from '@saksham/shared';

export interface DocumentResponse {
  success: boolean;
  total: number;
  data: DocumentValidityItem[];
}

export const fetchDocumentValidityItems = async (filters: {
  validityStatus?: string;
  documentType?: string;
} = {}): Promise<DocumentValidityItem[]> => {
  const response = await apiGet<DocumentResponse>('/documents', {
    validityStatus: filters.validityStatus && filters.validityStatus !== 'ALL' ? filters.validityStatus : undefined,
    documentType: filters.documentType && filters.documentType !== 'ALL' ? filters.documentType : undefined,
  });
  return response.data;
};
