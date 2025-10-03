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
    const response = await api.post<CorrelationCheckResult>("/correlations/check", {
      reportId,
      value,
      type,
    });
    return response.data;
  },

  async detect(reportId: string) {
    const response = await api.post<{ correlations: Correlation[] }>(
      `/correlations/reports/${reportId}/detect`
    );
    return response.data.correlations;
  },

  async list(reportId: string, params?: { type?: CorrelationType; verified?: boolean }) {
    const response = await api.get<{ correlations: Correlation[] }>(
      `/correlations/reports/${reportId}`,
      { params }
    );
    return response.data.correlations;
  },

  async verify(id: string, notes?: string) {
    const response = await api.patch<{ correlation: Correlation }>(
      `/correlations/${id}/verify`,
      { notes }
    );
    return response.data.correlation;
  },

  async delete(id: string) {
    await api.delete(`/correlations/${id}`);
  },
};
