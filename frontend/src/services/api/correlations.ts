import { api } from "../http";

export type CorrelationType = "PHONE" | "EMAIL" | "NAME" | "ADDRESS" | "ACCOUNT";

export interface Correlation {
  id: string;
  sourceReportId: string;
  targetReportId: string;
  type: CorrelationType;
  value: string;
  confidenceScore: number;
  verified: boolean;
  verifiedAt?: string;
  verifiedById?: string;
  notes?: string;
  createdAt: string;
  sourceReport?: {
    id: string;
    title: string;
    caseNumber?: string;
  };
  targetReport?: {
    id: string;
    title: string;
    caseNumber?: string;
  };
}

export interface CorrelationCheckResult {
  found: boolean;
  matches: Array<{
    reportId: string;
    reportTitle: string;
    caseNumber?: string;
    matchedValue: string;
    moduleType: string;
  }>;
  totalMatches: number;
}

export const correlationsApi = {
  async check(reportId: string, value: string, type: CorrelationType) {
    const response = await api.post<{ success: boolean; data: CorrelationCheckResult }>(
      "/correlations/check",
      { reportId, value, type }
    );
    return response.data.data;
  },

  async detect(reportId: string) {
    const response = await api.post<{ success: boolean; message: string }>(
      `/correlations/reports/${reportId}/detect`
    );
    // La détection ne retourne pas les corrélations, juste un message de succès
    // Il faut ensuite appeler list() pour récupérer les corrélations
    return [];
  },

  async list(reportId: string, params?: { type?: CorrelationType; verified?: boolean }) {
    const response = await api.get<{ success: boolean; data: Correlation[]; meta: { total: number } }>(
      `/correlations/reports/${reportId}`,
      { params }
    );
    return response.data.data;
  },

  async verify(id: string, notes?: string) {
    const response = await api.patch<{ success: boolean; data: Correlation }>(
      `/correlations/${id}/verify`,
      { notes }
    );
    return response.data.data;
  },

  async delete(id: string) {
    await api.delete(`/correlations/${id}`);
  },
};
