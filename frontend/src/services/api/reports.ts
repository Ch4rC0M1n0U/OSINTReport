import { api } from "../http";

export interface Report {
  id: string;
  title: string;
  caseNumber?: string;
  investigationService?: string;
  investigationContext: string;
  urgencyLevel: "ROUTINE" | "URGENT" | "CRITICAL";
  classification: "PUBLIC" | "CONFIDENTIAL" | "SECRET";
  legalBasis?: string;
  keywords: string[];
  status: "DRAFT" | "PUBLISHED" | "ARCHIVED";
  issuedAt?: string;
  createdAt: string;
  updatedAt: string;
  owner: {
    id: string;
    firstName: string;
    lastName: string;
  };
  _count?: {
    modules: number;
    entities: number;
  };
}

export interface ReportModule {
  id: string;
  type: string;
  title: string;
  position: number;
  entityId?: string;
  payload: Record<string, any>;
  createdAt: string;
  updatedAt: string;
  entity?: {
    id: string;
    label: string;
    type: string;
  };
}

export interface ReportStats {
  modules: number;
  entities: number;
  researchRecords: number;
  attachments: number;
  correlations: number;
}

export interface CreateReportData {
  title: string;
  caseNumber?: string;
  investigationService?: string;
  investigationContext: string;
  urgencyLevel: "ROUTINE" | "URGENT" | "CRITICAL";
  classification: "PUBLIC" | "CONFIDENTIAL" | "SECRET";
  legalBasis?: string;
  keywords?: string[];
}

export interface UpdateReportData extends Partial<CreateReportData> {}

export interface CreateModuleData {
  type: string;
  title: string;
  entityId?: string;
  payload?: Record<string, any>;
}

export const reportsApi = {
  // Rapports
  async list(params?: {
    limit?: number;
    offset?: number;
    search?: string;
    status?: string;
  }) {
    const response = await api.get<{
      items: Report[];
      total: number;
      limit: number;
      offset: number;
    }>("/reports", { params });
    return response.data;
  },

  async getById(id: string) {
    const response = await api.get<{ report: Report }>(`/reports/${id}`);
    return response.data.report;
  },

  async create(data: CreateReportData) {
    const response = await api.post<{ report: Report }>("/reports", data);
    return response.data.report;
  },

  async update(id: string, data: UpdateReportData) {
    const response = await api.patch<{ report: Report }>(`/reports/${id}`, data);
    return response.data.report;
  },

  async delete(id: string) {
    await api.delete(`/reports/${id}`);
  },

  async duplicate(id: string) {
    const response = await api.post<{ report: Report }>(`/reports/${id}/duplicate`);
    return response.data.report;
  },

  async updateStatus(id: string, status: "DRAFT" | "PUBLISHED" | "ARCHIVED") {
    const response = await api.patch<{ report: Report }>(`/reports/${id}/status`, {
      status,
    });
    return response.data.report;
  },

  async getStats(id: string) {
    const response = await api.get<{ stats: ReportStats }>(`/reports/${id}/stats`);
    return response.data.stats;
  },

  async getDashboard() {
    const response = await api.get<{
      totalReports: number;
      recentReports: Report[];
      statusDistribution: Record<string, number>;
      reportsTimeline: Array<{ date: string; count: number }>;
    }>("/reports/dashboard");
    return response.data;
  },

  // Modules
  async listModules(reportId: string) {
    const response = await api.get<{ modules: ReportModule[] }>(
      `/reports/${reportId}/modules`
    );
    return response.data.modules;
  },

  async getModule(reportId: string, moduleId: string) {
    const response = await api.get<{ module: ReportModule }>(
      `/reports/${reportId}/modules/${moduleId}`
    );
    return response.data.module;
  },

  async createModule(reportId: string, data: CreateModuleData) {
    const response = await api.post<{ module: ReportModule }>(
      `/reports/${reportId}/modules`,
      data
    );
    return response.data.module;
  },

  async updateModule(
    reportId: string,
    moduleId: string,
    data: Partial<CreateModuleData>
  ) {
    const response = await api.patch<{ module: ReportModule }>(
      `/reports/${reportId}/modules/${moduleId}`,
      data
    );
    return response.data.module;
  },

  async deleteModule(reportId: string, moduleId: string) {
    await api.delete(`/reports/${reportId}/modules/${moduleId}`);
  },

  async reorderModules(reportId: string, moduleIds: string[]) {
    await api.post(`/reports/${reportId}/modules/reorder`, { moduleIds });
  },

  // Export PDF
  async exportPDF(reportId: string, watermark = true) {
    const response = await api.get(`/reports/${reportId}/export/pdf`, {
      params: { watermark: watermark ? "true" : "false" },
      responseType: "blob", // Important pour recevoir le PDF
    });
    return response.data as Blob;
  },

  async getExportInfo(reportId: string) {
    const response = await api.get<{
      available: boolean;
      formats: string[];
      filename: string;
      metadata: {
        classification: string;
        status: string;
        modulesCount: number;
        correlationsCount: number;
      };
    }>(`/reports/${reportId}/export`);
    return response.data;
  },
};
