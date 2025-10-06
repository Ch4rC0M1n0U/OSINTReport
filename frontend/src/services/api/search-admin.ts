import { api } from "../http";

export interface SearchStats {
  numberOfDocuments: number;
  isIndexing: boolean;
  fieldDistribution: Record<string, number>;
}

export interface ReindexResult {
  success: boolean;
  message: string;
  indexed: number;
}

export const searchAdminApi = {
  /**
   * Obtenir les statistiques de l'index MeiliSearch
   */
  async getStats() {
    const response = await api.get<SearchStats>("/search/stats");
    return response.data;
  },

  /**
   * Réindexer tous les rapports dans MeiliSearch
   */
  async reindex() {
    const response = await api.post<ReindexResult>("/search/reindex");
    return response.data;
  },
};
