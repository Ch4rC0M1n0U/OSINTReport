import { api } from "../http";

export interface AuditLog {
  id: string;
  userId: string | null;
  action: string;
  resource: string;
  resourceId: string | null;
  details: Record<string, any> | null;
  ipAddress: string | null;
  userAgent: string | null;
  timestamp: string;
  user: {
    id: string;
    firstName: string;
    lastName: string;
    matricule: string;
    email: string;
    grade: string | null;
    unit: string | null;
  } | null;
}

export interface AuditLogFilters {
  page?: number;
  limit?: number;
  userId?: string;
  action?: string;
  resource?: string;
  resourceId?: string;
  startDate?: string;
  endDate?: string;
  search?: string;
}

export interface AuditLogResponse {
  data: AuditLog[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface AuditStats {
  totalLogs: number;
  actionStats: Array<{
    action: string;
    count: number;
  }>;
  resourceStats: Array<{
    resource: string;
    count: number;
  }>;
  userStats: Array<{
    userId: string | null;
    count: number;
    user: {
      id: string;
      firstName: string;
      lastName: string;
      matricule: string;
    } | null;
  }>;
}

export const auditApi = {
  /**
   * Récupérer les logs d'audit avec filtres
   */
  async getLogs(filters: AuditLogFilters = {}): Promise<AuditLogResponse> {
    const params = new URLSearchParams();

    if (filters.page) params.append("page", filters.page.toString());
    if (filters.limit) params.append("limit", filters.limit.toString());
    if (filters.userId) params.append("userId", filters.userId);
    if (filters.action) params.append("action", filters.action);
    if (filters.resource) params.append("resource", filters.resource);
    if (filters.resourceId) params.append("resourceId", filters.resourceId);
    if (filters.startDate) params.append("startDate", filters.startDate);
    if (filters.endDate) params.append("endDate", filters.endDate);
    if (filters.search) params.append("search", filters.search);

    const response = await api.get(`/audit-logs?${params.toString()}`);
    return response.data;
  },

  /**
   * Récupérer les statistiques des logs
   */
  async getStats(startDate?: string, endDate?: string): Promise<AuditStats> {
    const params = new URLSearchParams();
    if (startDate) params.append("startDate", startDate);
    if (endDate) params.append("endDate", endDate);

    const response = await api.get(`/audit-logs/stats?${params.toString()}`);
    return response.data;
  },

  /**
   * Récupérer la liste des actions disponibles
   */
  async getActions(): Promise<string[]> {
    const response = await api.get("/audit-logs/actions");
    return response.data;
  },

  /**
   * Récupérer la liste des ressources disponibles
   */
  async getResources(): Promise<string[]> {
    const response = await api.get("/audit-logs/resources");
    return response.data;
  },
};
